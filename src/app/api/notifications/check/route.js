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

        let newNotifications = 0;

        for (const assignment of upcomingShifts) {
            // Calculate start time
            const shiftDate = new Date(assignment.date);
            const [hours, minutes] = assignment.shift.startTime.split(':').map(Number);
            shiftDate.setHours(hours, minutes, 0, 0);

            // If shift starts within 2 hours and hasn't passed more than 1 hour ago
            const diffHours = (shiftDate - new Date()) / (1000 * 60 * 60);

            if (diffHours > -1 && diffHours <= 2) {
                // Check if we already notified for this shift
                const title = `Upcoming Shift: ${assignment.shift.serviceSeeker.firstName}`;
                const existingNotif = await prisma.notification.findFirst({
                    where: {
                        userId,
                        title,
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)) // Created today
                        }
                    }
                });

                if (!existingNotif) {
                    await prisma.notification.create({
                        data: {
                            userId,
                            title,
                            message: `You have a shift with ${assignment.shift.serviceSeeker.firstName} ${assignment.shift.serviceSeeker.lastName} starting at ${assignment.shift.startTime}.`,
                            type: 'INFO',
                            link: '/care-worker/rota',
                            isRead: false
                        }
                    });
                    newNotifications++;
                }
            }
        }

        return NextResponse.json({ success: true, newNotifications });
    } catch (error) {
        console.error('Check notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
