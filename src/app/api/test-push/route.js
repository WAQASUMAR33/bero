import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { sendPushToUser } from '@/lib/send-push';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/test-push - Send a test push notification to the current user
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { userId } = decoded;

        console.log('[TestPush] Testing push notification for user:', userId);

        // Check if user has any push subscriptions
        const subscriptions = await prisma.pushSubscription.findMany({
            where: {
                userId: userId,
                isActive: true
            }
        });

        console.log('[TestPush] Found', subscriptions.length, 'subscriptions for user', userId);

        if (subscriptions.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No active push subscriptions found for your account. Please enable push notifications first.',
                debug: {
                    userId,
                    subscriptionCount: 0
                }
            }, { status: 400 });
        }

        // Send test notification
        const result = await sendPushToUser(userId, {
            title: '🔔 Test Notification',
            message: 'Push notifications are working! This is a test message.',
            type: 'INFO',
            link: '/admin/dashboard'
        });

        console.log('[TestPush] Send result:', result);

        return NextResponse.json({
            success: true,
            message: 'Test notification sent!',
            result,
            debug: {
                userId,
                subscriptionCount: subscriptions.length,
                subscriptions: subscriptions.map(s => ({
                    id: s.id,
                    deviceType: s.deviceType,
                    createdAt: s.createdAt,
                    endpoint: s.endpoint?.substring(0, 60) + '...'
                }))
            }
        });

    } catch (error) {
        console.error('[TestPush] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// GET /api/test-push - Get subscription status for current user
export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { userId } = decoded;

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
            select: {
                id: true,
                deviceType: true,
                isActive: true,
                createdAt: true,
                endpoint: true
            }
        });

        return NextResponse.json({
            success: true,
            userId,
            subscriptions: subscriptions.map(s => ({
                ...s,
                endpoint: s.endpoint?.substring(0, 60) + '...'
            }))
        });

    } catch (error) {
        console.error('[TestPush] GET Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
