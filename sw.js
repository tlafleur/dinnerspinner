// Offline-first app shell. Bump CACHE when files change.
const CACHE = 'dinnerspinner-v3';
const FILES = [
  './', './index.html', './css/app.css', './manifest.webmanifest',
  './js/app.js', './js/util.js', './js/store.js', './js/engine.js', './js/sound.js', './js/fx.js', './js/badges.js', './js/data/seed.js',
  './js/ui/components.js', './js/ui/wheel.js', './js/ui/reels.js', './js/ui/mealsheet.js', './js/ui/spin.js', './js/ui/week.js',
  './js/ui/shop.js', './js/ui/pantry.js', './js/ui/family.js', './js/ui/meals.js', './js/ui/settings.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) {
    // fonts: cache opportunistically
    e.respondWith(caches.open(CACHE).then(async c => { const hit = await c.match(e.request); if (hit) return hit; try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch { return hit || Response.error(); } }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
