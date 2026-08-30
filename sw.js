/* Service worker for the Draft HQ PWA.
 *
 * Goal: installed PWAs pick up new deploys automatically. Navigations are
 * served network-first (bypassing the HTTP cache), so each relaunch fetches
 * the latest index.html — and therefore the latest content-hashed JS bundle —
 * instead of a stale home-screen copy. Hashed assets are immutable, so they're
 * served cache-first for speed and offline use.
 *
 * Scope is the directory this file is served from, so production and each PR
 * preview get their own isolated worker.
 */
const CACHE = 'draft-hq-v1';

self.addEventListener('install', () => {
  // Activate this worker as soon as it's installed, replacing the old one.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions.
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigations (the HTML document): always try the network first so the newest
  // deploy loads; fall back to cache when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request, { cache: 'no-store' });
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (err) {
          const cached = await caches.match(request);
          return cached || (await caches.match('index.html')) || Response.error();
        }
      })()
    );
    return;
  }

  // Same-origin static assets (hashed => immutable): cache-first.
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, res.clone());
        }
        return res;
      })()
    );
  }
});
