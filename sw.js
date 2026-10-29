// Service worker: precache the whole game so it launches offline, including
// from a home-screen icon. Navigations are network-first so a deploy lands on
// the next load; assets are stale-while-revalidate so nothing waits on a phone
// connection just to paint.

const VERSION = 'joustline-v3';

const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/match.js',
  './js/art.js',
  './js/data.js',
  './js/story.js',
  './js/audio.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function offlineResponse() {
  return new Response('Offline — reopen JoustLine once you have a connection.', {
    status: 503,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = req.mode === 'navigate';

  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);

      // Navigations go to the network first, so a deploy lands immediately.
      if (isNavigation) {
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.ok) cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const shell = (await cache.match('./index.html')) || (await cache.match('./'));
          return shell || offlineResponse();
        }
      }

      // Assets: serve the cached bytes instantly, refresh in the background.
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) return cached;
      const fresh = await network;
      return fresh || offlineResponse();
    })()
  );
});
