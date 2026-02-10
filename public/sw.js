// Service Worker for Push Notifications - v3
const SW_VERSION = 'v3';

self.addEventListener('install', function (event) {
    console.log('[SW ' + SW_VERSION + '] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('[SW ' + SW_VERSION + '] Activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    console.log('[SW ' + SW_VERSION + '] Push received');

    var data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'New Notification', message: event.data.text() };
        }
    }

    var title = data.title || 'Beeru Care';
    var options = {
        body: data.message || data.body || 'You have a new notification',
        icon: '/assets/logo2.png',
        badge: '/assets/logo2.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'notif-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        data: {
            url: data.link || data.url || '/',
            notificationId: data.id
        }
    };

    console.log('[SW ' + SW_VERSION + '] Showing: ' + title);

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    if (event.action === 'dismiss') return;

    var url = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    if ('focus' in clientList[i]) {
                        clientList[i].focus();
                        clientList[i].navigate(url);
                        return;
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});
