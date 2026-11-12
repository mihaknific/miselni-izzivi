// js/game-catalog.js — Iskanje in filtriranje kataloga iger

/**
 * Preveri, ali kartica ustreza iskalnemu nizu in izbrani kategoriji.
 * @param {{title?: string, desc?: string, badge?: string, tid?: string}} item
 * @param {string} query
 * @param {string} cat
 * @returns {boolean}
 */
export function matchesGameFilter(
  { title = '', desc = '', badge = '', tid = '' } = {},
  query = '',
  cat = 'all'
) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  const c = String(cat || 'all')
    .trim()
    .toLowerCase();
  const t = String(title || '').toLowerCase();
  const d = String(desc || '').toLowerCase();
  const b = String(badge || '').toLowerCase();
  const id = String(tid || '').toLowerCase();

  const matchesQuery = !q || t.includes(q) || d.includes(q) || id.includes(q) || b.includes(q);
  if (!matchesQuery) return false;

  if (c === 'all') return true;
  if (b.includes(c)) return true;
  if (c === 'številke' && ['2048', 'sudoku', 'racunanje', 'kvadriranje'].includes(id)) return true;
  if (c === 'besede' && ['besedle', 'besedolov', 'povezave', 'words', 'abeceda'].includes(id))
    return true;
  if (c === 'spomin' && ['spomin', 'corsi', 'dualnback', 'zaporedje', 'major'].includes(id))
    return true;
  if (c === 'pozornost' && ['stroop', 'reakcija', 'search', 'switch', 'trail'].includes(id))
    return true;
  if (c === 'logika' && ['uganke', 'vzorci', 'minolovec', 'nonogram'].includes(id)) return true;

  return false;
}

/**
 * Uveljavi trenutno iskalno poizvedbo in izbrano kategorijo na karticah iger.
 */
export function applyCatalogFilter() {
  const searchInput = document.getElementById('catalog-search-input');
  const query = searchInput?.value || '';
  const activePill = document.querySelector('.filter-pill.active');
  const cat = activePill ? activePill.dataset.filter : 'all';
  const cards = document.querySelectorAll('.game-card');

  cards.forEach(card => {
    const title = card.querySelector('.gc-title')?.textContent || '';
    const desc = card.querySelector('.gc-desc')?.textContent || '';
    const badge = card.querySelector('.gc-badge')?.textContent || '';
    const tid = card.dataset.tid || '';

    const visible = matchesGameFilter({ title, desc, badge, tid }, query, cat);
    card.classList.toggle('hidden', !visible);
  });
}
