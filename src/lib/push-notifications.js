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
    if (webpush && vapidConfigured) return true;

    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('VAPID keys not configured. Push notifications disabled.');
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
        return true;
    } catch (error) {
        console.error('Failed to initialize web-push:', error);
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
    const initialized = await initWebPush();
    if (!initialized || !webpush) {
        return null;
    }

    try {
        const result = await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );
        return result;
    } catch (error) {
        // Handle expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('Subscription expired or invalid:', error.endpoint);
            return { expired: true, endpoint: subscription.endpoint };
        }
        console.error('Push notification error:', error);
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
    if (!subscriptions || subscriptions.length === 0) {
        return { sent: 0, failed: 0, expired: [] };
    }

    const initialized = await initWebPush();
    if (!initialized) {
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
            console.error('Failed to send push:', result.reason);
        }
    });

    return { sent, failed, expired };
}

/**
 * Get the VAPID public key for client-side subscription
 */
export function getVapidPublicKey() {
    return vapidPublicKey;
}
