// Service Worker simples (GitHub Pages) — v6.2
const CACHE_NAME = "treinamento-barone-v6.2-cache";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./stretches_bank_v1.json",
  "./judo_bank_v1.json",
  "./treinos/index.json",
  "./treinos/sessions/alberto_c2_f3_a.json",
  "./treinos/sessions/alberto_c2_f3_b.json",
  "./treinos/exercises/alberto_exercises.json",
  "./treinos/state/training_status.json",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetcher = fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return resp;
      }).catch(() => cached);

      return cached || fetcher;
    })
  );
});
