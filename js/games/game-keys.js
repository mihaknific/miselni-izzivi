// js/games/game-keys.js — enoten binding tipkovnice za igre (DRY).
// Nadomešča podvojen dodajanje/odstranjevanje `keydown` handlerjev in
// anti-vzorec globalnih spremenljivk (`window.__xxxKeyHandler`).

/**
 * Veže `keydown` handler na dokument in vrne funkcijo za odvezo,
 * ki jo igra pokliče v svoji cleanup funkciji.
 * @param {(e: KeyboardEvent) => void} handler
 * @returns {() => void} cleanup funkcija (idempotentna)
 */
export function bindGameKeys(handler) {
  document.addEventListener('keydown', handler);
  let unbound = false;
  return () => {
    if (unbound) return;
    unbound = true;
    document.removeEventListener('keydown', handler);
  };
}
