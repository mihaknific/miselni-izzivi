// js/games/daily-challenge.js — Dnevni izziv z determinističnim seedom
import { statsManager } from '../stats.js';
import { loadJson, saveJson } from '../store.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderGameShell } from './game-layout.js';
import { renderStartCard } from './game-start.js';
import { mulberry32, dateToSeed } from '../utils/rng.js';
import { todayKey } from '../utils/helpers.js';

// Igre, ki so primerne za dnevni izziv (hitro, merljive)
const DAILY_GAMES = [
  { id: 'spomin', name: 'Spomin', minDuration: 60, maxDuration: 120 },
  { id: 'zaporedje', name: 'Zaporedje', minDuration: 45, maxDuration: 90 },
  { id: 'reakcija', name: 'Reakcija', minDuration: 30, maxDuration: 60 },
  { id: 'corsi', name: 'Corsi', minDuration: 45, maxDuration: 90 },
  { id: 'search', name: 'Iskanje', minDuration: 30, maxDuration: 60 },
  { id: 'stroop', name: 'Stroop', minDuration: 45, maxDuration: 90 },
  { id: 'racunanje', name: 'Računanje', minDuration: 60, maxDuration: 120 },
  { id: 'switch', name: 'Preklop', minDuration: 45, maxDuration: 90 },
];

// Izberi 3-4 igre za današnji dan
function selectDailyGames(seed) {
  const rng = mulberry32(seed);
  const shuffled = [...DAILY_GAMES].sort(() => rng() - 0.5);
  const count = 3 + Math.floor(rng() * 2); // 3 ali 4 igre
  return shuffled.slice(0, count);
}

// Shrani/retrieve dnevni progress
const DAILY_KEY = 'daily_challenge_progress';

function getDailyProgress(dateStr) {
  const all = loadJson(DAILY_KEY, {});
  return all[dateStr] || { completed: [], started: false, seed: null };
}

function saveDailyProgress(dateStr, progress) {
  const all = loadJson(DAILY_KEY, {});
  all[dateStr] = progress;
  // Ohrani zadnjih 30 dni
  const keys = Object.keys(all).sort();
  if (keys.length > 30) delete all[keys[0]];
  saveJson(DAILY_KEY, all);
}

/**
 * Slovenščina: formatira "2026-11-05" kot "5. novembra 2026" (modulni nivo —
 * uporabljajo jo glava, deljeni naslov in share tekst).
 */
function formatDateSlovenian(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = [
    'januarja',
    'februarja',
    'marca',
    'aprila',
    'maja',
    'junija',
    'julija',
    'avgusta',
    'septembra',
    'oktobra',
    'novembra',
    'decembra',
  ];
  return `${parseInt(d, 10)}. ${months[parseInt(m, 10) - 1]} ${y}`;
}

