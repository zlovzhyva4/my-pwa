const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './images/avatar.png',
  './images/icon-180.png',
  './fonts/Tahoma.woff2'
];

// Обробник 'install' для кешування основних ресурсів
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Обробник 'fetch' для видачі ресурсів з кешу
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Обробник 'push' для показу сповіщень
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Щось трапилось';
  const options = {
    body: data.body || 'Натисніть, щоб перевірити.',
    icon: './images/icon-180.png',
    badge: './images/icon-180.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});