// js/games/daily-challenge.js — Dnevni izziv z determinističnim seedom
import { statsManager } from '../stats.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderGameShell } from './game-layout.js';
import { renderStartCard } from './game-start.js';
import { mulberry32, dateToSeed } from '../utils/rng.js';

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
  try {
    const all = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');
    return all[dateStr] || { completed: [], started: false, seed: null };
  } catch {
    return { completed: [], started: false, seed: null };
  }
}

function saveDailyProgress(dateStr, progress) {
  try {
    const all = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');
    all[dateStr] = progress;
    // Ohrani zadnjih 30 dni
    const keys = Object.keys(all).sort();
    if (keys.length > 30) delete all[keys[0]];
    localStorage.setItem(DAILY_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Daily progress save failed:', e);
  }
}

export function renderDailyChallenge(subParam = null) {
  // Preveri, ali gre za deljeni izziv (subParam = seed)
  const isShared = subParam && !isNaN(parseInt(subParam, 10));
  const shareSeed = isShared ? parseInt(subParam, 10) : null;

  const today = new Date().toISOString().split('T')[0];
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
    <div class="card" style="margin-bottom: var(--spacing-md);">
      <h3>📅 Dnevni izziv ${isShared ? '(deljen)' : `— ${formatDateSlovenian(today)}`}</h3>
      <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: var(--spacing-sm);">
        ${isComplete ? '🎉 Dnevni izziv zaključen!' : `${completedCount} / ${totalCount} iger opravljeno`}
        ${isShared ? `<br><small>Seed: ${seed} | Deljen izziv – rezultat se ne shranjuje v tvoj streak.</small>` : ''}
      </p>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
        ${dailyGames
          .map(
            (g, i) => `
          <span class="badge ${progress.completed.includes(g.id) ? 'completed' : ''}" style="
            background: ${progress.completed.includes(g.id) ? 'rgba(16,185,129,0.2)' : 'rgba(var(--color-primary-rgb),0.12)'};
            color: ${progress.completed.includes(g.id) ? '#047857' : 'var(--color-primary)'};
            border-color: ${progress.completed.includes(g.id) ? 'rgba(16,185,129,0.3)' : 'rgba(var(--color-primary-rgb),0.2)'};
          ">
            ${i + 1}. ${g.name} ${progress.completed.includes(g.id) ? '✓' : ''}
          </span>
        `
          )
          .join('')}
      </div>
      ${
        !isShared && isComplete
          ? `
        <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="daily-share-btn" class="btn btn-outline" style="font-size: 0.85rem;">🔗 Deli izziv</button>
          <button id="daily-copy-link-btn" class="btn btn-outline" style="font-size: 0.85rem;">📋 Kopiraj povezavo</button>
        </div>
      `
          : ''
      }
    </div>
  `;

  const stageHtml = `
    <div id="daily-stage">
      <div id="daily-start-screen" class="stage-layer">
        ${renderStartCard(
          isComplete
            ? `Dnevni izziv za ${formatDateSlovenian(today)} je že zaključen! 🎉\n\nPridobil si ${progress.totalXP || 0} XP. Pričakuj jutri za nov izziv.`
            : `Danes te čakajo <strong>${totalCount} kratke igre</strong> (skupaj ~${Math.round(dailyGames.reduce((s, g) => s + g.minDuration, 0) / 60)} min).\n\nVsaka igra meri eno kognitivno sposobnost. Rezultati se primerjajo z včerajšnjim dnem.`,
          'daily-start-btn',
          isComplete ? '📊 Poglej statistiko' : '▶ Začni dnevni izziv',
          'Dnevni Izziv'
        )}
      </div>

      <div id="daily-game-screen" class="stage-layer hidden"></div>

      <div id="daily-complete-screen" class="stage-layer hidden">
        <div class="card text-center" style="max-width: 400px; margin: auto;">
          <div style="font-size: 3rem; margin-bottom: var(--spacing-sm);">🏆</div>
          <h3 class="result-title result-success">Dnevni izziv zaključen!</h3>
          <p class="muted-xs">Opravljeno iger: <strong>${totalCount}/${totalCount}</strong></p>
          <p class="muted-xs">Skupni XP: <strong id="daily-total-xp">${progress.totalXP || 0}</strong> XP</p>
          <p class="muted-xs" style="margin-top: var(--spacing-sm);" id="daily-comparison"></p>
          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
            <button id="daily-share-btn" class="btn btn-outline" style="font-size: 0.85rem;">🔗 Deli izziv</button>
            <button id="daily-copy-link-btn" class="btn btn-outline" style="font-size: 0.85rem;">📋 Kopiraj povezavo</button>
            <button id="daily-back-btn" class="btn" style="margin-top: var(--spacing-md);">← Nazaj na meni</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const infoHtml = `
    <h4 style="margin-bottom: 8px;">Kaj je Dnevni izziv?</h4>
    <p style="margin-bottom: 12px;">Vsak dan na novo generiran nabor 3–4 kratkih iger, prilagojen tvojem nivoju. Iisti izziv imajo vsi uporabniki istega dana –primerjaj se s prijatelji!</p>
    <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.8;">
      <li><strong>Determinističen:</strong> Iste igre, ista težavnost za vse uporabnike istega dne.</li>
      <li><strong>Prilagodljivo:</strong> Težavnost se spreminja glede na tvoj napredek (adaptivno).</li>
      <li><strong>Kratek:</strong> 3–5 minut dnevno za optimalno kognitivno vadbo.</li>
      <li><strong>Streak:</strong> Ohrani niz zaporednih dni za bonus XP.</li>
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
  const today = new Date().toISOString().split('T')[0];
  let progress = getDailyProgress(today);
  const seed = progress.seed || dateToSeed(today);
  const dailyGames = selectDailyGames(seed);
  let currentGameIndex = progress.completed.length;
  let sessionXP = progress.totalXP || 0;
  let activeInterval = null;

  const startScreen = document.getElementById('daily-start-screen');
  const gameScreen = document.getElementById('daily-game-screen');
  const completeScreen = document.getElementById('daily-complete-screen');
  const startBtn = document.getElementById('daily-start-btn');
  const backBtn = document.getElementById('daily-back-btn');

  function showScreen(screen) {
    [startScreen, gameScreen, completeScreen].forEach(s => s?.classList.add('hidden'));
    screen?.classList.remove('hidden');
  }

  async function loadAndRunGame(gameId) {
    const { default: mod } = await import(`./${gameId}.js`);
    return new Promise(resolve => {
      gameScreen.innerHTML = '';
      const initMap = {
        spomin: () => mod.initSpomin(),
        zaporedje: () => mod.initZaporedje(),
        reakcija: () => mod.initReakcija('classic'),
        corsi: () => mod.initCorsi(),
        search: () => mod.initSearch(),
        stroop: () => mod.initStroop(),
        racunanje: () => mod.initRacunanje(),
        switch: () => mod.initSwitch(),
      };
      const cleanup = initMap[gameId]?.();

      // Override back button to return to daily flow
      window.customGameBackHandler = () => {
        if (cleanup) cleanup();
        window.customGameBackHandler = null;
        finishCurrentGame(false);
        return true;
      };

      // Watch for game completion via XP event or custom event
      activeInterval = setInterval(() => {
        const gameProgress = getDailyProgress(today);
        if (gameProgress.completed.includes(gameId)) {
          clearInterval(activeInterval);
          activeInterval = null;
          window.customGameBackHandler = null;
          finishCurrentGame(true);
        }
      }, 500);
    });
  }

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
      showToast(`🔥 Streak bonus: +${bonus} XP (${gamification.streak} dni zapored)!`, {
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
    const yesterday = new Date(todayStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const yProgress = getDailyProgress(yStr);
    if (yProgress.totalXP) {
      const diff = todayXP - yProgress.totalXP;
      return diff >= 0
        ? `📈 Bolje kot včeraj za ${diff} XP!`
        : `📉 Včeraj si dosegel ${Math.abs(diff)} XP več.`;
    }
    return 'Prvi dan srečevanja! 🌟';
  }

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

  // Event listeners
  if (startBtn) startBtn.addEventListener('click', startNextGame);
  if (backBtn)
    backBtn.addEventListener('click', () => {
      window.location.hash = '#game-list';
    });

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
        showToast('Napaka pri kopiranju', { type: 'error' });
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
    if (activeInterval) clearInterval(activeInterval);
    window.customGameBackHandler = null;
  };
}
