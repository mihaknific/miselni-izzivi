// js/games/search.js — Vizualno iskanje / Iskanje tujka (ES6 modul)
import { sounds } from '../sounds.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell, showGameLayer, finishGameEpilogue } from './game-layout.js';
import { bindGameSettings } from './game-settings-panel.js';
import {
  getAdaptiveDifficulty,
  isAdaptiveDisabled,
  renderAdaptiveSettingsPanel,
  bindAdaptiveEvents,
  setAdaptiveDifficulty,
} from '../adaptive-difficulty.js';

const TARGET_PAIRS = [
  { target: 'O', distractor: 'Q' },
  { target: 'E', distractor: 'F' },
  { target: 'P', distractor: 'R' },
  { target: 'C', distractor: 'G' },
  { target: 'S', distractor: '5' },
  { target: 'Z', distractor: '2' },
  { target: 'I', distractor: '1' },
  { target: 'B', distractor: '8' },
];

export function renderSearch() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Vrsta iskanja
                <select id="search-type" class="form-select">
                    <option value="feature" selected>Enostavno iskanje (znaki / 1 lastnost)</option>
                    <option value="conjunction">Kombinirano iskanje (barva + oblika)</option>
                </select>
            </label>
            <label class="form-label">Število krogov
                <select id="search-rounds" class="form-select">
                    <option value="5">5 krogov</option>
                    <option value="10" selected>10 krogov</option>
                    <option value="15">15 krogov</option>
                </select>
            </label>
        </div>
        <div class="settings-row">
            <label class="form-label">Začetna velikost mreže
                <select id="search-grid-size" class="form-select">
                    <option value="3">3 x 3</option>
                    <option value="4" selected>4 x 4</option>
                    <option value="5">5 x 5</option>
                </select>
            </label>
