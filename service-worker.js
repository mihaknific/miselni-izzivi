const CACHE_VERSION = 'v1242';
const APP_CACHE = `miselni-shell-${CACHE_VERSION}`;
const DATA_CACHE = `miselni-data-${CACHE_VERSION}`;
const OFFLINE_FALLBACK = './index.html';
const PRECACHE_ASSETS = [
  './index.html',
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
  './js/data.js',
  './js/store.js',
  './js/ui.js',
  './js/stats.js',
  './js/sounds.js',
  './js/feedback.js',
  './js/achievements.js',
  './js/games/game-layout.js',
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
  './data/slovar.json',
  './data/slovar5.json',
  './data/tasks.json',
  './data/puzzles.json',
  './data/patterns.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];
const PRECACHE_URLS = new Set(PRECACHE_ASSETS.map(asset => new URL(asset, self.location.href).pathname));

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
  if (response && response.ok && request.url.startsWith(self.location.origin)) {
    cache.put(request, response.clone());
  }
  return response;
}

function isCacheableAsset(url) {
  return PRECACHE_URLS.has(url.pathname);
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

  if (isCacheableAsset(url)) {
    event.respondWith(cacheFirst(request, APP_CACHE));
  }
});
