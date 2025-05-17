self.addEventListener('install',e=>e.waitUntil(
  caches.open('v1').then(c=>c.addAll(['.','index.html','detector.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css']))
));
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});
