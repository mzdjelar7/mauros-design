// MaurOS PWA v126 – service worker
// Uvijek prvo mreža (nova verzija odmah), cache samo kad nema interneta. Supabase se NE cacheira.
const CACHE = 'mauros-pwa-v126';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192-v126.png', 'icon-512-v126.png', 'apple-touch-icon-v126.png', 'favicon-v126.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