export function renderDailyChallenge(subParam = null) {
  // Preveri, ali gre za deljeni izziv (subParam = seed)
  const isShared = subParam && !isNaN(parseInt(subParam, 10));
  const shareSeed = isShared ? parseInt(subParam, 10) : null;

  const today = todayKey();
  const progress = getDailyProgress(today);
  const seed = shareSeed || progress.seed || dateToSeed(today);
  const dailyGames = selectDailyGames(seed);

  // Shrani seed če ga še ni (samo za dnevni, ne za deljeni)
  if (!isShared && !progress.seed) {
    saveDailyProgress(today, { ...progress, seed });
  }

  const completedCount = isShared ? 0 : progress.completed.length;
  const totalCount = dailyGames.length;
  const isComplete = isShared ? false : completedCount >= totalCount;

  const settingsHtml = `
    <div class="brutal-card bg-white border-4 border-black p-5 shadow-brutal mb-6">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span class="px-2.5 py-1 bg-brutal-orange text-black border-2 border-black font-heading font-black text-xs uppercase shadow-brutal-sm">
          📅 ${isShared ? 'DELJEN IZZIV' : formatDateSlovenian(today).toUpperCase()}
        </span>
        <span class="text-xs font-bold ${isComplete ? 'text-green-700' : 'text-slate-700'}">
          ${isComplete ? '🎉 Opravljeno!' : `${completedCount} / ${totalCount} iger`}
        </span>
      </div>
      <p class="text-sm font-medium text-slate-700 mb-4">
        ${isComplete ? 'Čestitke! Današnji paket je zaključen.' : 'Opravi vse igre v paketu za današnji streak in bonus točke.'}
        ${isShared ? `<br><small class="text-xs text-slate-500">Seed: ${seed} | Deljen izziv – rezultat se ne shranjuje v streak.</small>` : ''}
      </p>
      <div class="flex flex-wrap gap-2">
        ${dailyGames
          .map(
            (g, i) => `
          <span class="px-3 py-1.5 border-2 border-black font-heading font-black text-xs flex items-center gap-1.5 shadow-brutal-sm ${
            progress.completed.includes(g.id)
              ? 'bg-brutal-green text-black'
              : 'bg-brutal-bg text-slate-700'
          }">
            ${i + 1}. ${g.name} ${progress.completed.includes(g.id) ? '✓' : ''}
          </span>
        `
          )
          .join('')}
      </div>
      ${
        !isShared && isComplete
          ? `
        <div class="mt-4 flex flex-wrap gap-3">
          <button id="daily-share-btn" class="brutal-btn px-4 py-2 bg-white text-black font-heading font-black text-xs border-3 border-black shadow-brutal-sm hover:bg-brutal-cyan transition-colors">🔗 DELI IZZIV</button>
          <button id="daily-copy-link-btn" class="brutal-btn px-4 py-2 bg-white text-black font-heading font-black text-xs border-3 border-black shadow-brutal-sm hover:bg-brutal-yellow transition-colors">📋 KOPIRAJ POVEZAVO</button>
        </div>
      `
          : ''
      }
    </div>
  `;

  const stageHtml = `
    <div id="daily-stage" class="w-full">
      <div id="daily-start-screen" class="stage-layer">
        ${renderStartCard(
          isComplete
            ? `Dnevni izziv za ${formatDateSlovenian(today)} je že zaključen! 🎉\n\nPridobil si ${progress.totalXP || 0} XP. Pričakuj jutri za nov izziv.`
            : `Danes te čakajo <strong>${totalCount} kratke igre</strong> (skupaj ~${Math.round(dailyGames.reduce((s, g) => s + g.minDuration, 0) / 60)} min).\n\nVsaka igra meri eno kognitivno sposobnost. Rezultati se primerjajo z včerajšnjim dnem.`,
          'daily-start-btn',
          isComplete ? '📊 Poglej statistiko' : '▶ ZAČNI DNEVNI IZZIV',
          'Dnevni Izziv'
        )}
      </div>

      <div id="daily-game-screen" class="stage-layer hidden w-full"></div>

      <div id="daily-complete-screen" class="stage-layer hidden">
        <div class="brutal-card bg-white border-4 border-black p-8 shadow-brutal-xl text-center max-w-md mx-auto flex flex-col items-center gap-4">
          <div class="w-16 h-16 bg-brutal-yellow border-3 border-black flex items-center justify-center text-3xl shadow-brutal-sm">🏆</div>
          <h3 class="text-2xl font-heading font-black text-black">Dnevni izziv zaključen!</h3>
          <p class="text-sm font-bold text-slate-800">Opravljeno iger: <strong>${totalCount}/${totalCount}</strong></p>
          <p class="text-sm font-bold text-slate-800">Skupni XP: <strong id="daily-total-xp" class="text-brutal-purple">${progress.totalXP || 0}</strong> XP</p>
          <p class="text-xs font-semibold text-slate-600" id="daily-comparison"></p>
          <div class="mt-2 flex flex-wrap gap-3 justify-center w-full">
            <button id="daily-share-btn" class="brutal-btn px-4 py-2.5 bg-brutal-cyan text-black font-heading font-black text-xs border-3 border-black shadow-brutal-sm hover:bg-brutal-green transition-colors flex-1">🔗 DELI</button>
            <button id="daily-copy-link-btn" class="brutal-btn px-4 py-2.5 bg-brutal-yellow text-black font-heading font-black text-xs border-3 border-black shadow-brutal-sm hover:bg-brutal-pink transition-colors flex-1">📋 KOPIRAJ</button>
          </div>
          <button id="daily-back-btn" class="brutal-btn w-full py-3 bg-white text-black font-heading font-black text-sm border-3 border-black shadow-brutal-sm hover:bg-slate-100 transition-colors mt-2" data-action="back-to-list">← NAZAJ NA SEZNAM IGER</button>
        </div>
      </div>
    </div>
  `;

  const infoHtml = `
    <h4 class="mb-sm">Kaj je Dnevni izziv?</h4>
    <p class="mb-md">Vsak dan na novo generiran nabor 3–4 kratkih iger, prilagojen tvojem nivoju. Isti izziv imajo vsi uporabniki istega dne – primerjaj se s prijatelji!</p>
    <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.8;">
      <li><strong>Determinističen:</strong> Iste igre, ista težavnost za vse uporabnike istega dne.</li>
      <li><strong>Prilagodljivo:</strong> Težavnost se spreminja glede na tvoj napredek (adaptivno).</li>
      <li><strong>Kratek:</strong> 3–5 minut dnevno za optimalno kognitivno vadbo.</li>
      <li><strong>Serija:</strong> Ohrani niz zaporednih dni za bonus XP.</li>
    </ul>
  `;

  return renderGameShell({
    title: 'Dnevni Izziv',
    subtitle: formatDateSlovenian(today),
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initDailyChallenge() {
  const today = todayKey();
  const progress = getDailyProgress(today);
  const seed = progress.seed || dateToSeed(today);
  const dailyGames = selectDailyGames(seed);
  let currentGameIndex = progress.completed.length;
  let sessionXP = progress.totalXP || 0;
  let activeGameId = null;

  const startScreen = document.getElementById('daily-start-screen');
  const gameScreen = document.getElementById('daily-game-screen');
  const completeScreen = document.getElementById('daily-complete-screen');
  const startBtn = document.getElementById('daily-start-btn');

  function showScreen(screen) {
    [startScreen, gameScreen, completeScreen].forEach(s => s?.classList.add('hidden'));
    screen?.classList.remove('hidden');
  }

  // Statični importi (kot nizi) — servisni delavec jih lahko predpomni za offline.
  const DAILY_IMPORTS = {
    spomin: () => import('./spomin.js'),
    zaporedje: () => import('./zaporedje.js'),
    reakcija: () => import('./reakcija.js'),
    corsi: () => import('./corsi.js'),
    search: () => import('./search.js'),
    stroop: () => import('./stroop.js'),
    racunanje: () => import('./racunanje.js'),
    switch: () => import('./switch.js'),
  };

  async function loadAndRunGame(gameId) {
    const loader = DAILY_IMPORTS[gameId];
    if (!loader) return;
    const mod = await loader();
    gameScreen.innerHTML = '';

    const renderMap = {
      spomin: () => mod.renderSpomin?.(),
      zaporedje: () => mod.renderZaporedje?.(),
      reakcija: () => mod.renderReakcija?.(),
      corsi: () => mod.renderCorsi?.(),
      search: () => mod.renderSearch?.(),
      stroop: () => mod.renderStroop?.(),
      racunanje: () => mod.renderRacunanje?.(),
      switch: () => mod.renderSwitch?.(),
    };

    const rendered = renderMap[gameId]?.();
    if (rendered) {
      gameScreen.innerHTML = rendered;
    }

    const initMap = {
      spomin: () => mod.initSpomin?.(),
      zaporedje: () => mod.initZaporedje?.(),
      reakcija: () => mod.initReakcija?.('classic'),
      corsi: () => mod.initCorsi?.(),
      search: () => mod.initSearch?.(),
      stroop: () => mod.initStroop?.(),
      racunanje: () => mod.initRacunanje?.(),
      switch: () => mod.initSwitch?.(),
    };
    const cleanup = initMap[gameId]?.();
    activeGameId = gameId;

    // Samodejno zaženi pod-igro (preskoči vmesni začetni zaslon pod-igre,
    // saj ima uporabnik že začetni zaslon Dnevnega izziva)
    const startButtonIds = {
      spomin: 'sp-start',
      zaporedje: 'zp-start-btn',
      reakcija: 'rk-start',
      corsi: 'corsi-start-btn',
      search: 'search-start-btn',
      stroop: 'st-start',
      racunanje: 'rc-start',
      switch: 'switch-start-btn',
    };
    const subBtnId = startButtonIds[gameId];
    if (subBtnId) {
      const subBtn = document.getElementById(subBtnId);
      if (subBtn) {
        subBtn.click();
      }
    }

    // Override back button to return to daily flow
    window.customGameBackHandler = () => {
      if (cleanup) cleanup();
      activeGameId = null;
      window.customGameBackHandler = null;
      finishCurrentGame(false);
      return true;
    };
  }

  // Zaključek igre zaznamo prek dogodka `game-record`, ki ga sproži
  // statsManager.saveRecord ob koncu vsake igre (prej: 500 ms polling).
  function onGameRecord(e) {
    const { gameId } = e.detail || {};
    if (!activeGameId || gameId !== activeGameId) return;
    activeGameId = null;
    window.customGameBackHandler = null;
    finishCurrentGame(true);
  }
  document.addEventListener('game-record', onGameRecord);

  function finishCurrentGame(completed) {
    const gameId = dailyGames[currentGameIndex];
    if (completed && !progress.completed.includes(gameId)) {
      progress.completed.push(gameId);
      sessionXP += 50; // Base XP per game
      statsManager.addXp(50);
    }

    currentGameIndex = progress.completed.length;
    progress.totalXP = sessionXP;
    saveDailyProgress(today, progress);

    if (currentGameIndex >= dailyGames.length) {
      showCompletionScreen();
    } else {
      showScreen(startScreen);
      updateStartScreen();
    }
  }

  function updateStartScreen() {
    const nextGame = dailyGames[currentGameIndex];
    const completedCount = progress.completed.length;
    startScreen.innerHTML = renderStartCard(
      `Igra <strong>${completedCount + 1} od ${dailyGames.length}</strong>: ${nextGame.name}\n\nPridobil si že ${sessionXP} XP.`,
      'daily-start-btn',
      '▶ Naprej',
      'Dnevni Izziv'
    );
    document.getElementById('daily-start-btn').addEventListener('click', startNextGame);
  }

  function showCompletionScreen() {
    showScreen(completeScreen);
    const comparison = getComparisonText(today, sessionXP);
    document.getElementById('daily-comparison').textContent = comparison;
    document.getElementById('daily-total-xp').textContent = sessionXP;
    showConfetti({ count: 30 });
    showToast(`🎉 Dnevni izziv zaključen! +${sessionXP} XP`, { type: 'success', timeout: 5000 });

    // Streak bonus
    const gamification = statsManager.getGamificationStats();
    if (gamification.streak >= 7) {
      const bonus = Math.min(gamification.streak * 10, 200);
      statsManager.addXp(bonus);
      showToast(`🔥 Bonus serije: +${bonus} XP (${gamification.streak} dni zapored)!`, {
        type: 'info',
      });
    }
  }

  async function startNextGame() {
    if (currentGameIndex >= dailyGames.length) return;
    const gameId = dailyGames[currentGameIndex];
    showScreen(gameScreen);
    await loadAndRunGame(gameId);
  }

  function getComparisonText(todayStr, todayXP) {
    // Izračunaj "včeraj" lokalno (toISOString bi pri polnoči prestopil UTC/lokalni mejo)
    const yesterday = new Date(`${todayStr}T00:00:00`);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = todayKey(yesterday);
    const yProgress = getDailyProgress(yStr);
    if (yProgress.totalXP) {
      const diff = todayXP - yProgress.totalXP;
      return diff >= 0
        ? `📈 Bolje kot včeraj za ${diff} XP!`
        : `📉 Včeraj si dosegel ${Math.abs(diff)} XP več.`;
    }
    return 'Prvi dan srečevanja! 🌟';
  }

  // Event listeners
  if (startBtn) startBtn.addEventListener('click', startNextGame);

  // Share functionality
  const shareBtn = document.getElementById('daily-share-btn');
  const copyLinkBtn = document.getElementById('daily-copy-link-btn');
  const shareUrl = `${window.location.origin}${window.location.pathname}#game/daily/${seed}`;

  function shareChallenge() {
    if (navigator.share) {
      navigator
        .share({
          title: `Miselni Izzivi - Dnevni izziv ${formatDateSlovenian(today)}`,
          text: `Izazval te na dnevni izziv! Seed: ${seed}. Poskusi premagati moj rezultat!`,
          url: shareUrl,
        })
        .catch(() => copyToClipboard(shareUrl));
    } else {
      copyToClipboard(shareUrl);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast('🔗 Povezava kopirana v odložišče!', { type: 'success' });
      })
      .catch(() => {
        showToast('Kopiranje ni uspelo', { type: 'error' });
      });
  }

  if (shareBtn) shareBtn.addEventListener('click', shareChallenge);
  if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => copyToClipboard(shareUrl));

  // Init - show appropriate screen
  if (progress.completed.length >= dailyGames.length) {
    showCompletionScreen();
  } else {
    updateStartScreen();
    showScreen(startScreen);
  }

  return () => {
    document.removeEventListener('game-record', onGameRecord);
    window.customGameBackHandler = null;
  };
}
