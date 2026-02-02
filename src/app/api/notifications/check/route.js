import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST /api/notifications/check
// Trigger system checks for generating notifications (e.g. upcoming shifts, visits)
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId;

        // 1. Check for Upcoming Shifts (next 24 hours)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const upcomingShifts = await prisma.shiftAssignment.findMany({
            where: {
                userId,
                date: {
                    gte: new Date(now.setHours(0, 0, 0, 0)), // Today 00:00
                    lte: tomorrow
                },
                status: 'SCHEDULED'
            },
            include: {
                shift: {
                    include: {
                        serviceSeeker: true
                    }
                }
            }
        });

        const validShifts = [];
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Filter shifts that need notification
        for (const assignment of upcomingShifts) {
            const shiftDate = new Date(assignment.date);
            const [hours, minutes] = assignment.shift.startTime.split(':').map(Number);
            shiftDate.setHours(hours, minutes, 0, 0);

            const diffHours = (shiftDate - new Date()) / (1000 * 60 * 60);

            if (diffHours > -1 && diffHours <= 2) {
                validShifts.push(assignment);
            }
        }

        const notificationsToCreate = [];
        let newNotifications = 0;

        // Batch check for existing shift notifications
        if (validShifts.length > 0) {
            const existingShiftNotifications = await prisma.notification.findMany({
                where: {
                    userId,
                    createdAt: { gte: todayStart },
                    title: { in: validShifts.map(s => `Upcoming Shift: ${s.shift.serviceSeeker.firstName}`) }
                },
                select: { title: true }
            });

            const existingShiftTitles = new Set(existingShiftNotifications.map(n => n.title));

            for (const assignment of validShifts) {
                const title = `Upcoming Shift: ${assignment.shift.serviceSeeker.firstName}`;

                if (!existingShiftTitles.has(title)) {
                    notificationsToCreate.push({
                        userId,
                        title,
                        message: `You have a shift with ${assignment.shift.serviceSeeker.firstName} ${assignment.shift.serviceSeeker.lastName} starting at ${assignment.shift.startTime}.`,
                        type: 'INFO',
                        link: '/care-worker/rota',
                        isRead: false
                    });
                    existingShiftTitles.add(title);
                    newNotifications++;
                }
            }
        }

        // 2. Check for Upcoming Visits (for the user's active clock-in)
        const activeClockIn = await prisma.clockInOut.findFirst({
            where: {
                userId,
                clockOutTime: null
            },
            select: { serviceSeekerId: true }
        });

        if (activeClockIn?.serviceSeekerId) {
            const serviceSeekerId = activeClockIn.serviceSeekerId;

            // Get service seeker info
            const serviceSeeker = await prisma.serviceSeeker.findUnique({
                where: { id: serviceSeekerId },
                select: { firstName: true, lastName: true, preferredName: true }
            });

            // Find upcoming visits for this service seeker (today and tomorrow)
            const upcomingVisits = await prisma.serviceSeekerCalendarEntry.findMany({
                where: {
                    serviceSeekerId,
                    entryType: { in: ['FAMILY_VISIT', 'PROFESSIONAL_VISIT'] },
                    date: {
                        gte: todayStart,
                        lte: tomorrow
                    },
                    completed: null // Only pending visits
                },
                orderBy: [{ date: 'asc' }, { time: 'asc' }]
            });

            // Check for existing visit notifications today
            const existingVisitNotifications = await prisma.notification.findMany({
                where: {
                    userId,
                    createdAt: { gte: todayStart },
                    title: { startsWith: 'Upcoming Visit:' }
                },
                select: { title: true, message: true }
            });

            const existingVisitKeys = new Set(
                existingVisitNotifications.map(n => `${n.title}|${n.message}`)
            );

            for (const visit of upcomingVisits) {
                const visitDate = new Date(visit.date);
                const isToday = visitDate.toDateString() === new Date().toDateString();
                const dateLabel = isToday ? 'Today' : 'Tomorrow';
                const visitorType = visit.entryType === 'FAMILY_VISIT' ? 'Family' : 'Professional';

                const title = `Upcoming Visit: ${visit.name || 'Visitor'}`;
                const message = `${visitorType} visit for ${serviceSeeker?.preferredName || serviceSeeker?.firstName} scheduled ${dateLabel} at ${visit.time || 'TBA'}.`;
                const key = `${title}|${message}`;

                if (!existingVisitKeys.has(key)) {
                    notificationsToCreate.push({
                        userId,
                        title,
                        message,
                        type: 'INFO',
                        link: '/care-worker/visits',
                        isRead: false
                    });
                    existingVisitKeys.add(key);
                    newNotifications++;
                }
            }
        }

        // Create all notifications in batch
        if (notificationsToCreate.length > 0) {
            await prisma.notification.createMany({
                data: notificationsToCreate
            });
        }

        return NextResponse.json({ success: true, newNotifications });
    } catch (error) {
        console.error('Check notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
