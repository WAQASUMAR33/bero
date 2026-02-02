import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { sendPushToMultiple } from '@/lib/push-notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST - Send push notification to specific users
// This is an internal API for server-side notification sending
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        // Check if user has admin privileges
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true }
        });

        if (!user || !['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER'].includes(user.role?.name)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { userIds, title, message, type = 'INFO', link } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'userIds array is required'
            }, { status: 400 });
        }

        if (!title || !message) {
            return NextResponse.json({
                success: false,
                error: 'title and message are required'
            }, { status: 400 });
        }

        // Get all active push subscriptions for the specified users
        const subscriptions = await prisma.pushSubscription.findMany({
            where: {
                userId: { in: userIds },
                isActive: true
            },
            select: {
                id: true,
                endpoint: true,
                p256dh: true,
                auth: true
            }
        });

        if (subscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active subscriptions found',
                sent: 0
            });
        }

        // Format subscriptions for web-push
        const formattedSubscriptions = subscriptions.map(sub => ({
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
            }
        }));

        // Send push notifications
        const payload = {
            title,
            message,
            type,
            link,
            tag: `notification-${Date.now()}`
        };

        const result = await sendPushToMultiple(formattedSubscriptions, payload);

        // Deactivate expired subscriptions
        if (result.expired && result.expired.length > 0) {
            await prisma.pushSubscription.updateMany({
                where: {
                    endpoint: { in: result.expired }
                },
                data: { isActive: false }
            });
        }

        return NextResponse.json({
            success: true,
            sent: result.sent,
            failed: result.failed,
            expiredCount: result.expired?.length || 0
        });
    } catch (error) {
        console.error('Error sending push notifications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send notifications' },
            { status: 500 }
        );
    }
}
