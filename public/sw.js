// public/sw.js

const CACHE_NAME = "sopokdate-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Do not intercept API requests or non-GET requests
  if (event.request.url.includes("/api/") || event.request.method !== "GET") {
    return;
  }

  // Pass-through request handler to satisfy browser PWA installability requirements
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
    }),
  );
});
