// LamarKerja AI - Service Worker
// Network-first for HTML/JS/CSS so a Railway redeploy cannot serve stale
// index.html that points at deleted hashed Vite assets (blank white screen).
const CACHE_NAME = 'lamarkerja-cache-v3';

function shouldBypass(request) {
  if (request.method !== 'GET') return true;
  try {
    return new URL(request.url).pathname.startsWith('/api/');
  } catch {
    return true;
  }
}

function useNetworkFirst(request) {
  if (request.mode === 'navigate' || request.destination === 'document') return true;
  const dest = request.destination;
  if (dest === 'script' || dest === 'style') return true;
  try {
    const path = new URL(request.url).pathname;
    return path === '/' || path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css');
  } catch {
    return true;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => (name === CACHE_NAME ? undefined : caches.delete(name))))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (shouldBypass(request)) return;

  if (useNetworkFirst(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const isDocument =
            request.mode === 'navigate' || request.destination === 'document';
          if (isDocument) return response;
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
