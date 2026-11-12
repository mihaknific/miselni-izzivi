// js/adaptive-difficulty.js — Centraliziran sistem prilagodljive težavnosti
import { Settings, loadJson, saveJson } from './store.js';

const ADAPTIVE_KEY = 'adaptive_difficulty_v2';

// Privzete nastavitve za vsako igro
const GAME_CONFIGS = {
  zaporedje: {
    param: 'startLength',
    min: 3,
    max: 10,
    default: 4,
    step: 1,
    metric: 'level', // višji = boljše
    targetSuccessRate: 0.75,
  },
  dualnback: {
    param: 'nVal',
    min: 1,
    max: 5,
    default: 2,
    step: 1,
    metric: 'accuracy',
    targetSuccessRate: 0.7,
  },
  corsi: {
    param: 'span',
    min: 3,
    max: 9,
    default: 4,
    step: 1,
    metric: 'span',
    targetSuccessRate: 0.7,
  },
  spomin: {
    param: 'difficulty',
    min: 0, // easy=0, medium=1, hard=2, expert=3
    max: 3,
    default: 1,
    step: 1,
    metric: 'moves', // nižje = boljše
    targetSuccessRate: 0.8,
    difficultyLabels: ['easy', 'medium', 'hard', 'expert'],
  },
  reakcija: {
    param: 'trials',
    min: 5,
    max: 30,
    default: 10,
    step: 5,
    metric: 'ms', // nižje = boljše
    targetSuccessRate: 0.7,
  },
  minolovec: {
    param: 'difficulty',
    min: 0,
    max: 2,
    default: 0,
    step: 1,
    metric: 'level', // višji = boljše (zmaga)
    targetSuccessRate: 0.5,
    difficultyLabels: ['easy', 'medium', 'hard'],
  },
  nonogram: {
    param: 'size',
    min: 0,
    max: 2,
    default: 1,
    step: 1,
    metric: 'level',
    targetSuccessRate: 0.6,
    difficultyLabels: ['5', '10', '15'],
  },
  search: {
    param: 'initialGridSize',
    min: 4,
    max: 8,
    default: 4,
    step: 1,
    metric: 'accuracy',
    targetSuccessRate: 0.75,
  },
  stroop: {
    param: 'colorCount',
    min: 2,
    max: 6,
    default: 4,
    step: 1,
    metric: 'accuracy',
    targetSuccessRate: 0.7,
  },
  switch: {
    param: 'timeoutMs',
    min: 1000,
    max: 5000,
    default: 3000,
    step: 500,
    metric: 'accuracy',
    targetSuccessRate: 0.7,
  },
  trail: {
    param: 'difficulty',
    min: 0,
    max: 2,
    default: 1,
    step: 1,
    metric: 'level',
    targetSuccessRate: 0.7,
    difficultyLabels: ['easy', 'medium', 'hard'],
  },
  sudoku: {
    param: 'difficulty',
    min: 0,
    max: 2,
    default: 0,
    step: 1,
    metric: 'level',
    targetSuccessRate: 0.6,
    difficultyLabels: ['easy', 'medium', 'hard'],
  },
  besedolov: {
    param: 'minLen',
    min: 4,
    max: 6,
    default: 4,
    step: 1,
    metric: 'accuracy',
    targetSuccessRate: 0.7,
  },
  2048: {
    param: 'size',
    min: 4,
    max: 6,
    default: 4,
    step: 1,
    metric: 'level',
    targetSuccessRate: 0.5,
  },
  povezave: {
    param: 'hintsOn',
    min: 0,
    max: 1,
    default: 1,
    step: 1,
    metric: 'level',
    targetSuccessRate: 0.6,
    difficultyLabels: ['brez', 'z namigi'],
  },
  besedle: {
    param: 'mode',
    min: 0,
    max: 1,
    default: 0,
    step: 1,
    metric: 'level',
    targetSuccessRate: 0.5,
    difficultyLabels: ['daily', 'hard'],
  },
  racunanje: {
    param: 'digits',
    min: 0,
    max: 2,
    default: 0,
    step: 1,
    metric: 'accuracy',
    targetSuccessRate: 0.7,
    difficultyLabels: ['single', 'double', 'triple'],
  },
};

function getAdaptiveState() {
  return loadJson(ADAPTIVE_KEY, {});
}

function saveAdaptiveState(state) {
  saveJson(ADAPTIVE_KEY, state);
}

/**
 * Pridobi trenutno težavnost za igro
 * @param {string} gameId - ID igre
 * @returns {Object} { value, label, config }
 */
export function getAdaptiveDifficulty(gameId) {
  const config = GAME_CONFIGS[gameId];
  if (!config) return null;

  const state = getAdaptiveState();
  const gameState = state[gameId] || { value: config.default, history: [] };

  let label = gameState.value;
  if (config.difficultyLabels) {
    label = config.difficultyLabels[gameState.value];
  }

  return { value: gameState.value, label, config };
}

/**
 * Nastavi težavnost ročno (prek settings panela)
 */
export function setAdaptiveDifficulty(gameId, value) {
  const config = GAME_CONFIGS[gameId];
  if (!config) return;

  const clamped = Math.max(config.min, Math.min(config.max, value));
  const state = getAdaptiveState();
  state[gameId] = { ...state[gameId], value: clamped, history: state[gameId]?.history || [] };
  saveAdaptiveState(state);

  // Sinhroniziraj z Settings za uporabo v igrah
  Settings.set(`game.${gameId}.adaptive`, clamped);
}

/**
 * Posodobi prilagoditev po končani igri
 * @param {string} gameId
 * @param {Object} result - { success: boolean, score: number, metric: string }
 */
