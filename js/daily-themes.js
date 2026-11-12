// js/daily-themes.js — Tematski dnevni izzivi po kategorijah (Neo-Brutalism koncept)
import { statsManager } from './stats.js';
import { loadJson, saveJson } from './store.js';
import { todayKey } from './utils/helpers.js';
import { escapeHtml } from './ui.js';

// Pooldnevni izzivov po kategorijah (ustrezajo games.json dailyPools)
const DAILY_POOLS = {
  matematika: ['racunanje', 'vzorci', 'kvadriranje', 'sudoku'],
  besede: ['words', 'besedle', 'povezave', 'besedolov'],
  spomin: ['spomin', 'zaporedje', 'corsi', 'dualnback'],
  logika: ['uganke', '2048', 'minolovec', 'nonogram'],
};

const CATEGORY_META = {
  matematika: { title: 'Matematika', icon: '🔢' },
  besede: { title: 'Besede', icon: '✍️' },
  spomin: { title: 'Spomin', icon: '👁️' },
  logika: {
    title: 'Logika',
    icon: '<img src="./icons/brain-symbol.png" alt="" aria-hidden="true" class="h-4 w-4 inline-block object-contain" width="16" height="16" />',
  },
};

const STATS_KEY = 'miselni_izzivi_stats';

function loadStats() {
  const parsed = loadJson(STATS_KEY, null);
  if (parsed && typeof parsed === 'object') {
    parsed.streaks = parsed.streaks || {};
    parsed.completedDailies = parsed.completedDailies || {};
    parsed.personalBests = parsed.personalBests || {};
    return parsed;
  }
  return { streaks: {}, completedDailies: {}, personalBests: {} };
}

function saveStats(stats) {
  saveJson(STATS_KEY, stats);
}

// Hash funkcija iz datuma (po predlogu)
function hashDate(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function getDailyGameForCategory(categoryKey) {
  const pool = DAILY_POOLS[categoryKey];
  if (!pool || pool.length === 0) return null;
  const today = todayKey();
  const hash = hashDate(today + ':' + categoryKey);
  const selectedIndex = Math.abs(hash) % pool.length;
  return pool[selectedIndex];
}

export function isDailyCompleted(categoryKey) {
  const stats = loadStats();
  const today = todayKey();
  const completed = stats.completedDailies[today];
  return Array.isArray(completed) && completed.includes(categoryKey);
}

export function getStreak(categoryKey) {
  const stats = loadStats();
  return stats.streaks[categoryKey] || 0;
}

export function markDailyComplete(categoryKey) {
  const stats = loadStats();
  const today = todayKey();
  if (!Array.isArray(stats.completedDailies[today])) stats.completedDailies[today] = [];
  if (!stats.completedDailies[today].includes(categoryKey)) {
    stats.completedDailies[today].push(categoryKey);
    // Povečaj streak
    stats.streaks[categoryKey] = (stats.streaks[categoryKey] || 0) + 1;
    saveStats(stats);
    // XP bonus
    try {
      statsManager.addXp(25);
    } catch {
      /* noop */
    }
  }
}

// Ime igre po id (iz tasks cache ali fallback)
export function gameTitle(id) {
  // Poskusi iz localStorage cache tasks
  try {
    const cached = localStorage.getItem('miselni_tasks_cache_v1');
    if (cached) {
      const tasks = JSON.parse(cached);
      const t = tasks.find(x => x.id === id);
      if (t && t.title) return t.title;
    }
  } catch {
    /* noop */
  }
  return id;
}

export function playDaily(categoryKey) {
  const gameId = getDailyGameForCategory(categoryKey);
  if (!gameId) return;
  // Shrani kontekst za completion tracking ob vrnitvi na seznam
  let beforeCount = 0;
  try {
    const recs = statsManager.getAllRecords()[gameId];
    beforeCount = Array.isArray(recs) ? recs.length : 0;
  } catch {
    /* noop */
  }
  window.__dailyTheme = { category: categoryKey, gameId, beforeCount };
  // Navigiraj
  if (typeof window.navigateTo === 'function') {
    window.navigateTo('game', gameId);
  } else {
    window.location.hash = `#game/${gameId}`;
  }
}

// Preveri completion ob vrnitvi (kliče main.js)
export function checkDailyCompletionOnReturn() {
  const d = window.__dailyTheme;
  if (!d) return;
  try {
    const recs = statsManager.getAllRecords()[d.gameId];
    const afterCount = Array.isArray(recs) ? recs.length : 0;
    if (afterCount > d.beforeCount) {
      markDailyComplete(d.category);
    }
  } catch {
    /* noop */
  }
  window.__dailyTheme = null;
}

export function gameTitlePublic(id) {
  return gameTitle(id);
}
export function renderDailyThemesSection() {
  const categories = ['matematika', 'besede', 'spomin', 'logika'];
  const today = todayKey();
  const stats = loadStats();
  const completedToday = stats.completedDailies[today] || [];

  const colorMap = {
    matematika: { bg: 'bg-brutal-green', text: 'text-black' },
    besede: { bg: 'bg-brutal-orange', text: 'text-black' },
    spomin: { bg: 'bg-brutal-pink', text: 'text-black' },
    logika: { bg: 'bg-brutal-cyan', text: 'text-black' },
  };

  const cards = categories
    .map(cat => {
      const meta = CATEGORY_META[cat];
      const gameId = getDailyGameForCategory(cat);
      const title = gameTitle(gameId);
      const done = completedToday.includes(cat);
      const streak = stats.streaks[cat] || 0;
      const cm = colorMap[cat];

      return `
        <div class="daily-theme-card brutal-card bg-white border-4 border-black p-5 shadow-brutal relative flex flex-col justify-between gap-3">
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="px-2 py-1 ${cm.bg} border-2 border-black font-heading font-black text-xs flex items-center gap-1.5"><span>${meta.icon}</span> ${meta.title.toUpperCase()}</span>
              <span class="text-xs font-bold ${done ? 'text-green-700' : 'text-slate-600'}">${done ? '✓ Rešeno!' : '🔥 Serija: ' + streak}</span>
            </div>
            <h3 class="gc-title text-lg font-heading font-black text-black">${escapeHtml(title)}</h3>
            <p class="gc-desc text-sm font-medium text-slate-700 leading-relaxed">Igra dneva: ${escapeHtml(title)}</p>
          </div>
          ${
            done
              ? `<button class="brutal-btn w-full py-2 bg-slate-200 text-slate-600 font-heading font-black text-sm border-3 border-black cursor-not-allowed" disabled>OPRAVLJENO ✔️</button>`
              : `<button class="brutal-btn daily-theme-btn w-full py-2 bg-brutal-yellow text-black font-heading font-black text-sm border-3 border-black shadow-brutal-sm" data-cat="${cat}">REŠUJ IZZIV →</button>`
          }
        </div>
      `;
    })
    .join('');

  return `
    <div class="daily-themes-block flex flex-col gap-6">
      <h2 class="text-lg font-heading font-black text-black">🔥 DNEVNI IZZIVI PO KATEGORIJAH</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${cards}
      </div>
    </div>
  `;
}

// Globalni handler za klik
if (typeof window !== 'undefined') {
  window.__dailyThemesReady = true;
}
