self.addEventListener('fetch', function(event) {
    // Basic passthrough for PWA Service Worker requirement
});

self.addEventListener('push', function(event) {
    // Basic push listener for future robust remote pushes
    console.log('[Service Worker] Push Received.');
});