export function updateAdaptiveDifficulty(gameId, result) {
  const config = GAME_CONFIGS[gameId];
  if (!config) return;

  const state = getAdaptiveState();
  const gameState = state[gameId] || { value: config.default, history: [] };

  // Dodaj v zgodovino (ohrani zadnjih 10)
  gameState.history.push({
    timestamp: Date.now(),
    success: result.success,
    score: result.score,
    difficulty: gameState.value,
  });
  if (gameState.history.length > 10) gameState.history.shift();

  // Izračunaj uspešnost zadnjih 5 iger
  const recent = gameState.history.slice(-5);
  if (recent.length < 3) {
    state[gameId] = gameState;
    saveAdaptiveState(state);
    return { changed: false, reason: 'need_more_data' };
  }

  const successRate = recent.filter(r => r.success).length / recent.length;
  const avgScore = recent.reduce((s, r) => s + r.score, 0) / recent.length;

  let newValue = gameState.value;
  let changed = false;
  let reason = '';

  // Odloči se na podlagi metrike
  if (config.metric === 'accuracy' || config.metric === 'level' || config.metric === 'span') {
    // Višje je boljše
    if (successRate > config.targetSuccessRate + 0.15 && avgScore > 0) {
      newValue = Math.min(config.max, gameState.value + config.step);
      changed = true;
      reason = `success_rate_${Math.round(successRate * 100)}%`;
    } else if (successRate < config.targetSuccessRate - 0.15) {
      newValue = Math.max(config.min, gameState.value - config.step);
      changed = true;
      reason = `success_rate_${Math.round(successRate * 100)}%`;
    }
  } else if (config.metric === 'moves' || config.metric === 'ms') {
    // Nižje je boljše - primerjaj s povprečjem
    const prevScores = recent.slice(0, -1).map(r => r.score);
    const prevAvg = prevScores.length
      ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length
      : avgScore;

    if (avgScore < prevAvg * 0.9) {
      // 10% izboljšava
      newValue = Math.min(config.max, gameState.value + config.step);
      changed = true;
      reason = 'improving';
    } else if (avgScore > prevAvg * 1.2) {
      // 20% upad
      newValue = Math.max(config.min, gameState.value - config.step);
      changed = true;
      reason = 'declining';
    }
  }

  if (changed) {
    gameState.value = newValue;
    // Resetiraj zgodovino po spremembi, da se ne zgodi prehitro nova sprememba
    gameState.history = [];
  }

  state[gameId] = gameState;
  saveAdaptiveState(state);
  Settings.set(`game.${gameId}.adaptive`, newValue);

  return { changed, newValue, reason, successRate: Math.round(successRate * 100) };
}

/**
 * Generira HTML za nastavitveni panel prilagodljive težavnosti
 */
export function renderAdaptiveSettingsPanel(gameId) {
  const adaptive = getAdaptiveDifficulty(gameId);
  if (!adaptive) return '';

  const { value, config } = adaptive;

  let optionsHtml = '';
  if (config.difficultyLabels) {
    optionsHtml = config.difficultyLabels
      .map(
        (l, i) =>
          `<option value="${i}" ${i === value ? 'selected' : ''}>${l.charAt(0).toUpperCase() + l.slice(1)}</option>`
      )
      .join('');
  } else {
    for (let i = config.min; i <= config.max; i += config.step) {
      optionsHtml += `<option value="${i}" ${i === value ? 'selected' : ''}>${i}</option>`;
    }
  }

  return `
    <div class="card adaptive-block">
      <h4>
        <span>🎯</span> Prilagodljiva težavnost (Adaptivna)
      </h4>
      <p class="adaptive-note">
        Igra samonastavlja težavnost na podlagi tvoje uspešnosti.
        Ciljna stopnja uspeha: ${Math.round(config.targetSuccessRate * 100)}%.
      </p>
      <div class="settings-row">
        <label class="form-label">
          Trenutna ravnovesje:
          <select id="adaptive-${gameId}-level" class="form-select">
            ${optionsHtml}
          </select>
        </label>
      </div>
      <div class="adaptive-actions">
        <button id="adaptive-${gameId}-reset" class="btn btn-outline">
          🔄 Ponastavi na privzeto
        </button>
        <button id="adaptive-${gameId}-disable" class="btn btn-outline">
          ⛔ Onemogoči
        </button>
      </div>
    </div>
  `;
}

/**
 * Poveži event listenere za adaptive panel
 */
export function bindAdaptiveEvents(gameId) {
  const select = document.getElementById(`adaptive-${gameId}-level`);
  const resetBtn = document.getElementById(`adaptive-${gameId}-reset`);
  const disableBtn = document.getElementById(`adaptive-${gameId}-disable`);
  const config = GAME_CONFIGS[gameId];

  if (select) {
    select.addEventListener('change', e => {
      setAdaptiveDifficulty(gameId, parseInt(e.target.value, 10));
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      setAdaptiveDifficulty(gameId, config.default);
      select.value = config.default;
    });
  }

  if (disableBtn) {
    disableBtn.addEventListener('click', () => {
      const state = getAdaptiveState();
      state[gameId] = { ...state[gameId], disabled: true };
      saveAdaptiveState(state);
      disableBtn.disabled = true;
      disableBtn.textContent = '✅ Onemogočeno';
    });
  }
}

/**
 * Preveri, ali je adaptivna težavnost onemogočena
 */
export function isAdaptiveDisabled(gameId) {
  const state = getAdaptiveState();
  return state[gameId]?.disabled === true;
}

/**
 * Pridobi nastavitev za uporabo v igri (vrne konfiguracijo za game settings)
 */
export function getGameAdaptiveConfig(gameId) {
  const adaptive = getAdaptiveDifficulty(gameId);
  if (!adaptive || isAdaptiveDisabled(gameId)) return null;
  return adaptive;
}

export { GAME_CONFIGS };
