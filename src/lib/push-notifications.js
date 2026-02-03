// Server-only push notification utilities
// Uses dynamic import to avoid issues with SSR

let webpush = null;
let vapidConfigured = false;

// VAPID keys from environment
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

/**
 * Initialize web-push with VAPID details (lazy loading)
 */
async function initWebPush() {
    if (webpush && vapidConfigured) {
        console.log('[WebPush] Already initialized');
        return true;
    }

    console.log('[WebPush] Initializing...');
    console.log('[WebPush] VAPID public key length:', vapidPublicKey?.length || 0);
    console.log('[WebPush] VAPID private key length:', vapidPrivateKey?.length || 0);

    if (!vapidPublicKey || !vapidPrivateKey) {
        console.error('[WebPush] VAPID keys not configured. Push notifications disabled.');
        return false;
    }

    try {
        // Dynamic import for server-side only
        const webPushModule = await import('web-push');
        webpush = webPushModule.default || webPushModule;

        webpush.setVapidDetails(
            'mailto:info@beerucare.com',
            vapidPublicKey,
            vapidPrivateKey
        );

        vapidConfigured = true;
        console.log('[WebPush] Successfully initialized with VAPID');
        return true;
    } catch (error) {
        console.error('[WebPush] Failed to initialize:', error);
        return false;
    }
}

/**
 * Send a push notification to a specific subscription
 * @param {Object} subscription - The push subscription object
 * @param {Object} payload - The notification payload
 * @returns {Promise} - Resolves when notification is sent
 */
export async function sendPushNotification(subscription, payload) {
    console.log('[WebPush] sendPushNotification called');
    console.log('[WebPush] Subscription endpoint:', subscription?.endpoint?.substring(0, 50) + '...');

    const initialized = await initWebPush();
    if (!initialized || !webpush) {
        console.error('[WebPush] Not initialized, cannot send');
        return null;
    }

    try {
        console.log('[WebPush] Sending notification with payload:', JSON.stringify(payload).substring(0, 100));
        const result = await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );
        console.log('[WebPush] Notification sent successfully, status:', result.statusCode);
        return result;
    } catch (error) {
        // Handle expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('[WebPush] Subscription expired or invalid:', subscription?.endpoint?.substring(0, 50));
            return { expired: true, endpoint: subscription.endpoint };
        }
        console.error('[WebPush] Push notification error:', error.message);
        console.error('[WebPush] Error details:', error.body || error);
        throw error;
    }
}

/**
 * Send push notifications to multiple subscriptions
 * @param {Array} subscriptions - Array of push subscription objects
 * @param {Object} payload - The notification payload
 * @returns {Promise<Object>} - Results of sending to all subscriptions
 */
export async function sendPushToMultiple(subscriptions, payload) {
    console.log('[WebPush] sendPushToMultiple called with', subscriptions?.length, 'subscriptions');

    if (!subscriptions || subscriptions.length === 0) {
        console.log('[WebPush] No subscriptions to send to');
        return { sent: 0, failed: 0, expired: [] };
    }

    const initialized = await initWebPush();
    if (!initialized) {
        console.error('[WebPush] Initialization failed');
        return { sent: 0, failed: 0, expired: [] };
    }

    const results = await Promise.allSettled(
        subscriptions.map(sub => sendPushNotification(sub, payload))
    );

    const expired = [];
    let sent = 0;
    let failed = 0;

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            if (result.value?.expired) {
                expired.push(result.value.endpoint);
            } else if (result.value !== null) {
                sent++;
            }
        } else {
            failed++;
            console.error('[WebPush] Failed to send push:', result.reason?.message || result.reason);
        }
    });

    console.log('[WebPush] sendPushToMultiple result: sent=', sent, 'failed=', failed, 'expired=', expired.length);
    return { sent, failed, expired };
}

/**
 * Get the VAPID public key for client-side subscription
 */
export function getVapidPublicKey() {
    return vapidPublicKey;
}
