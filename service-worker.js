/* Service worker Medulu.
 * Tujuan: Medulu bisa dipasang di layar utama dan terbuka cepat. TIDAK menyimpan data warga.
 *  - Halaman (index.html): selalu ambil yang terbaru dari internet dulu; salinan tersimpan hanya dipakai bila offline.
 *  - Permintaan ke Supabase, Apps Script, Cloudinary, dan CDN tidak disentuh sama sekali (langsung ke jaringan).
 * Saat ada perubahan pada berkas ini, naikkan VERSI supaya simpanan lama dibuang.
 */
const VERSI = 'medulu-v1';
const OFFLINE = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Medulu</title><style>body{font-family:system-ui,sans-serif;background:#0b2a6f;color:#fff;display:flex;min-height:100vh;' +
  'align-items:center;justify-content:center;text-align:center;margin:0;padding:24px}h1{font-size:1.2rem}p{opacity:.85}</style></head>' +
  '<body><div><h1>Tidak ada koneksi internet</h1><p>Medulu memerlukan internet untuk membuka data. Periksa sinyal atau Wi-Fi, lalu buka kembali.</p></div></body></html>';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSI).then((c) => c.addAll(['./', 'manifest.json'])).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nama) => Promise.all(nama.filter((n) => n !== VERSI).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;            // layanan luar: biarkan browser menanganinya

  if (r.mode === 'navigate') {                              // membuka halaman: internet dulu, cache bila offline
    e.respondWith(
      fetch(u.href, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) { const salin = res.clone(); caches.open(VERSI).then((c) => c.put('./', salin)); }
          return res;
        })
        .catch(() => caches.match('./').then((h) => h || new Response(OFFLINE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    );
    return;
  }

  e.respondWith(                                            // berkas statis sendiri (manifest, dll.): internet dulu
    fetch(r).then((res) => {
      if (res.ok) { const salin = res.clone(); caches.open(VERSI).then((c) => c.put(r, salin)); }
      return res;
    }).catch(() => caches.match(r))
  );
});
