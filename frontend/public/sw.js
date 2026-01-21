self.addEventListener('install', (event) => {
    // Force this SW to become the active one immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Take control of all open clients/tabs immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();

            // Basic options with fallback icon that actually exists
            const options = {
                body: data.body || 'New notification',
                icon: data.icon || '/logo.svg', // Fallback to logo.svg since icon-192 might be missing
                badge: '/logo.svg', // Use logo for badge too
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1,
                    url: data.data?.url || '/'
                },
                actions: [
                    { action: 'explore', title: 'View' } // Short title for mobile
                ]
            };

            event.waitUntil(
                self.registration.showNotification(data.title || 'Cycle Compass', options)
            );
        } catch (e) {
            console.error('Push handling error:', e);
            // Fallback for non-JSON or error cases
            const options = {
                body: event.data.text(),
                icon: '/logo.svg',
                vibrate: [100, 50, 100]
            };
            event.waitUntil(
                self.registration.showNotification('Cycle Compass', options)
            );
        }
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
