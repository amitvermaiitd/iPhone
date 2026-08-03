const CACHE = 'notemaker-v4';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('generativelanguage.googleapis.com')) return;

  const isHTML =
    e.request.mode === 'navigate' ||
    e.request.destination === 'document' ||
    e.request.url.endsWith('.html');

  if (isHTML) {
    // Network-first so a new deploy is picked up immediately; cache is offline fallback.
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
