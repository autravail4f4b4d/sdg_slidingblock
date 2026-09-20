const CACHE = "sdg-escape-v2";
const CORE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  ...Array.from({ length: 17 }, (_, index) => `/assets/sdg/goal-${String(index + 1).padStart(2, "0")}.png`),
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("sdg-escape-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

function cacheStatic(request, response, event) {
  if (!response.ok) return response;
  event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, response.clone())));
  return response;
}

function networkNavigation(request, event) {
  return fetch(request).then((response) => {
    if (response.ok) event.waitUntil(caches.open(CACHE).then((cache) => cache.put("/index.html", response.clone())));
    return response;
  }).catch(() => caches.match("/index.html").then((cached) => cached || Response.error()));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(networkNavigation(event.request, event));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => cacheStatic(event.request, response, event))));
});
