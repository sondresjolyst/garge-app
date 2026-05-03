self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { });

self.addEventListener('push', (event) => {
    let data = {};
    try { data = event.data?.json() ?? {}; } catch { data = { title: 'Garge', body: event.data?.text() ?? '' }; }
    event.waitUntil(
        self.registration.showNotification(data.title ?? 'Garge', {
            body: data.body ?? '',
            icon: '/icon-512x512.png',
            badge: '/garge-icon-small.png',
            tag: 'garge-offline-alert',
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
