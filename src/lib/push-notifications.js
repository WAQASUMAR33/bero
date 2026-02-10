let webpush = null;
let configured = false;

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

async function init() {
    if (configured) return true;
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
        console.error('[WebPush] VAPID keys missing');
        return false;
    }
    try {
        const wp = await import('web-push');
        webpush = wp.default || wp;
        webpush.setVapidDetails('mailto:info@beerucare.com', VAPID_PUBLIC, VAPID_PRIVATE);
        configured = true;
        return true;
    } catch (err) {
        console.error('[WebPush] Init failed:', err);
        return false;
    }
}

export async function sendPushNotification(subscription, payload) {
    if (!(await init())) return null;
    try {
        const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
        console.log('[WebPush] Sent OK, status:', result.statusCode);
        return result;
    } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('[WebPush] Expired subscription');
            return { expired: true, endpoint: subscription.endpoint };
        }
        console.error('[WebPush] Send failed:', error.statusCode, error.body || error.message);
        throw error;
    }
}

export async function sendPushToMultiple(subscriptions, payload) {
    if (!subscriptions || subscriptions.length === 0) return { sent: 0, failed: 0, expired: [] };
    if (!(await init())) return { sent: 0, failed: 0, expired: [] };

    const results = await Promise.allSettled(
        subscriptions.map(sub => sendPushNotification(sub, payload))
    );

    const expired = [];
    let sent = 0, failed = 0;

    results.forEach(r => {
        if (r.status === 'fulfilled') {
            if (r.value?.expired) expired.push(r.value.endpoint);
            else if (r.value) sent++;
        } else {
            failed++;
        }
    });

    console.log('[WebPush] Batch result: sent=' + sent + ' failed=' + failed + ' expired=' + expired.length);
    return { sent, failed, expired };
}

export function getVapidPublicKey() {
    return VAPID_PUBLIC;
}
