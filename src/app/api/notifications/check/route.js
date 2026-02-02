import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST /api/notifications/check
// OPTIMIZED: Uses parallel queries, batch operations, and minimal DB hits
// Rate: Called by care worker dashboard, typically every 30-60 seconds
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId;

        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 2); // Include tomorrow fully

        // OPTIMIZATION: Single transaction to fetch all needed data
        const [upcomingShifts, activeClockIn, existingNotifications, policyData] = await prisma.$transaction([
            // 1. Get upcoming shifts for user
            prisma.shiftAssignment.findMany({
                where: {
                    userId,
                    date: { gte: todayStart, lte: tomorrow },
                    status: 'SCHEDULED'
                },
                select: {
                    id: true,
                    date: true,
                    shift: {
                        select: {
                            startTime: true,
                            serviceSeeker: {
                                select: { firstName: true, lastName: true }
                            }
                        }
                    }
                },
                take: 10 // Limit to prevent large result sets
            }),
            // 2. Get active clock-in
            prisma.clockInOut.findFirst({
                where: { userId, clockOutTime: null },
                select: {
                    serviceSeekerId: true,
                    serviceSeeker: {
                        select: { firstName: true, lastName: true, preferredName: true }
                    }
                }
            }),
            // 3. Get ALL today's notifications in one query
            prisma.notification.findMany({
                where: {
                    userId,
                    createdAt: { gte: todayStart }
                },
                select: { title: true, message: true }
            }),
            // 4. Get policy signature counts (optimized raw query)
            prisma.$queryRaw`
                SELECT 
                    (SELECT COUNT(*) FROM Policy) as totalPolicies,
                    (SELECT COUNT(*) FROM PolicySignature WHERE userId = ${userId}) as signedCount
            `
        ]);

        // Create Set for O(1) existing notification lookup
        const existingKeys = new Set(existingNotifications.map(n => `${n.title}|${n.message?.substring(0, 30)}`));
        const notificationsToCreate = [];

        // 1. Process Upcoming Shifts (filter in memory - faster than multiple DB calls)
        const validShifts = upcomingShifts.filter(assignment => {
            const shiftDate = new Date(assignment.date);
            const [hours, minutes] = assignment.shift.startTime.split(':').map(Number);
            shiftDate.setHours(hours, minutes, 0, 0);
            const diffHours = (shiftDate - now) / (1000 * 60 * 60);
            return diffHours > -1 && diffHours <= 2;
        });

        for (const assignment of validShifts) {
            const title = `Upcoming Shift: ${assignment.shift.serviceSeeker.firstName}`;
            const message = `You have a shift with ${assignment.shift.serviceSeeker.firstName} ${assignment.shift.serviceSeeker.lastName} starting at ${assignment.shift.startTime}.`;
            const key = `${title}|${message.substring(0, 30)}`;

            if (!existingKeys.has(key)) {
                notificationsToCreate.push({
                    userId,
                    title,
                    message,
                    type: 'INFO',
                    link: '/care-worker/rota',
                    isRead: false
                });
                existingKeys.add(key);
            }
        }

        // 2. Process Upcoming Visits (only if clocked in)
        if (activeClockIn?.serviceSeekerId) {
            // Fetch visits in a separate quick query
            const upcomingVisits = await prisma.serviceSeekerCalendarEntry.findMany({
                where: {
                    serviceSeekerId: activeClockIn.serviceSeekerId,
                    entryType: { in: ['FAMILY_VISIT', 'PROFESSIONAL_VISIT'] },
                    date: { gte: todayStart, lte: tomorrow },
                    completed: null
                },
                select: { id: true, name: true, date: true, time: true, entryType: true },
                take: 10,
                orderBy: [{ date: 'asc' }, { time: 'asc' }]
            });

            const serviceSeeker = activeClockIn.serviceSeeker;
            for (const visit of upcomingVisits) {
                const visitDate = new Date(visit.date);
                const isToday = visitDate.toDateString() === now.toDateString();
                const dateLabel = isToday ? 'Today' : 'Tomorrow';
                const visitorType = visit.entryType === 'FAMILY_VISIT' ? 'Family' : 'Professional';

                const title = `Upcoming Visit: ${visit.name || 'Visitor'}`;
                const message = `${visitorType} visit for ${serviceSeeker?.preferredName || serviceSeeker?.firstName} scheduled ${dateLabel} at ${visit.time || 'TBA'}.`;
                const key = `${title}|${message.substring(0, 30)}`;

                if (!existingKeys.has(key)) {
                    notificationsToCreate.push({
                        userId,
                        title,
                        message,
                        type: 'INFO',
                        link: '/care-worker/visits',
                        isRead: false
                    });
                    existingKeys.add(key);
                }
            }
        }

        // 3. Process Pending Policy Signatures (from pre-fetched data)
        const { totalPolicies, signedCount } = policyData[0] || { totalPolicies: 0, signedCount: 0 };
        const unsignedCount = Number(totalPolicies) - Number(signedCount);

        if (unsignedCount > 0) {
            const policyKey = `Pending Policy Signatures|You have`;
            const hasExistingPolicyNotif = existingNotifications.some(n =>
                n.title === 'Pending Policy Signatures'
            );

            if (!hasExistingPolicyNotif) {
                notificationsToCreate.push({
                    userId,
                    title: 'Pending Policy Signatures',
                    message: `You have ${unsignedCount} policy/ies awaiting your signature.`,
                    type: 'WARNING',
                    link: '/care-worker/policies',
                    isRead: false
                });
            }
        }

        // OPTIMIZATION: Batch create all notifications at once
        let newNotifications = 0;
        if (notificationsToCreate.length > 0) {
            await prisma.notification.createMany({
                data: notificationsToCreate,
                skipDuplicates: true
            });
            newNotifications = notificationsToCreate.length;
        }

        return NextResponse.json({ success: true, newNotifications });
    } catch (error) {
        console.error('Check notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