${renderAdaptiveSettingsPanel('search')}
        </div>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="search-start-screen" class="stage-layer">
                ${renderStartCard(
                  'Čim hitreje poišči in klikni edini znak v mreži, ki se razlikuje od vseh ostalih.',
                  'search-start-btn',
                  '▶ Začni preizkus',
                  'Iskanje tujka (Visual Search)'
                )}
            </div>

            <div id="search-play-screen" class="stage-layer hidden">
                <div class="search-stage-container">
                    <div id="search-prompt" class="search-prompt">Poišči drugačen znak!</div>
                    <div id="search-grid" class="search-grid"></div>
                </div>
            </div>

            <div id="search-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content game-dialog-box" style="--dialog-max-w: 360px;">
                    <h3 class="result-title result-success">Preizkus zaključen! 🎉</h3>
                    <p class="muted-xs MBXS">Povprečni čas iskanja: <strong id="search-avg-time">0</strong> ms</p>
                    <p class="muted-xs mb-sm">Pravilnih odgovorov: <strong id="search-accuracy">0/0</strong></p>
                    <button id="search-retry-btn" class="btn">Poskusi znova</button>
                    <button id="search-back-to-list" class="btn btn-outline ml-sm" data-action="back-to-list">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 class="mb-sm">O preizkusu vizualnega iskanja (Visual Search)</h4>
        <p class="mb-md">Vizualno iskanje je uveljavljen nevropsihološki preizkus za merjenje <strong>selektivne pozornosti, hitrosti vizualnega procesiranja ter opazovanja</strong> (Treisman & Gelade, 1980).</p>
        <h4 class="mb-sm">Pravila igre:</h4>
        <ul class="info-list">
            <li>V mreži se nahaja množica enakih znakov in en sam "tujek", ki se razlikuje od ostalih.</li>
            <li>Klikni na drugačen znak v čim krajšem času.</li>
            <li>Z vsakim krogom se zahtevnost in velikost mreže postopoma prilagajata.</li>
        </ul>
    `;

  return renderGameShell({
    title: 'Iskanje tujka',
    subtitle: 'Preizkus selektivne pozornosti in hitrosti skeniranja.',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initSearch() {
  let currentRound = 0;
  let totalRounds = 10;
  let initialGridSize = 4;
  let targetIndex = -1;
  let roundStartTime = 0;
  let responseTimes = [];
  let correctCount = 0;
  let roundActive = false;

  const startScreen = document.getElementById('search-start-screen');
  const playScreen = document.getElementById('search-play-screen');
  const endScreen = document.getElementById('search-end-screen');

  const gridContainer = document.getElementById('search-grid');
  const startBtn = document.getElementById('search-start-btn');
  const retryBtn = document.getElementById('search-retry-btn');

  let searchType = 'feature';

  function readSettingsFromUI() {
    const typeEl = document.getElementById('search-type');
    const roundsEl = document.getElementById('search-rounds');
    const gridEl = document.getElementById('search-grid-size');

    if (typeEl) searchType = typeEl.value || 'feature';
    if (roundsEl) totalRounds = parseInt(roundsEl.value, 10) || 10;
    const adaptive = getAdaptiveDifficulty('search');
    if (adaptive && !isAdaptiveDisabled('search')) {
      initialGridSize = adaptive.value;
      if (gridEl) gridEl.value = String(initialGridSize);
    } else if (gridEl) {
      initialGridSize = parseInt(gridEl.value, 10) || 4;
    }
  }

  bindGameSettings('search', {
    defaults: { searchType: 'feature', totalRounds: 10, initialGridSize: 4 },
    apply: saved => {
      searchType = saved.searchType || 'feature';
      totalRounds = saved.totalRounds || 10;
      initialGridSize = saved.initialGridSize || 4;
      const adaptive = getAdaptiveDifficulty('search');
      if (adaptive && !isAdaptiveDisabled('search')) {
        initialGridSize = adaptive.value;
      }
      const typeEl = document.getElementById('search-type');
      const roundsEl = document.getElementById('search-rounds');
      const gridEl = document.getElementById('search-grid-size');
      if (typeEl) typeEl.value = searchType;
      if (roundsEl) roundsEl.value = String(totalRounds);
      if (gridEl) gridEl.value = String(initialGridSize);
    },
    readFromUI: readSettingsFromUI,
    collect: () => ({ searchType, totalRounds, initialGridSize }),
    afterApply: () => {
      setAdaptiveDifficulty('search', initialGridSize);
      showLayer(startScreen);
    },
  });

  bindAdaptiveEvents('search');

  function showLayer(layer) {
    showGameLayer([startScreen, playScreen, endScreen], layer);
  }

  function renderRound() {
    if (currentRound >= totalRounds) {
      finishGame();
      return;
    }

    currentRound++;
    const currentGridSize = Math.min(6, initialGridSize + Math.floor((currentRound - 1) / 3));
    const totalItems = currentGridSize * currentGridSize;

    targetIndex = Math.floor(Math.random() * totalItems);

    gridContainer.style.gridTemplateColumns = `repeat(${currentGridSize}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${currentGridSize}, 1fr)`;
    gridContainer.innerHTML = '';

    if (searchType === 'conjunction') {
      // Target: Red Circle (🔴). Distractors: Red Square (🟥) & Blue Circle (🔵)
      for (let i = 0; i < totalItems; i++) {
        const item = document.createElement('div');
        item.className = 'search-item';
        if (i === targetIndex) {
          item.textContent = '🔴';
        } else {
          item.textContent = Math.random() < 0.5 ? '🟥' : '🔵';
        }
        item.dataset.index = i;
        item.addEventListener('click', () => handleItemClick(i, item));
        gridContainer.appendChild(item);
      }
    } else {
      // Feature search z znaki
      const pair = TARGET_PAIRS[Math.floor(Math.random() * TARGET_PAIRS.length)];
      for (let i = 0; i < totalItems; i++) {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.textContent = i === targetIndex ? pair.target : pair.distractor;
        item.dataset.index = i;
        item.addEventListener('click', () => handleItemClick(i, item));
        gridContainer.appendChild(item);
      }
    }

    roundStartTime = performance.now();
    roundActive = true;
  }

  function handleItemClick(idx, element) {
    if (!roundActive) return;
    roundActive = false;
    const timeTaken = Math.round(performance.now() - roundStartTime);
    const items = Array.from(gridContainer.children);

    items.forEach(it => it.classList.add('disabled'));

    if (idx === targetIndex) {
      element.classList.add('correct');
      sounds.play('correct');
      responseTimes.push(timeTaken);
      correctCount++;
    } else {
      element.classList.add('wrong');
      const targetEl = items[targetIndex];
      if (targetEl) targetEl.classList.add('correct');
      sounds.play('error');
    }

    setTimeout(() => {
      renderRound();
    }, 400);
  }

  function finishGame() {
    const avgTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;
    const successRate = totalRounds > 0 ? correctCount / totalRounds : 0;

    finishGameEpilogue('search', {
      record: {
        avgMs: avgTime,
        accuracy: `${correctCount}/${totalRounds}`,
        searchType: searchType,
        rounds: totalRounds,
        gridSize: initialGridSize,
      },
      xp: correctCount * 10,
      adaptive: {
        success: successRate >= 0.75,
        score: correctCount,
        metric: 'accuracy',
      },
    });

    const avgEl = document.getElementById('search-avg-time');
    const accEl = document.getElementById('search-accuracy');

    if (avgEl) avgEl.textContent = avgTime;
    if (accEl) accEl.textContent = `${correctCount}/${totalRounds}`;

    showLayer(endScreen);
  }

  function startNewGame() {
    readSettingsFromUI();
    currentRound = 0;
    responseTimes = [];
    correctCount = 0;
    showLayer(playScreen);
    renderRound();
  }

  if (startBtn) startBtn.addEventListener('click', startNewGame);
  if (retryBtn) retryBtn.addEventListener('click', startNewGame);

  const keyHandler = e => {
    if (e.key === 'Enter') {
      if (!startScreen.classList.contains('hidden')) {
        startNewGame();
      } else if (!endScreen.classList.contains('hidden')) {
        startNewGame();
      }
    }
  };

  document.addEventListener('keydown', keyHandler);

  return () => {
    document.removeEventListener('keydown', keyHandler);
  };
}
