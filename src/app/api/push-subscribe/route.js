import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getVapidPublicKey } from '@/lib/push-notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to create endpoint hash for unique constraint
function hashEndpoint(endpoint) {
    return crypto.createHash('sha256').update(endpoint).digest('hex');
}

// GET - Get VAPID public key for client-side subscription
export async function GET(request) {
    try {
        const vapidPublicKey = getVapidPublicKey();

        if (!vapidPublicKey) {
            return NextResponse.json({
                success: false,
                error: 'Push notifications not configured'
            }, { status: 503 });
        }

        return NextResponse.json({
            success: true,
            vapidPublicKey
        });
    } catch (error) {
        console.error('Error getting VAPID key:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Subscribe to push notifications
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

        const { userId } = decoded;
        const body = await request.json();
        const { subscription, deviceType = 'desktop', userAgent } = body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json({
                success: false,
                error: 'Invalid subscription data'
            }, { status: 400 });
        }

        // Create hash of endpoint for unique constraint
        const endpointHash = hashEndpoint(subscription.endpoint);

        // Upsert the subscription (update if exists, create if not)
        const pushSubscription = await prisma.pushSubscription.upsert({
            where: {
                userId_endpointHash: {
                    userId,
                    endpointHash
                }
            },
            update: {
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                deviceType,
                userAgent: userAgent || null,
                isActive: true,
                updatedAt: new Date()
            },
            create: {
                userId,
                endpoint: subscription.endpoint,
                endpointHash,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                deviceType,
                userAgent: userAgent || null,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            data: { id: pushSubscription.id }
        });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request) {
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

        const { userId } = decoded;
        const { searchParams } = new URL(request.url);
        const endpoint = searchParams.get('endpoint');

        if (endpoint) {
            // Delete specific subscription using hash
            const endpointHash = hashEndpoint(endpoint);
            await prisma.pushSubscription.deleteMany({
                where: {
                    userId,
                    endpointHash
                }
            });
        } else {
            // Delete all subscriptions for user
            await prisma.pushSubscription.deleteMany({
                where: { userId }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting push subscription:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete subscription' },
            { status: 500 }
        );
    }
}
