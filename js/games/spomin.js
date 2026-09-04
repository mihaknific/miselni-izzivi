// js/games/spomin.js — Igra Spomin (Memory Match), ES6 modul
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { Settings } from '../store.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import {
  getAdaptiveDifficulty,
  updateAdaptiveDifficulty,
  isAdaptiveDisabled,
  renderAdaptiveSettingsPanel,
  bindAdaptiveEvents,
} from '../adaptive-difficulty.js';
import { shuffle } from '../utils/rng.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';

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
                    <div id="sp-board" class="sp-game-board"></div>
                    <button id="sp-restart" class="btn btn-outline" style="margin-top: var(--spacing-sm); padding: 0.35rem 0.8rem; font-size: 0.85rem;">↺ Ponovno</button>
                    <div id="sp-victory-panel" class="sp-victory-panel hidden" style="margin-top: var(--spacing-sm); text-align: center; width: 100%; z-index: 10;">
                        <h3 class="result-title" style="font-size: 1.15rem; margin-bottom: 4px; color: var(--color-success);">🏆 Čestitke!</h3>
                        <p style="font-size: 0.9rem; margin-bottom: 8px; color: var(--custom-text);">Čas: <strong id="sp-final-time"></strong> | Poteze: <strong id="sp-final-moves"></strong></p>
                        <button id="sp-play-again" class="btn" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Igraj znova</button>
                        <button id="sp-back-to-list" class="btn btn-outline" style="margin-left: 8px; padding: 0.4rem 1rem; font-size: 0.85rem;">← Seznam iger</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <p style="margin-bottom: 12px;">Klasična igra spomina za urjenje delovnega spomina in prostorske orientacije.</p>
        <p style="margin-bottom: 12px;">Poiskati moraš pare enakih ikon tako, da obrneš po dve kartici naenkrat. Cilj je najti vse pare v čim manj potezah in v najkrajšem možnem času.</p>
        <p style="color: var(--color-text-muted); font-size: 0.9em;">Za večji izziv povečaj velikost mreže v nastavitvah igre.</p>
    `;

  return renderGameShell({
    title: 'Spomin',
    subtitle: 'Išči pare enakih ikon',
    statusHtml:
      '<span>Poteze: <strong id="sp-moves">0</strong></span><span>Čas: <strong id="sp-time">00:00</strong></span>',
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
  let timerInterval = null,
    started = false;

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
          const m = String(Math.floor(value / 60)).padStart(2, '0');
          const s = String(value % 60).padStart(2, '0');
          timeEl.textContent = `${m}:${s}`;
        }
        return true;
      },
    }
  );

  async function persistSettings() {
    await Settings.set('game.spomin', {
      difficulty: diffSel.value,
      theme: themeSel.value,
    });
  }

  async function loadSettings() {
    const saved = await Settings.get('game.spomin', null);
    if (!saved) return;
    if (saved.difficulty) diffSel.value = saved.difficulty;
    if (saved.theme) themeSel.value = saved.theme;
  }

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

    clearInterval(timerInterval);
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

    persistSettings();

    // the browser will resize the board and cards automatically via CSS rules
  }

  function startTimer() {
    if (!started) {
      started = true;
      timerInterval = setInterval(() => {
        state.seconds++;
      }, 1000);
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
      setTimeout(() => {
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
    clearInterval(timerInterval);
    document.getElementById('sp-final-time').textContent = timeEl.textContent;
    document.getElementById('sp-final-moves').textContent = state.moves;
    statsManager.saveRecord('spomin', {
      moves: state.moves,
      difficulty: diffSel.value,
      theme: themeSel.value,
    });

    // Gamification XP
    const baseXP = totalPairs * 5;
    statsManager.addXp(baseXP);

    // Adaptive difficulty update - success (game completed)
    // Lower moves = better, so success is always true for completion
    updateAdaptiveDifficulty('spomin', { success: true, score: state.moves, metric: 'moves' });

    sounds.playVictory();

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

  function applySettingsFromPanel() {
    persistSettings();
    setupGame();
    showInitialScreen();
  }

  setGameSettingsApplyHandler(applySettingsFromPanel);

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
  document.getElementById('sp-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  document.getElementById('sp-start')?.addEventListener('click', () => {
    setupGame();
    showPlayScreen();
  });

  loadSettings();
  setupGame();
  showInitialScreen();

  return () => {
    clearInterval(timerInterval);
  };
}
