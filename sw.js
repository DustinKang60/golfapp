'use strict';
var CACHE_NAME = 'golfapp-v4';
var ASSETS = [
  '/golfapp/',
  '/golfapp/index.html',
  '/golfapp/manifest.json',
  '/golfapp/icons/icon-192x192.png',
  '/golfapp/icons/icon-512x512.png'
];
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});
self.addEventListener('fetch', function(e) {
  // Cloudflare Worker 요청은 캐시 안 함 (항상 네트워크로)
  if (e.request.url.indexOf('workers.dev') !== -1) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).catch(function() { return cached; });
    })
  );
});
