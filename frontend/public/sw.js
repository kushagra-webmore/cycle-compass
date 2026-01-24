const CACHE_NAME = 'cycle-compass-v1';
const ASSETS_TO_CACHE = [
    '/icon-192.png',
    '/logo.svg'
];

self.addEventListener('install', (event) => {
    // Force this SW to become the active one immediately
    self.skipWaiting();

    // Validate assets are cached for offline/background notification reliability
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .catch(err => console.error('[Service Worker] Cache error:', err))
    );
});

self.addEventListener('activate', (event) => {
    // Take control of all open clients/tabs immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push received:', event);

    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[Service Worker] Push data:', data);

            // Enhanced options for mobile compatibility
            const options = {
                body: data.body || 'New notification',
                icon: data.icon || '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                tag: data.tag || 'cycle-compass-notification',
                requireInteraction: false, // Set to true for critical notifications
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1,
                    url: data.data?.url || '/'
                },
                actions: [
                    { action: 'explore', title: 'View' }
                ],
                // Additional options for better mobile support
                silent: false,
                renotify: true
            };

            event.waitUntil(
                self.registration.showNotification(data.title || 'Cycle Compass', options)
                    .then(() => console.log('[Service Worker] Notification shown'))
                    .catch(err => console.error('[Service Worker] Notification error:', err))
            );
        } catch (e) {
            console.error('[Service Worker] Push handling error:', e);
            // Fallback for non-JSON or error cases
            const options = {
                body: event.data.text(),
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'cycle-compass-fallback',
                requireInteraction: false
            };
            event.waitUntil(
                self.registration.showNotification('Cycle Compass', options)
            );
        }
    } else {
        console.log('[Service Worker] Push event has no data');
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window open and focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || '/');
            }
        })
    );
});
