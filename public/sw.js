// public/sw.js

const CACHE_NAME = "sopokdate-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through request handler to satisfy browser PWA installability requirements
  event.respondWith(
    fetch(event.request).catch(() => {
      // Offline fallback can be added here if needed
      return caches.match(event.request);
    }),
  );
});
