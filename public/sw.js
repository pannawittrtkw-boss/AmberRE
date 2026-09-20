// Minimal service worker — enables PWA installability and a basic offline
// fallback. Intentionally does NOT cache API responses or page HTML: this
// app shows live property/commission data, so serving anything stale from
// cache would be actively wrong. Only content-hashed static assets (safe
// to cache forever, since a changed file gets a new URL) are cached.

const STATIC_CACHE = "amber-static-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API calls — always go to the network so data stays fresh.
  if (url.pathname.startsWith("/api/")) return;

  // Content-hashed static assets: cache-first (safe — a changed file gets a new URL).
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Page navigations: network-first, falling back to a simple offline page
  // if there's no connection.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
