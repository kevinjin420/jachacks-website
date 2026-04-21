const CACHE_NAME = 'jachacks-judging-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', (event) => {
  // Let all requests pass through to network (no offline caching needed for judging)
  event.respondWith(fetch(event.request));
});
