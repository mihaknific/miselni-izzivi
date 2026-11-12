# Objava

Projekt je statična PWA. GitHub Pages objavi vsebino glavne veje prek workflowa
`.github/workflows/deploy-pages.yml`.

## Pred objavo

```powershell
npm ci
npm run qa
npm run test:e2e
```

Za lokalne E2E teste morajo biti nameščeni brskalniki Playwright:

```powershell
npm exec playwright install chromium webkit
```

## GitHub Pages

V repozitoriju odpri **Settings → Pages** in kot vir objave izberi **GitHub Actions**.
Push na `main` samodejno zažene objavo; workflow lahko zaženeš tudi ročno v zavihku
**Actions**.

GitHub Pages ne uporabi datoteke `_headers`. Ta datoteka je namenjena statičnim
gostiteljem, ki podpirajo tak format (na primer Netlify ali Cloudflare Pages).
V `index.html` je CSP meta oznaka kot osnovna zaščita; za druge HTTP-glave uporabi
nastavitve izbrane platforme. HSTS `includeSubDomains` ali `preload` nastavi le,
če obvladuješ vse poddomene in je HTTPS povsod pravilno nastavljen.

## Po objavi

1. Odpri objavljeno stran v zasebnem oknu in preveri nalaganje iger.
2. Preveri, da se lokalni Inter fonti naložijo iz `/fonts/` in da ni zahtev do Google Fonts.
3. Preveri manifest, namestitev PWA, offline zagon in posodobitev Service Workerja.
4. Po spremembi datotek Service Worker poveča `CACHE_VERSION` v `service-worker.js`.
