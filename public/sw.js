// Service Worker for Push Notifications
// This file should be placed in the public folder

self.addEventListener('push', function (event) {
    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    const data = event.data.json();

    const options = {
        body: data.message || data.body || 'You have a new notification',
        icon: '/assets/logo2.png',
        badge: '/assets/logo-badge.png',
        vibrate: [100, 50, 100],
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

    // Set notification icon color based on type
    if (data.type === 'ERROR') {
        options.icon = '/assets/alert-icon.png';
    } else if (data.type === 'WARNING') {
        options.icon = '/assets/warning-icon.png';
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'Beeru Care', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const action = event.action;
    const notificationData = event.notification.data;

    if (action === 'dismiss') {
        // Just close the notification
        return;
    }

    // Open the link (either from action or default click)
    const urlToOpen = notificationData?.url || '/';

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
    console.log('Push subscription changed');
    event.waitUntil(
        self.registration.pushManager.subscribe({ userVisibleOnly: true })
            .then(function (subscription) {
                console.log('Re-subscribed:', subscription);
                // You would send this to your server here
            })
    );
});
