const CACHE_VERSION = 'v1314';
const APP_CACHE = `miselni-shell-${CACHE_VERSION}`;
const DATA_CACHE = `miselni-data-${CACHE_VERSION}`;
const OFFLINE_FALLBACK = './index.html';
// CDNi, brez katerih OFFLINE pade izgled strani (Tailwind, Google Fonts, Font Awesome)
const CDN_ORIGINS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com',
];
const PRECACHE_ASSETS = [
  './index.html',
  './favicon.ico',
  './manifest.webmanifest',
  './css/main.css',
  './css/layout.css',
  './css/components.css',
  './css/form.css',
  './css/games.bundle.css',
  './fonts/inter-300.woff2',
  './fonts/inter-400.woff2',
  './fonts/inter-600.woff2',
  './fonts/inter-800.woff2',
  './js/main.js',
  './js/router.js',
  './js/game-catalog.js',
  './js/app-settings.js',
  './js/data.js',
  './js/store.js',
  './js/ui.js',
  './js/stats.js',
  './js/sounds.js',
  './js/feedback.js',
  './js/achievements.js',
  './js/daily-themes.js',
  './js/theme.js',
  './js/game-registry.js',
  './js/games/game-layout.js',
  './js/games/game-keys.js',
  './js/games/game-settings-panel.js',
  './js/games/game-start.js',
  './js/games/spomin.js',
  './js/games/racunanje.js',
  './js/games/reakcija.js',
  './js/games/stroop.js',
  './js/games/zaporedje.js',
  './js/games/abeceda.js',
  './js/games/kvadriranje.js',
  './js/games/major.js',
  './js/games/corsi.js',
  './js/games/search.js',
  './js/games/switch.js',
  './js/games/dualnback.js',
  './js/games/words.js',
  './js/games/uganke.js',
  './js/games/vzorci.js',
  './js/games/trail.js',
  './js/games/2048.js',
  './js/games/besedle.js',
  './js/games/povezave.js',
  './js/games/besedolov.js',
  './js/games/sudoku.js',
  './js/games/minolovec.js',
  './js/games/nonogram.js',
  './js/games/daily-challenge.js',
  './js/games/pattern-generators.js',
  './js/utils/rng.js',
  './js/utils/helpers.js',
  './js/adaptive-difficulty.js',
  './data/slovar.json',
  './data/slovar5.json',
  './data/tasks.json',
  './data/puzzles.json',
  './data/patterns.json',
  './icons/icon.svg',
  './icons/favicon-v2.svg',
  './icons/favicon-32-v2.png',
  './icons/brain-logo.svg',
  './icons/brain-logo.png',
  './icons/brain-art.png',
  './icons/brain-symbol.png',
  './icons/brain-noto-512.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(
              key =>
                (key.startsWith('miselni-shell-') || key.startsWith('miselni-data-')) &&
                key !== APP_CACHE &&
                key !== DATA_CACHE
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  // Opaque (cross-origin brez CORS) ima status 0 → ok=false; kljub temu je veljaven
  const isValid = response && (response.ok || response.type === 'opaque');
  if (isValid && (request.url.startsWith(self.location.origin) || isCdnUrl(request.url))) {
    cache.put(request, response.clone());
  }
  return response;
}

function isCdnUrl(url) {
  return CDN_ORIGINS.some(origin => url.startsWith(origin));
}

async function networkFirst(request, cacheName, fallbackUrl = null) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (!response || !response.ok) {
      throw new Error(`Request failed for ${request.url}`);
    }
    if (request.url.startsWith(self.location.origin)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached =
      (await cache.match(request)) || (fallbackUrl ? await cache.match(fallbackUrl) : null);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    // Znani CDNi: cache-first, da aplikacija deluje tudi OFFLINE (layout + fonti)
    if (isCdnUrl(request.url)) {
      event.respondWith(cacheFirst(request, APP_CACHE));
    }
    return;
  }

  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, APP_CACHE, OFFLINE_FALLBACK));
    return;
  }

  // Vse ostale same-origin GET zahteve (tudi z ?v= in novimi moduli):
  // runtime cache-first — novi moduli nikoli več ne razbijejo OFFLINE
  event.respondWith(cacheFirst(request, APP_CACHE));
});
