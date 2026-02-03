import { prisma } from '@/lib/prisma';
import { sendPushToMultiple } from '@/lib/push-notifications';

/**
 * Send push notifications for newly created notifications
 * Call this after creating notifications in the database
 * 
 * @param {Array<{userId: number, title: string, message: string, type?: string, link?: string}>} notifications 
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendPushForNotifications(notifications) {
    console.log('[SendPush] sendPushForNotifications called with', notifications?.length, 'notifications');

    if (!notifications || notifications.length === 0) {
        console.log('[SendPush] No notifications to send');
        return { sent: 0, failed: 0 };
    }

    try {
        // Get unique user IDs
        const userIds = [...new Set(notifications.map(n => n.userId))];
        console.log('[SendPush] Looking for subscriptions for user IDs:', userIds);

        // Fetch all active push subscriptions for these users
        const subscriptions = await prisma.pushSubscription.findMany({
            where: {
                userId: { in: userIds },
                isActive: true
            },
            select: {
                id: true,
                userId: true,
                endpoint: true,
                p256dh: true,
                auth: true
            }
        });

        console.log('[SendPush] Found', subscriptions.length, 'active subscriptions');

        if (subscriptions.length === 0) {
            console.log('[SendPush] No active subscriptions found for these users');
            return { sent: 0, failed: 0 };
        }

        // Group subscriptions by userId for efficient lookup
        const subsByUser = {};
        subscriptions.forEach(sub => {
            if (!subsByUser[sub.userId]) {
                subsByUser[sub.userId] = [];
            }
            subsByUser[sub.userId].push({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            });
        });

        // Send push notifications for each notification to each of the user's subscriptions
        let totalSent = 0;
        let totalFailed = 0;
        const expiredEndpoints = [];

        for (const notification of notifications) {
            const userSubs = subsByUser[notification.userId];
            if (!userSubs || userSubs.length === 0) {
                console.log('[SendPush] No subscription for user', notification.userId);
                continue;
            }

            const payload = {
                title: notification.title,
                message: notification.message,
                type: notification.type || 'INFO',
                link: notification.link || '/',
                tag: `notif-${notification.userId}-${Date.now()}`
            };

            console.log('[SendPush] Sending push to user', notification.userId, 'with', userSubs.length, 'subscriptions');
            const result = await sendPushToMultiple(userSubs, payload);
            console.log('[SendPush] Result:', result);

            totalSent += result.sent;
            totalFailed += result.failed;

            if (result.expired) {
                expiredEndpoints.push(...result.expired);
            }
        }

        // Deactivate expired subscriptions
        if (expiredEndpoints.length > 0) {
            console.log('[SendPush] Deactivating', expiredEndpoints.length, 'expired subscriptions');
            await prisma.pushSubscription.updateMany({
                where: {
                    endpoint: { in: expiredEndpoints }
                },
                data: { isActive: false }
            });
        }

        console.log('[SendPush] Final result: sent=', totalSent, 'failed=', totalFailed);
        return { sent: totalSent, failed: totalFailed };
    } catch (error) {
        console.error('[SendPush] Error sending push notifications:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

/**
 * Send a single push notification to a specific user
 * @param {number} userId 
 * @param {Object} notification 
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendPushToUser(userId, { title, message, type = 'INFO', link }) {
    console.log('[SendPush] sendPushToUser called for user', userId);
    return sendPushForNotifications([{ userId, title, message, type, link }]);
}

/**
 * Send push notifications to users with specific roles
 * @param {Array<string>} roles - Role names like ['ADMIN', 'DIRECTOR']
 * @param {Object} notification 
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendPushToRoles(roles, { title, message, type = 'INFO', link }) {
    console.log('[SendPush] sendPushToRoles called for roles:', roles);

    try {
        // Get users with these roles
        const users = await prisma.user.findMany({
            where: {
                role: { name: { in: roles } },
                status: 'CURRENT'
            },
            select: { id: true, firstName: true, lastName: true },
            take: 100 // Limit to prevent overload
        });

        console.log('[SendPush] Found', users.length, 'users with roles:', roles);

        if (users.length === 0) {
            console.log('[SendPush] No users found with these roles');
            return { sent: 0, failed: 0 };
        }

        // Log user details
        users.forEach(u => console.log('[SendPush] - User:', u.id, u.firstName, u.lastName));

        const notifications = users.map(u => ({
            userId: u.id,
            title,
            message,
            type,
            link
        }));

        return sendPushForNotifications(notifications);
    } catch (error) {
        console.error('[SendPush] Error sending push to roles:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}
