// js/router.js — Hash usmerjevalnik in analiza URL stanj

/**
 * Razčleni hash niz v ciljno ruto in parametre.
 * @param {string} [hashStr] hash niz (npr. '#game/sudoku' ali '#settings')
 * @returns {{target: string, params: string|null, subParam: string|null}}
 */
export function parseHash(hashStr) {
  const raw = String(
    hashStr !== undefined ? hashStr : typeof window !== 'undefined' ? window.location.hash : ''
  )
    .replace('#', '')
    .trim();
  if (!raw) return { target: 'game-list', params: null, subParam: null };

  const parts = raw.split('/');
  const main = parts[0];
  if (main === 'game') {
    const gameId = parts[1] || 'uganke';
    const subParam = parts.slice(2).join('/');
    return { target: 'game', params: gameId, subParam: subParam || null };
  }
  if (
    main === 'game-list' ||
    main === 'settings' ||
    main === 'stats' ||
    main === 'achievements' ||
    main === 'daily'
  ) {
    return { target: main, params: null, subParam: null };
  }
  return { target: 'game', params: main, subParam: parts.slice(1).join('/') || null };
}

/**
 * Oblikuje hash niz za podano ruto.
 * @param {string} target ciljna ruta (npr. 'game', 'game-list')
 * @param {string|null} [params] identifikator igre
 * @param {string|null} [subParam] podparameter (npr. številka uganke)
 * @returns {string} npr. '#game/vzorci/2'
 */
export function formatHash(target, params = null, subParam = null) {
  if (target === 'game' && params) {
    return `#game/${params}${subParam ? `/${subParam}` : ''}`;
  }
  return `#${target}`;
}
