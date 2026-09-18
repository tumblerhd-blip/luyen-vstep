// Service worker — luyện thi VSTEP PWA
// Chiến lược: cache-first cho shell (index.html), tự làm mới cache mỗi lần mở app
// để giảm rủi ro bị Safari/iOS xóa cache do lâu không dùng.

const CACHE_NAME = 'vstep-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Cache-first: phục vụ từ cache trước, chỉ gọi mạng nếu cache chưa có.
// Nếu tải mạng thành công, cập nhật lại cache (giữ app luôn mới khi có mạng).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // mất mạng -> dùng bản cache cũ
      return cached || networkFetch;
    })
  );
});
