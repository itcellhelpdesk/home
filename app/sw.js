const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  '/home/',
  '/home/app/',
  '/home/app/index.html',
  '/home/app/style.css',
  '/home/app/script.js',
  '/home/app/icons/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
