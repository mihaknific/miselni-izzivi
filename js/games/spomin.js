// js/games/spomin.js — Igra Spomin (Memory Match), ES6 modul
import { sounds } from '../sounds.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell, createGameTimer, finishGameEpilogue } from './game-layout.js';
import {
  getAdaptiveDifficulty,
  isAdaptiveDisabled,
  renderAdaptiveSettingsPanel,
  bindAdaptiveEvents,
} from '../adaptive-difficulty.js';
import { shuffle } from '../utils/rng.js';
import { formatTime } from '../utils/helpers.js';
import { bindGameSettings } from './game-settings-panel.js';

const themes = {
  emojis: [
    '🚀',
    '🌍',
    '🧠',
    '💡',
    '🎮',
    '🧩',
    '🎯',
    '🏆',
    '👾',
    '🎨',
    '🦖',
    '🍕',
    '🚗',
    '🎸',
    '⚽',
    '🔑',
    '💎',
    '🍿',
  ],
  numbers: [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
  ],
  letters: [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'R',
    'S',
  ],
};

export function renderSpomin() {
  const settingsHtml = `
        <select id="sp-difficulty" class="form-select">
            <option value="easy">Lahko (3×4)</option>
            <option value="medium" selected>Srednje (4×4)</option>
            <option value="hard">Težko (4×6)</option>
            <option value="expert">Ekspert (6×6)</option>
        </select>
        <select id="sp-theme" class="form-select">
            <option value="emojis" selected>Emojiji</option>
            <option value="numbers">Številke</option>
            <option value="letters">Črke</option>
        </select>
        ${renderAdaptiveSettingsPanel('spomin')}
    `;

  const stageHtml = `
        <div id="sp-stage" class="game-stage">
            <div id="sp-start-screen" class="stage-layer">
                ${renderStartCard('V tej igri poišči pare kart. Cilj je ujeti vse pare s čim manj potezami in v krajšem času.', 'sp-start', '▶ Začni', 'Spomin')}
            </div>

            <div id="sp-play-layer" class="stage-layer hidden">
                <div class="sp-board-wrapper">
                    <div class="game-status-bar">
                        <div class="game-status-pill">
                            <span class="game-status-label">Poteze</span>
                            <strong class="game-status-val" id="sp-moves">0</strong>
                        </div>
                        <div class="game-status-pill">
                            <span class="game-status-label">Čas</span>
                            <strong class="game-status-val" id="sp-time">00:00</strong>
                        </div>
                    </div>
                    <div id="sp-board" class="sp-game-board"></div>
                    <button id="sp-restart" class="btn btn-outline" style="margin-top: var(--spacing-sm); padding: 0.35rem 0.8rem; font-size: 0.85rem;">↺ Ponovno</button>
                    <div id="sp-victory-panel" class="sp-victory-panel hidden" style="margin-top: var(--spacing-sm); text-align: center; width: 100%; z-index: 10;">
                        <h3 class="result-title">🏆 Čestitke!</h3>
                        <p style="font-size: 0.9rem; margin-bottom: 8px; color: var(--custom-text);">Čas: <strong id="sp-final-time"></strong> | Poteze: <strong id="sp-final-moves"></strong></p>
                        <button id="sp-play-again" class="btn btn-sm" data-primary-action="true">Igraj znova</button>
                        <button id="sp-back-to-list" class="btn btn-outline btn-sm ml-sm" data-action="back-to-list">← Seznam iger</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <p class="mb-md">Klasična igra spomina za urjenje delovnega spomina in prostorske orientacije.</p>
        <p class="mb-md">Poiskati moraš pare enakih ikon tako, da obrneš po dve kartici naenkrat. Cilj je najti vse pare v čim manj potezah in v najkrajšem možnem času.</p>
        <p style="color: var(--color-text-muted); font-size: 0.9em;">Za večji izziv povečaj velikost mreže v nastavitvah igre.</p>
    `;

  return renderGameShell({
    title: 'Spomin',
    subtitle: 'Išči pare enakih ikon',
    settingsHtml,
    infoHtml,
    stageHtml,
  });
}

