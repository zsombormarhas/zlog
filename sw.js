// Z/LOG offline support. Shows the saved copy instantly (works with no signal),
// then fetches the latest version in the background so updates appear on the next open.
const CACHE = 'zlog-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  const fresh = fetch(req)
    .then((res) => {
      if (res && res.ok) caches.open(CACHE).then((c) => c.put(key, res.clone()));
      return res;
    })
    .catch(() => null);
  e.waitUntil(fresh);
  e.respondWith(
    caches.match(key, { ignoreSearch: true }).then((hit) => hit || fresh.then((res) => res || Response.error()))
  );
});
