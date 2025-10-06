const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
    '/',
    'index.html',
    'styles.css',
    'app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});