// Мой клубок: offline + receiving photos from Android "Share".
const CACHE = 'klubok-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'klubok-share').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method === 'POST' && url.pathname.endsWith('/share')) {
    e.respondWith((async () => {
      try {
        const form = await req.formData(); const files = form.getAll('images');
        const cache = await caches.open('klubok-share');
        let i = 0; for (const f of files) { if (f && f.size) await cache.put(`./shared/${Date.now()}-${i++}`, new Response(f, {headers:{'Content-Type': f.type || 'image/jpeg'}})); }
      } catch (err) {}
      return Response.redirect('./?shared=1', 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })));
});
