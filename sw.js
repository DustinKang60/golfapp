'use strict';
var CACHE_NAME = 'golfapp-v9';
var FONT_CACHE = 'golfapp-fonts';   // 버전과 무관하게 유지 (폰트는 바뀌지 않음)
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
// 주의: dustinkang60.github.io 의 앱들은 저장 공간(Cache Storage)을 함께 쓴다.
// 자기 이름으로 시작하는 캐시만 지워야 한다 — 전부 지우면 다른 앱의 오프라인 저장분이 날아가
// 그 앱이 해외·오프라인에서 아예 안 열린다.
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k.indexOf('golfapp-') === 0 && k !== CACHE_NAME && k !== FONT_CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // Cloudflare Worker 요청은 캐시 안 함 (항상 네트워크로)
  if (url.indexOf('workers.dev') !== -1) {
    e.respondWith(fetch(e.request));
    return;
  }
  // 구글 웹폰트: 한 번 받으면 저장해 두고 이후엔 저장본을 쓴다 → 해외·오프라인에서도 같은 글꼴
  if (url.indexOf('fonts.googleapis.com') !== -1 || url.indexOf('fonts.gstatic.com') !== -1) {
    e.respondWith(
      caches.open(FONT_CACHE).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request).then(function(res) {
            if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).catch(function() { return cached; });
    })
  );
});
