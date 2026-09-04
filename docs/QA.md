# QA – Miselni Izzivi

## 1. Avtomatizirano (CI)

**Unit** `npm test` – 53 testov (`tests/games.test.js` + `tests/unit.test.js`):

- 2048 `slideAndMergeRow` (prazna, 2+2, veriga, 1024)
- Besedle `evaluateGuess` (correct/present/absent, duplicate, ČŠŽ), daily seed
- Povezave 14 ugank ×4, barve, `checkGroup`
- Besedolov `canForm` s šumniki, pangram, `scoreWord`
- Nonogram `computeClues`, Sudoku `isValid`, Minolovec 8 sosedov + varen prvi klik
- Viewport `100svh/100dvh` + `overflow-y:auto` + `games.bundle` responsive
- Slovarji `slovar5.json` 1000×5, `slovar.json` 2000×4-8
- Integracija `tasks.json` 25 iger, `stats.js` meta, `service-worker` v1240
- PWA `index.html` lang sl, `viewport-fit`, `manifest`

**Validacija** `npm run validate` – `data/tasks.json` 25, `puzzles.json` 36, `patterns.json` 50 proti `data/schemas/*.schema.json`.

**Lint/Format** `npm run lint` (`eslint:recommended`, `no-eval`, `eqeqeq`) in `npm run format:check` (`prettier`).

**E2E** `npm run test:e2e` (`playwright.config.js` – chromium/mobile/tablet, `http://localhost:3000`):

- Seznam 25 kartic, vsaka igra `render` brez `Napaka`
- Viewport: 2048 plošča <0.6*vh, besedle tipkovnica, sudoku 81 celic, minolovec 81
- Smoke: premik, vnos, izbor 4, številka, klik

**CI** `.github/workflows/ci.yml` – `validate → unit → e2e` na `ubuntu-latest`, Node 20, `playwright install`, upload `playwright-report` ob failu.

## 2. Ročni checklist (pred vsakim tagom)

**Naprave:** 320×568 (SE), 375×667, 390×844, 768×1024, 1280×800 – Chrome/Safari/Firefox, DevTools `Rendering → emulate prefers-reduced-motion`.

**Tok:**

- `#game-list` → `#game/2048` (puščice/WASD/swipe, undo, 6×6) → `#game/besedle` (LAHKO+Enter, hard mode) → `#game/povezave` (4 izbor, skoraj 3/4, življenja) → `#game/besedolov` (hive, pangram) → `#game/sudoku` (izbor, številka, zapiski, auto-zapiski) → `#game/minolovec` (flag, chord, prvi klik varen) → `#game/nonogram` (fill/✕, drag) → `back` → `stats` (25 iger, radar) → `achievements` → `daily` → offline (letalski način, `service-worker` `networkFirst` za `/data/*.json`, `cacheFirst` za ostalo).

**PWA:** `manifest.webmanifest` name/short_name, `theme_color`, `icons` 192/512 + maskable, `service-worker` `v1240` `APP_CACHE` + `DATA_CACHE`, `precache` 25 iger + `slovar*.json` + lokalni Outfit fonti.

**A11y:** `tab` skozi vse gumbe, `Enter` potrdi, `Escape` zapre drawer/modal, `aria-label` na ploščah (`role="grid"`, `role="gridcell"`), kontrast `AA` (`#6366f1` na `#fff` 4.5:1), `prefers-reduced-motion` izklopi animacije.

**Performance:** `content-visibility:auto` na `.game-card` `components.css:90`, `contain-intrinsic-size`, `will-change` na animacijah, `preload` za `Outfit`, `games.bundle.css` 90kB (vsi css, a `cacheFirst` + `content-visibility`).

## 3. Kako veš da vse dela?

- Zeleni CI badge + `npm run qa:full` lokalno (validate+test+lint+e2e) – 53 zelenih.
- `npm run dev` + `http://localhost:3000` ročni prehod seznama 25 iger na treh viewportih.
- Lighthouse `>90` Performance/Best Practices/A11y, `axe-core` 0 critical.
- Sentry (predlog) za runtime `window.onerror` + `statsManager` ne sme vreči.

## 4. Naslednji koraki

- Dodaj `TypeScript` (postopoma `js/*.js` → `ts`), `eslint --fix` v pre-commit hook.
- Razdeli `games.bundle.css` na per-game lazy CSS (`import './2048.css'` v `2048.js` + `link` dinamično).
- Dodaj `visual regression` (`playwright --update-snapshots`) za vsako ploščo.
