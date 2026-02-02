import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST /api/notifications/admin-check
// OPTIMIZED: Uses batch queries and parallel execution to minimize database connections
// This should be called by admin dashboard on load or periodically (max once per 60s)
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const now = new Date();
        const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

        // OPTIMIZATION: Run all checks in parallel with a single transaction for reads
        const [currentUser, existingNotifications, counts] = await prisma.$transaction([
            // 1. Get current user with role
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: { select: { name: true } } }
            }),
            // 2. Get all existing notifications for today (batch check)
            prisma.notification.findMany({
                where: {
                    userId,
                    createdAt: { gte: todayStart },
                    title: { in: ['Missed Shift Alert', 'Active Emergency Alerts', 'Pending Holiday Requests'] }
                },
                select: { title: true, message: true }
            }),
            // 3. Get counts in parallel
            prisma.$queryRaw`
                SELECT 
                    (SELECT COUNT(*) FROM EmergencyAlert WHERE status = 'ACTIVE') as emergencyCount,
                    (SELECT COUNT(*) FROM Holiday WHERE status = 'PENDING') as holidayCount
            `
        ]);

        const adminRoles = ['ADMIN', 'DIRECTOR', 'REGISTER_MANAGER', 'HR'];
        if (!currentUser || !adminRoles.includes(currentUser.role?.name)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Create a Set of existing notification keys for O(1) lookup
        const existingKeys = new Set(existingNotifications.map(n => `${n.title}|${n.message?.substring(0, 50)}`));
        const notificationsToCreate = [];

        // Parse counts from raw query
        const { emergencyCount, holidayCount } = counts[0] || { emergencyCount: 0, holidayCount: 0 };
        const activeEmergencies = Number(emergencyCount);
        const pendingHolidays = Number(holidayCount);

        // Check for Active Emergency Alerts
        if (activeEmergencies > 0) {
            const message = `There ${activeEmergencies === 1 ? 'is' : 'are'} ${activeEmergencies} active emergency alert${activeEmergencies === 1 ? '' : 's'} requiring attention.`;
            const key = `Active Emergency Alerts|${message.substring(0, 50)}`;

            if (!existingKeys.has(key)) {
                notificationsToCreate.push({
                    userId,
                    title: 'Active Emergency Alerts',
                    message,
                    type: 'ERROR',
                    link: '/admin/emergency-reports',
                    isRead: false
                });
            }
        }

        // Check for Pending Holiday Requests
        if (pendingHolidays > 0) {
            const message = `There ${pendingHolidays === 1 ? 'is' : 'are'} ${pendingHolidays} holiday request${pendingHolidays === 1 ? '' : 's'} awaiting approval.`;
            const key = `Pending Holiday Requests|${message.substring(0, 50)}`;

            if (!existingKeys.has(key)) {
                notificationsToCreate.push({
                    userId,
                    title: 'Pending Holiday Requests',
                    message,
                    type: 'INFO',
                    link: '/admin/holidays',
                    isRead: false
                });
            }
        }

        // Check for Missed Shifts (OPTIMIZED: single query with JOIN)
        try {
            // Get today's overdue assignments that have no clock-in record
            const missedShifts = await prisma.$queryRaw`
                SELECT 
                    sa.id,
                    u.firstName as userFirstName,
                    u.lastName as userLastName,
                    s.startTime,
                    COALESCE(ss.preferredName, CONCAT(ss.firstName, ' ', ss.lastName)) as seekerName
                FROM ShiftAssignment sa
                JOIN User u ON sa.userId = u.id
                JOIN Shift s ON sa.shiftId = s.id
                JOIN ServiceSeeker ss ON s.serviceSeekerId = ss.id
                LEFT JOIN ClockInOut cio ON cio.shiftAssignmentId = sa.id AND cio.clockInTime IS NOT NULL
                WHERE sa.date = ${todayStart}
                AND sa.status = 'SCHEDULED'
                AND cio.id IS NULL
                AND STR_TO_DATE(CONCAT(DATE(sa.date), ' ', s.startTime), '%Y-%m-%d %H:%i') <= ${thirtyMinsAgo}
                LIMIT 10
            `;

            // Check which missed shifts we haven't notified about
            const existingMissedMessages = existingNotifications
                .filter(n => n.title === 'Missed Shift Alert')
                .map(n => n.message);

            for (const shift of missedShifts) {
                const message = `${shift.userFirstName} ${shift.userLastName} has not clocked in for their ${shift.startTime} shift with ${shift.seekerName}.`;

                if (!existingMissedMessages.some(m => m?.includes(`${shift.userFirstName} ${shift.userLastName}`))) {
                    notificationsToCreate.push({
                        userId,
                        title: 'Missed Shift Alert',
                        message,
                        type: 'WARNING',
                        link: '/admin/clock-in-out',
                        isRead: false
                    });
                }
            }
        } catch (shiftError) {
            console.error('Missed shift check error:', shiftError);
            // Non-critical, continue
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
        console.error('Admin check notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
