// --- sw.js ---
// Ye file Chrome ko batati hai ki website install hone ke layak hai
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
    // Basic network request handler
    e.respondWith(fetch(e.request).catch(() => console.log("Network request failed")));
});
