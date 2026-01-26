import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST /api/notifications/check
// Trigger system checks for generating notifications (e.g. upcoming shifts)
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

        if (validShifts.length === 0) {
            return NextResponse.json({ success: true, newNotifications: 0 });
        }

        // Batch check for existing notifications
        const existingNotifications = await prisma.notification.findMany({
            where: {
                userId,
                createdAt: { gte: todayStart },
                title: { in: validShifts.map(s => `Upcoming Shift: ${s.shift.serviceSeeker.firstName}`) }
            },
            select: { title: true }
        });

        const existingTitles = new Set(existingNotifications.map(n => n.title));
        const notificationsToCreate = [];

        let newNotifications = 0;

        for (const assignment of validShifts) {
            const title = `Upcoming Shift: ${assignment.shift.serviceSeeker.firstName}`;

            if (!existingTitles.has(title)) {
                notificationsToCreate.push({
                    userId,
                    title,
                    message: `You have a shift with ${assignment.shift.serviceSeeker.firstName} ${assignment.shift.serviceSeeker.lastName} starting at ${assignment.shift.startTime}.`,
                    type: 'INFO',
                    link: '/care-worker/rota',
                    isRead: false
                });
                existingTitles.add(title); // Prevent duplicates within the same batch
                newNotifications++;
            }
        }

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
