// Service Worker for Push Notifications
// Version 2 - Updated with logging
// This file should be placed in the public folder

console.log('[SW] Service Worker loaded, version 2');

self.addEventListener('install', function (event) {
    console.log('[SW] Installing service worker...');
    // Force the waiting service worker to become active
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('[SW] Service worker activated');
    // Claim all clients immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    console.log('[SW] Push event received!');

    if (!event.data) {
        console.log('[SW] Push event but no data');
        return;
    }

    let data;
    try {
        data = event.data.json();
        console.log('[SW] Push data:', JSON.stringify(data));
    } catch (e) {
        console.error('[SW] Error parsing push data:', e);
        data = { title: 'Notification', message: event.data.text() };
    }

    const options = {
        body: data.message || data.body || 'You have a new notification',
        icon: '/assets/logo2.png',
        badge: '/assets/logo2.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'notification-' + Date.now(),
        renotify: true,
        requireInteraction: data.type === 'ERROR' || data.type === 'WARNING',
        data: {
            url: data.link || data.url || '/',
            notificationId: data.id
        },
        actions: [
            {
                action: 'open',
                title: 'Open'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };

    console.log('[SW] Showing notification:', data.title, options);

    event.waitUntil(
        self.registration.showNotification(data.title || 'Beeru Care', options)
            .then(() => console.log('[SW] Notification shown successfully'))
            .catch(err => console.error('[SW] Error showing notification:', err))
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification clicked');
    event.notification.close();

    const action = event.action;
    const notificationData = event.notification.data;

    if (action === 'dismiss') {
        console.log('[SW] Notification dismissed');
        return;
    }

    // Open the link (either from action or default click)
    const urlToOpen = notificationData?.url || '/';
    console.log('[SW] Opening URL:', urlToOpen);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(urlToOpen);
                        return;
                    }
                }
                // If no window is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle subscription change
self.addEventListener('pushsubscriptionchange', function (event) {
    console.log('[SW] Push subscription changed');
    event.waitUntil(
        self.registration.pushManager.subscribe({ userVisibleOnly: true })
            .then(function (subscription) {
                console.log('[SW] Re-subscribed:', subscription);
            })
    );
});
