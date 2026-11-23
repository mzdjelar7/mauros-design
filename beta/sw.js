// MaurOS PWA v140 – service worker
// Uvijek prvo mreža bez HTTP cachea (nova verzija odmah), cache samo kad nema interneta. Supabase se NE cacheira.
const CACHE = 'mauros-pwa-v140';
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
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => { // v140: zaobiđi HTTP cache (GitHub ~10 min)
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});

// v140: push obavijesti
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'MaurOS', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'MaurOS', {
    body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag, icon: 'icon-192-v126.png', badge: 'favicon-v126.png',
    data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const u = new URL((e.notification.data && e.notification.data.url) || './', self.location.href);
  if (!u.searchParams.get('o')) u.searchParams.set('n', '1'); // v140: obavijest bez narudžbe otvara centar obavijesti
  const url = u.href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('navigate' in c) return c.navigate(url).then(x => (x || c).focus()); }
    return clients.openWindow(url);
  }));
});
