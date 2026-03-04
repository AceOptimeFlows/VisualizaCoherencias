/*
  Visualiza Coherente — Service Worker (offline-first)

  Estrategia:
  - Navegación (HTML): network-first con fallback al "app shell" en caché (index.html)
  - Recursos estáticos (JS/CSS/IMG/JSON): stale-while-revalidate (SWR)

  Nota:
  - Para forzar una actualización completa del caché en una nueva versión,
    incrementa APP_VERSION.
*/

const APP_VERSION = 'vers_1.0.0';
const CACHE_NAME  = `visualiza-coherente-v${APP_VERSION}`;

// Archivos esenciales para arrancar offline.
// Usamos add seguro (no rompe instalación si un recurso opcional no existe).
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './i18n.js',
  './escala.js',
  './16si.js',
  './export.js',
  './manifest.webmanifest',

  // Iconos
  './assets/img/normalizacoherente180.png',
  './assets/img/normalizacoherente192.png',
  './assets/img/normalizacoherente512.png',

  // (Opcional) Logo si existe
  './assets/img/logo.png',

  // (Opcional) i18n si existe
  './i18n/es.json',
  './i18n/en.json'
];

async function precacheSafe() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    PRECACHE_URLS.map(async (url) => {
      try {
        // cache:'reload' evita servir desde caché HTTP del navegador al precachear.
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (_err) {
        // Recurso opcional ausente o no accesible.
        // No abortamos la instalación del SW.
      }
    })
  );
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(precacheSafe());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isSameOrigin(request) {
  try { return new URL(request.url).origin === self.location.origin; }
  catch { return false; }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Evitamos cachear cross-origin.
  if (!isSameOrigin(req)) return;

  // Navegación / documentos (HTML)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
        return res;
      } catch (_err) {
        // ignoreSearch permite que './?source=pwa' haga match con './index.html'.
        const cached =
          (await caches.match(req, { ignoreSearch: true })) ||
          (await caches.match('./index.html', { ignoreSearch: true })) ||
          (await caches.match('./', { ignoreSearch: true }));
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Estáticos: stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: true });

    const fetchPromise = fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => cached);

    return cached || fetchPromise;
  })());
});

// Permite activar el SW nuevo inmediatamente desde la página (opcional).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
