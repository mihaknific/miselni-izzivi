# Objava

Projekt je statična PWA. Objavi celotno mapo `2026-09-03-miselni-izzivi-modern` na HTTPS gostovanju.

## Pred objavo

```powershell
npm ci
npm run validate
npm test
npm run lint -- --quiet
npm run test:e2e
```

Za E2E teste morajo biti nameščeni brskalniki Playwright:

```powershell
npm exec playwright install chromium webkit
```

## Hosting

Datoteka `_headers` vsebuje CSP in priporočene varnostne HTTP-glave za Netlify, Cloudflare Pages in podobna statična gostovanja. Preveri, da hosting to datoteko prepozna in da je stran dostopna prek HTTPS.

Pri drugem strežniku prepiši glave iz `_headers` v njegovo konfiguracijo. `Strict-Transport-Security` vključi šele, ko HTTPS deluje pravilno na celotni domeni in poddomenah.

## Po objavi

1. Odpri stran v zasebnem oknu in preveri nalaganje vseh iger.
2. V DevTools preveri, da se lokalni Outfit fonti naložijo iz `/fonts/` in da ni zahtev do Google Fonts.
3. Preveri `manifest.webmanifest`, namestitev PWA, offline zagon in posodobitev Service Workerja.
4. Preveri varnostne glave z orodjem za pregled HTTP-glav.
5. Po spremembi Service Worker assetov povečaj `CACHE_VERSION` v `service-worker.js`.
