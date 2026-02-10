import { prisma } from '@/lib/prisma';
import { sendPushToMultiple } from '@/lib/push-notifications';

/**
 * Send push to specific users by their IDs
 */
export async function sendPushForNotifications(notifications) {
    if (!notifications || notifications.length === 0) return { sent: 0, failed: 0 };

    try {
        const userIds = [...new Set(notifications.map(n => n.userId))];

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: { in: userIds }, isActive: true },
            select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true }
        });

        console.log('[SendPush] Found ' + subscriptions.length + ' subscriptions for ' + userIds.length + ' users');

        if (subscriptions.length === 0) return { sent: 0, failed: 0 };

        const subsByUser = {};
        subscriptions.forEach(sub => {
            if (!subsByUser[sub.userId]) subsByUser[sub.userId] = [];
            subsByUser[sub.userId].push({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            });
        });

        let totalSent = 0, totalFailed = 0;
        const expiredEndpoints = [];

        for (const notif of notifications) {
            const userSubs = subsByUser[notif.userId];
            if (!userSubs) continue;

            const payload = {
                title: notif.title,
                message: notif.message,
                type: notif.type || 'INFO',
                link: notif.link || '/',
                tag: 'notif-' + notif.userId + '-' + Date.now()
            };

            const result = await sendPushToMultiple(userSubs, payload);
            totalSent += result.sent;
            totalFailed += result.failed;
            if (result.expired) expiredEndpoints.push(...result.expired);
        }

        // Deactivate expired
        if (expiredEndpoints.length > 0) {
            await prisma.pushSubscription.updateMany({
                where: { endpoint: { in: expiredEndpoints } },
                data: { isActive: false }
            });
        }

        console.log('[SendPush] Done: sent=' + totalSent + ' failed=' + totalFailed);
        return { sent: totalSent, failed: totalFailed };
    } catch (error) {
        console.error('[SendPush] Error:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

export async function sendPushToUser(userId, { title, message, type = 'INFO', link }) {
    return sendPushForNotifications([{ userId, title, message, type, link }]);
}

export async function sendPushToRoles(roles, { title, message, type = 'INFO', link }) {
    console.log('[SendPush] sendPushToRoles:', roles);
    try {
        const users = await prisma.user.findMany({
            where: { role: { name: { in: roles } }, status: 'CURRENT' },
            select: { id: true }
        });

        console.log('[SendPush] Found ' + users.length + ' users with roles ' + roles.join(','));
        if (users.length === 0) return { sent: 0, failed: 0 };

        return sendPushForNotifications(users.map(u => ({ userId: u.id, title, message, type, link })));
    } catch (error) {
        console.error('[SendPush] sendPushToRoles error:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}