export function initSpomin() {
  let cards = [],
    hasFlipped = false,
    lockBoard = false;
  let firstCard,
    secondCard,
    matched = 0,
    totalPairs = 8;
  let started = false,
    flipResetTimeout = null;
  const gameTimer = createGameTimer(elapsed => {
    state.seconds = elapsed;
  });

  const board = document.getElementById('sp-board');
  const movesEl = document.getElementById('sp-moves');
  const timeEl = document.getElementById('sp-time');
  const victory = document.getElementById('sp-victory-panel');
  const diffSel = document.getElementById('sp-difficulty');
  const themeSel = document.getElementById('sp-theme');
  const startScreen = document.getElementById('sp-start-screen');
  const playLayer = document.getElementById('sp-play-layer');
  const boardWrapper = playLayer?.querySelector('.sp-board-wrapper');
  if (!board || !startScreen || !playLayer || !boardWrapper) return () => {};
  const state = new Proxy(
    { moves: 0, seconds: 0 },
    {
      set(target, prop, value) {
        target[prop] = value;
        if (prop === 'moves') movesEl.textContent = value;
        if (prop === 'seconds') {
          timeEl.textContent = formatTime(value);
        }
        return true;
      },
    }
  );

  function setupGame() {
    // Preveri adaptivno težavnost
    const adaptive = getAdaptiveDifficulty('spomin');
    if (adaptive && !isAdaptiveDisabled('spomin')) {
      diffSel.value = adaptive.config.difficultyLabels[adaptive.value];
    }

    const diff = diffSel.value;
    const theme = themeSel.value;
    let cols = 4;

    switch (diff) {
      case 'easy':
        totalPairs = 6;
        cols = 4;
        break;
      case 'medium':
        totalPairs = 8;
        cols = 4;
        break;
      case 'hard':
        totalPairs = 12;
        cols = 6;
        break;
      case 'expert':
        totalPairs = 18;
        cols = 6;
        break;
    }

    const rows = (totalPairs * 2) / cols;
    board.style.setProperty('--board-cols', cols);
    board.style.setProperty('--board-rows', rows);
    board.style.setProperty('--board-ratio', `${cols} / ${rows}`);

    const allSymbols = shuffle([...themes[theme]]);
    const selected = allSymbols.slice(0, totalPairs);
    cards = shuffle([...selected, ...selected]);

    // Reset
    board.innerHTML = '';
    hasFlipped = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    matched = 0;
    started = false;

    state.moves = 0;
    state.seconds = 0;

    gameTimer.reset();
    victory.classList.add('hidden');
    boardWrapper.classList.remove('victory-active');
    document.getElementById('sp-restart').style.display = 'block';

    cards.forEach(symbol => {
      const card = document.createElement('div');
      card.dataset.emoji = symbol;
      card.className = 'sp-card';
      card.textContent = '?';
      card.addEventListener('click', () => flipCard(card));
      board.appendChild(card);
    });

    // store layout info for sizing
    board._spCols = cols;
    board._spRows = rows;

    // the browser will resize the board and cards automatically via CSS rules
  }

  function startTimer() {
    if (!started) {
      started = true;
      gameTimer.start();
    }
  }

  function flipCard(card) {
    if (lockBoard || card === firstCard || card.dataset.matched) return;
    startTimer();

    card.textContent = card.dataset.emoji;
    card.classList.add('sp-card-flipped');

    if (!hasFlipped) {
      hasFlipped = true;
      firstCard = card;
      return;
    }

    secondCard = card;
    state.moves++;

    if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
      // Match
      sounds.playMatch();
      firstCard.dataset.matched = 'true';
      secondCard.dataset.matched = 'true';
      firstCard.classList.add('sp-card-matched');
      secondCard.classList.add('sp-card-matched');
      matched++;
      if (matched === totalPairs) endGame();
      hasFlipped = false;
      firstCard = null;
      secondCard = null;
    } else {
      // No match
      sounds.playError();
      lockBoard = true;
      flipResetTimeout = setTimeout(() => {
        firstCard.textContent = '?';
        firstCard.classList.remove('sp-card-flipped');
        secondCard.textContent = '?';
        secondCard.classList.remove('sp-card-flipped');
        hasFlipped = false;
        lockBoard = false;
        firstCard = null;
        secondCard = null;
      }, 800);
    }
  }

  function endGame() {
    gameTimer.stop();
    document.getElementById('sp-final-time').textContent = timeEl.textContent;
    document.getElementById('sp-final-moves').textContent = state.moves;

    finishGameEpilogue('spomin', {
      record: {
        moves: state.moves,
        difficulty: diffSel.value,
        theme: themeSel.value,
      },
      xp: totalPairs * 5,
      adaptive: { success: true, score: state.moves, metric: 'moves' },
      sound: 'victory',
    });

    // Pokaži panel in skri restart
    victory.classList.remove('hidden');
    boardWrapper.classList.add('victory-active');
    document.getElementById('sp-restart').style.display = 'none';
  }

  function showInitialScreen() {
    startScreen.classList.remove('hidden');
    playLayer.classList.add('hidden');
    victory.classList.add('hidden');
    boardWrapper.classList.remove('victory-active');
    document.getElementById('sp-restart').style.display = 'block';
  }

  function showPlayScreen() {
    startScreen.classList.add('hidden');
    playLayer.classList.remove('hidden');
    victory.classList.add('hidden');
    boardWrapper.classList.remove('victory-active');
    document.getElementById('sp-restart').style.display = 'block';
  }

  bindGameSettings('spomin', {
    apply: saved => {
      if (saved.difficulty) diffSel.value = saved.difficulty;
      if (saved.theme) themeSel.value = saved.theme;
      setupGame();
    },
    collect: () => ({
      difficulty: diffSel.value,
      theme: themeSel.value,
    }),
    afterApply: () => {
      setupGame();
      showInitialScreen();
    },
  });

  // Bind adaptive difficulty events
  bindAdaptiveEvents('spomin');

  document.getElementById('sp-restart')?.addEventListener('click', () => {
    setupGame();
    showPlayScreen();
  });
  document.getElementById('sp-play-again')?.addEventListener('click', () => {
    setupGame();
    showPlayScreen();
  });

  document.getElementById('sp-start')?.addEventListener('click', () => {
    setupGame();
    showPlayScreen();
  });

  setupGame();
  showInitialScreen();

  return () => {
    gameTimer.stop();
    if (flipResetTimeout) clearTimeout(flipResetTimeout);
  };
}
