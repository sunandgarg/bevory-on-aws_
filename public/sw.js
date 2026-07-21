// Bevory Service Worker v1 — 2026
const CACHE_VERSION = 'bevory-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Static assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/favicon.png',
  '/og-image.png',
];

// Install — precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('bevory-') && key !== STATIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip chrome-extension, analytics, auth endpoints
  if (
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('googletagmanager') ||
    url.hostname.includes('google-analytics') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('token')
  ) return;

  // Never cache Supabase REST responses. They may be scoped by Authorization
  // and CacheStorage does not partition entries safely by user session.
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/')) {
    return;
  }

  // Strategy 2: Images (wsrv.nl proxy, supabase storage) — Cache first
  if (
    url.hostname.includes('wsrv.nl') ||
    (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/'))
  ) {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
    return;
  }

  // Strategy 3: Google Fonts — Cache first (long-lived)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  // Strategy 4: Documents are network-first so a deployment cannot serve an
  // old HTML shell that references deleted hashed assets.
  if (url.origin === self.location.origin && request.destination === 'document') {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  // Scripts and styles may safely use stale-while-revalidate because their
  // filenames are content-hashed by Vite.
  if (
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style')
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
});

// --- Strategies ---

async function networkFirstDocument(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('/')) || new Response('Offline', { status: 503 });
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}
