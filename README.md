# Miselni Izzivi

Kognitivne igre za vadbo spomina, hitrosti in pozornosti. PWA, statična stran, brez backend-a.

**Igraj:** [Miselni izzivi](https://mihaknific.github.io/miselni-izzivi/)

## Zagon

```powershell
npm ci
npm run dev
```

Odpri `http://localhost:3000`.

## Testi

```powershell
npm run validate
npm test
npm run test:all
npm run lint
npm run format:check
npm run test:e2e
npm run qa:full
```

## Struktura

- `index.html` – vstopna stran.
- `js/main.js` – router, lazy-loading iger.
- `js/games/*.js` – 24 kognitivnih iger + paketni dnevni izziv.
- `js/store.js` – IndexedDB + Settings.
- `js/stats.js` – statistika in grafi.
- `css/` – stilski moduli + `games.bundle.css`.
- `data/` – `tasks.json`, `puzzles.json`, `patterns.json`, slovarji.
- `service-worker.js` – PWA cache.
- `docs/` – QA in objava.

## Offline

Service Worker predpomni assete. Po prvem obisku deluje offline.

## Licenca

MIT.
