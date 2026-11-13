// Installable app shell only. Nothing is cached: every request goes to the network as usual
// (answers, voice and payments must never come from a cache). Offline → a short notice.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response('<!doctype html><meta name=viewport content="width=device-width"><body style="background:#0a1638;color:#dbe8ff;font:16px system-ui;padding:40px;text-align:center">SECRA needs the internet.</body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
