const CACHE_NAME = 'focus-titanium-2013-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './html/index.html',
  './css/style.css',
  './javascript/app.js',
  './json/equipamentos.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_ASSETS.map((url) => cache.add(url).catch(() => null))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const url = new URL(event.request.url);
          const isProjectFile =
            url.pathname.includes('/html/') ||
            url.pathname.includes('/css/') ||
            url.pathname.includes('/javascript/') ||
            url.pathname.includes('/json/') ||
            url.pathname.includes('/images/') ||
            url.pathname.endsWith('index.html') ||
            url.pathname.endsWith('manifest.json');

          if (isProjectFile) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./html/index.html') || caches.match('./index.html');
          }
        });
    })
  );
});
