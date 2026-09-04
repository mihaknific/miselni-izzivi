import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { Settings } from '../store.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { shuffle } from '../utils/rng.js';
import {
  getAdaptiveDifficulty,
  updateAdaptiveDifficulty,
  isAdaptiveDisabled,
  renderAdaptiveSettingsPanel,
  bindAdaptiveEvents,
} from '../adaptive-difficulty.js';

const GO_SHARE = 0.7;
const DEFAULT_SETTINGS = {
  mode: 'classic',
  trials: 30,
  responseWindow: 1200,
  itiMin: 700,
  itiMax: 1700,
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatMs(value) {
  return value == null ? '—' : `${Math.round(value)} ms`;
}

function metricRow(label, value) {
  return `
        <div class="rk-summary-item">
            <span>${label}</span>
            <strong>${value}</strong>
        </div>
    `;
}

function buildTrials(mode, totalTrials) {
  if (mode !== 'gonogo') {
    return Array.from({ length: totalTrials }, () => ({ kind: 'go' }));
  }

  const goCount = Math.max(1, Math.round(totalTrials * GO_SHARE));
  const nogoCount = Math.max(0, totalTrials - goCount);
  const trials = [];

  for (let i = 0; i < goCount; i += 1) trials.push({ kind: 'go' });
  for (let i = 0; i < nogoCount; i += 1) trials.push({ kind: 'nogo' });

  return shuffle(trials);
}

function modeLabel(mode) {
  return mode === 'gonogo' ? 'Go / No-Go' : 'Klasična reakcija';
}

export function renderReakcija(initialMode = 'classic') {
  const isGonogo = initialMode === 'gonogo';
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Način
                <select id="rk-mode" class="form-select">
                    <option value="classic" ${!isGonogo ? 'selected' : ''}>Klasična reakcija</option>
                    <option value="gonogo" ${isGonogo ? 'selected' : ''}>Go / No-Go</option>
                </select>
            </label>
            <label class="form-label">Poskusi
                <select id="rk-trials" class="form-select">
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="30" selected>30</option>
                    <option value="40">40</option>
                    <option value="50">50</option>
                </select>
            </label>
        </div>
        <div class="settings-row">
            <label class="form-label">Odzivno okno (ms)
                <input id="rk-response-window" class="form-input" type="number" min="500" max="5000" value="1200">
            </label>
            <label class="form-label">Min. pavza (ms)
                <input id="rk-iti-min" class="form-input" type="number" min="200" max="5000" value="700">
            </label>
            <label class="form-label">Max. pavza (ms)
                <input id="rk-iti-max" class="form-input" type="number" min="200" max="5000" value="1700">
            </label>
        </div>
        <div id="rk-validate" class="validation-msg hidden"></div>
        ${renderAdaptiveSettingsPanel('reakcija')}
    `;

  const startDesc = isGonogo
    ? 'Pri zelenem signalu klikni čim hitreje (Go), pri rdečem/modrem pa zadrži odziv in ne klikaj (No-Go).'
    : 'Klikni čim se na zaslonu pojavi signal. Vadba najhitrejšega motoričnega odziva.';
  const gameTitle = isGonogo ? 'Go / No-Go' : 'Reakcijski čas';
  const gameSubtitle = isGonogo
    ? 'Urjenje inhibicije in motoričnega nadzora.'
    : 'Preprost vizualni odzivni čas.';

  const stageHtml = `
        <div class="game-stage">
            <div id="rk-start-screen" class="stage-layer">
                ${renderStartCard(startDesc, 'rk-start', '▶ Začni', gameTitle)}
            </div>

            <div id="rk-play-layer" class="stage-layer hidden">
                <div class="rk-play-shell">
                    <div class="rk-topline">
                        <span id="rk-mode-label" class="history-muted">Način: ${gameTitle}</span>
                        <span id="rk-trial-count" class="history-muted">Poskus 0 / 30</span>
                    </div>
                    <button id="rk-stimulus" class="rk-box" type="button" aria-live="polite">
                        <span id="rk-stimulus-title" class="rk-title">Pritisni Začni</span>
                        <span id="rk-stimulus-message" class="rk-message">Čakaj na dražljaj.</span>
                        <span id="rk-stimulus-detail" class="rk-result"></span>
                    </button>
                    <p id="rk-feedback" class="rk-feedback history-muted"></p>
                </div>
            </div>

            <div id="rk-end" class="stage-layer hidden">
                <div class="card rk-summary-card">
                    <h3 class="result-title">Rezultat</h3>
                    <p id="rk-final-mode" class="muted-xs"></p>
                    <div id="rk-final-metrics" class="rk-summary-list"></div>
                    <button id="rk-retry" class="btn">Igraj znova</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <p style="margin-bottom: 12px;">Klasična reakcijska naloga meri preprost vizualni reakcijski čas: klikni čim prej, ko se pojavi dražljaj. Naključni odmiki med poskusi preprečujejo ugibanje ritma.</p>
        <p style="margin-bottom: 12px;">Go/No-Go je naloga zaviranja odziva: pri večini poskusov klikni, pri manjšem deležu poskusov pa klik zadrži. To bolje meri inhibicijski nadzor in napake komisije.</p>
        <p style="color: var(--color-text-muted); font-size: 0.9em;">Bolj kot si hiter in natančen, boljši je rezultat.</p>
    `;

  return renderGameShell({
    title: gameTitle,
    subtitle: gameSubtitle,
    statusHtml:
      '<span>Poskus: <strong id="rk-trial">0</strong> / <strong id="rk-total">30</strong></span><span>Pravilni odzivi: <strong id="rk-score">0</strong></span>',
    settingsHtml,
    infoHtml,
    stageHtml,
  });
}

export function initReakcija(initialMode = 'classic') {
  const modeSel = document.getElementById('rk-mode');
  if (modeSel && initialMode) {
    modeSel.value = initialMode;
  }
  const trialsSel = document.getElementById('rk-trials');
  const responseWindowEl = document.getElementById('rk-response-window');
  const itiMinEl = document.getElementById('rk-iti-min');
  const itiMaxEl = document.getElementById('rk-iti-max');
  const validateEl = document.getElementById('rk-validate');
  const startBtn = document.getElementById('rk-start');
  const retryBtn = document.getElementById('rk-retry');
  const startScreen = document.getElementById('rk-start-screen');
  const playLayer = document.getElementById('rk-play-layer');
  const endLayer = document.getElementById('rk-end');
  const stimulusBtn = document.getElementById('rk-stimulus');
  const stimulusTitleEl = document.getElementById('rk-stimulus-title');
  const stimulusMessageEl = document.getElementById('rk-stimulus-message');
  const stimulusDetailEl = document.getElementById('rk-stimulus-detail');
  const feedbackEl = document.getElementById('rk-feedback');
  const modeLabelEl = document.getElementById('rk-mode-label');
  const trialCountEl = document.getElementById('rk-trial-count');
  const scoreEl = document.getElementById('rk-score');
  const trialEl = document.getElementById('rk-trial');
  const totalEl = document.getElementById('rk-total');
  const finalModeEl = document.getElementById('rk-final-mode');
  const finalMetricsEl = document.getElementById('rk-final-metrics');

  const state = {
    mode: DEFAULT_SETTINGS.mode,
    totalTrials: DEFAULT_SETTINGS.trials,
    responseWindow: DEFAULT_SETTINGS.responseWindow,
    itiMin: DEFAULT_SETTINGS.itiMin,
    itiMax: DEFAULT_SETTINGS.itiMax,
    phase: 'idle',
    currentTrialIndex: 0,
    currentTrial: null,
    trials: [],
    correctCount: 0,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    premature: 0,
    goCount: 0,
    nogoCount: 0,
    goRtSum: 0,
    goRtCount: 0,
  };

  let waitTimer = null;
  let responseTimer = null;
  let feedbackTimer = null;
  let pendingStartTimer = null;
  let currentStimulusStartedAt = 0;
  let persistedSettings = null;

  function clearTimers() {
    if (waitTimer) {
      clearTimeout(waitTimer);
      waitTimer = null;
    }
    if (responseTimer) {
      clearTimeout(responseTimer);
      responseTimer = null;
    }
    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
    if (pendingStartTimer) {
      clearTimeout(pendingStartTimer);
      pendingStartTimer = null;
    }
  }

  function setFeedback(message = '', tone = '') {
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.className = tone ? `rk-feedback ${tone}` : 'rk-feedback history-muted';
  }

  function setStimulusState(kind, title, message, detail, toneClass) {
    if (!stimulusBtn) return;
    stimulusBtn.className = `rk-box ${toneClass}`;
    if (stimulusTitleEl) stimulusTitleEl.textContent = title;
    if (stimulusMessageEl) stimulusMessageEl.textContent = message;
    if (stimulusDetailEl) stimulusDetailEl.textContent = detail;
  }

  function updateHeader() {
    if (modeLabelEl) modeLabelEl.textContent = `Način: ${modeLabel(state.mode)}`;
    if (trialCountEl) {
      const shownTrial = state.currentTrialIndex > 0 ? state.currentTrialIndex : 0;
      trialCountEl.textContent = `Poskus ${shownTrial} / ${state.totalTrials}`;
    }
    if (scoreEl) scoreEl.textContent = String(state.correctCount);
    if (trialEl)
      trialEl.textContent = String(state.currentTrialIndex > 0 ? state.currentTrialIndex : 0);
    if (totalEl) totalEl.textContent = String(state.totalTrials);
  }

  function persistSettings() {
    Settings.set('game.reakcija', {
      mode: state.mode,
      trials: state.totalTrials,
      responseWindow: state.responseWindow,
      itiMin: state.itiMin,
      itiMax: state.itiMax,
    });
  }

  async function loadSettings() {
    const saved = await Settings.get('game.reakcija', null);
    if (!saved) return;

    if (modeSel && saved.mode) modeSel.value = saved.mode;
    if (trialsSel && saved.trials) trialsSel.value = String(saved.trials);
    if (responseWindowEl && typeof saved.responseWindow !== 'undefined')
      responseWindowEl.value = String(saved.responseWindow);
    if (itiMinEl && typeof saved.itiMin !== 'undefined') itiMinEl.value = String(saved.itiMin);
    if (itiMaxEl && typeof saved.itiMax !== 'undefined') itiMaxEl.value = String(saved.itiMax);
  }

  function validateSettings() {
    const trials = clampInt(trialsSel?.value, 5, 200, DEFAULT_SETTINGS.trials);
    const responseWindow = clampInt(
      responseWindowEl?.value,
      500,
      5000,
      DEFAULT_SETTINGS.responseWindow
    );
    const itiMin = clampInt(itiMinEl?.value, 200, 5000, DEFAULT_SETTINGS.itiMin);
    const itiMax = clampInt(itiMaxEl?.value, 200, 5000, DEFAULT_SETTINGS.itiMax);
    const mode = modeSel?.value || DEFAULT_SETTINGS.mode;

    let error = '';
    if (!['classic', 'gonogo'].includes(mode)) {
      error = 'Izberi veljaven način igre.';
    } else if (trials < 5 || trials > 200) {
      error = 'Število poskusov mora biti med 5 in 200.';
    } else if (responseWindow < 500 || responseWindow > 5000) {
      error = 'Odzivno okno mora biti med 500 in 5000 ms.';
    } else if (itiMin < 200 || itiMax < 200 || itiMin > itiMax) {
      error = 'Pavza mora biti smiselna: min ne sme biti večji od max.';
    }

    if (validateEl) {
      validateEl.textContent = error;
      validateEl.classList.toggle('hidden', !error);
    }
    if (startBtn) startBtn.toggleAttribute('disabled', !!error);
    return !error;
  }

  function showStartScreen() {
    startScreen?.classList.remove('hidden');
    playLayer?.classList.add('hidden');
    endLayer?.classList.add('hidden');
  }

  function showPlayScreen() {
    startScreen?.classList.add('hidden');
    playLayer?.classList.remove('hidden');
    endLayer?.classList.add('hidden');
  }

  function showEndScreen() {
    startScreen?.classList.add('hidden');
    playLayer?.classList.add('hidden');
    endLayer?.classList.remove('hidden');
  }

  function applySettingsFromPanel() {
    // Preveri adaptivno težavnost
    const adaptive = getAdaptiveDifficulty('reakcija');
    if (adaptive && !isAdaptiveDisabled('reakcija')) {
      state.totalTrials = adaptive.value;
      if (trialsSel) trialsSel.value = String(adaptive.value);
    } else {
      state.totalTrials = clampInt(trialsSel?.value, 5, 200, DEFAULT_SETTINGS.trials);
    }

    state.mode = modeSel?.value || DEFAULT_SETTINGS.mode;
    state.responseWindow = clampInt(
      responseWindowEl?.value,
      500,
      5000,
      DEFAULT_SETTINGS.responseWindow
    );
    state.itiMin = clampInt(itiMinEl?.value, 200, 5000, DEFAULT_SETTINGS.itiMin);
    state.itiMax = clampInt(itiMaxEl?.value, 200, 5000, DEFAULT_SETTINGS.itiMax);
    state.trials = buildTrials(state.mode, state.totalTrials);
    state.goCount = state.trials.filter(trial => trial.kind === 'go').length;
    state.nogoCount = state.trials.filter(trial => trial.kind === 'nogo').length;
    persistSettings();
    updateHeader();
  }

  function resetBlock() {
    clearTimers();
    state.phase = 'idle';
    state.currentTrialIndex = 0;
    state.currentTrial = null;
    state.correctCount = 0;
    state.hits = 0;
    state.misses = 0;
    state.falseAlarms = 0;
    state.correctRejections = 0;
    state.premature = 0;
    state.goRtSum = 0;
    state.goRtCount = 0;
    currentStimulusStartedAt = 0;
    setFeedback('');
    if (stimulusBtn) {
      stimulusBtn.className = 'rk-box rk-box-idle';
    }
    if (stimulusTitleEl) stimulusTitleEl.textContent = 'Pritisni Začni';
    if (stimulusMessageEl) stimulusMessageEl.textContent = 'Čakaj na dražljaj.';
    if (stimulusDetailEl) stimulusDetailEl.textContent = '';
    updateHeader();
  }

  function buildSummary() {
    const totalCorrect = state.correctCount;
    const accuracy =
      state.totalTrials > 0 ? Math.round((totalCorrect / state.totalTrials) * 100) : 0;
    const averageRt = state.goRtCount > 0 ? Math.round(state.goRtSum / state.goRtCount) : null;
    const goAccuracy = state.goCount > 0 ? Math.round((state.hits / state.goCount) * 100) : 0;
    const nogoAccuracy =
      state.nogoCount > 0 ? Math.round((state.correctRejections / state.nogoCount) * 100) : 0;
    const summary = {
      accuracy,
      averageRt,
      goAccuracy,
      nogoAccuracy,
    };
    return summary;
  }

  function saveResult() {
    const accuracy =
      state.totalTrials > 0 ? Math.round((state.correctCount / state.totalTrials) * 100) : 0;
    const averageRt =
      state.goRtCount > 0 ? Math.round(state.goRtSum / state.goRtCount) : state.responseWindow;
    statsManager.saveRecord('reakcija', {
      type: state.mode,
      score: state.correctCount,
      ms: averageRt,
      accuracy,
      hits: state.hits,
      misses: state.misses,
      falseAlarms: state.falseAlarms,
      correctRejections: state.correctRejections,
      premature: state.premature,
      trials: state.totalTrials,
      responseWindow: state.responseWindow,
      itiMin: state.itiMin,
      itiMax: state.itiMax,
      goCount: state.goCount,
      nogoCount: state.nogoCount,
      goRtCount: state.goRtCount,
    });
  }

  function renderSummary() {
    const accuracy =
      state.totalTrials > 0 ? Math.round((state.correctCount / state.totalTrials) * 100) : 0;
    const meanRt = state.goRtCount > 0 ? Math.round(state.goRtSum / state.goRtCount) : null;
    const goAccuracy = state.goCount > 0 ? Math.round((state.hits / state.goCount) * 100) : 0;
    const nogoAccuracy =
      state.nogoCount > 0 ? Math.round((state.correctRejections / state.nogoCount) * 100) : 0;

    if (finalModeEl) finalModeEl.textContent = modeLabel(state.mode);

    const rows =
      state.mode === 'gonogo'
        ? [
            metricRow('Go zadetki', `${state.hits} / ${state.goCount}`),
            metricRow('Go točnost', `${goAccuracy}%`),
            metricRow('No-Go pravilni zadržki', `${state.correctRejections} / ${state.nogoCount}`),
            metricRow('No-Go točnost', `${nogoAccuracy}%`),
            metricRow('Komisijske napake', String(state.falseAlarms)),
            metricRow('Predčasni kliki', String(state.premature)),
            metricRow('Povprečni RT pri Go', formatMs(meanRt)),
            metricRow('Skupna natančnost', `${accuracy}%`),
          ]
        : [
            metricRow('Pravilni odzivi', `${state.hits} / ${state.totalTrials}`),
            metricRow('Napačni odzivi', String(state.misses)),
            metricRow('Predčasni kliki', String(state.premature)),
            metricRow('Povprečni reakcijski čas', formatMs(meanRt)),
            metricRow('Natančnost', `${accuracy}%`),
          ];

    if (finalMetricsEl) {
      finalMetricsEl.innerHTML = rows.join('');
    }
  }

  function finishBlock() {
    clearTimers();
    state.phase = 'summary';
    renderSummary();
    saveResult();

    // Adaptive difficulty update - use accuracy as success metric
    const accuracy =
      state.totalTrials > 0 ? Math.round((state.correctCount / state.totalTrials) * 100) : 0;
    updateAdaptiveDifficulty('reakcija', {
      success: accuracy >= 70,
      score: accuracy,
      metric: 'accuracy',
    });

    showEndScreen();
    sounds.playVictory();
  }

  function advanceToNextTrial() {
    clearTimers();

    if (state.currentTrialIndex >= state.trials.length) {
      finishBlock();
      return;
    }

    state.currentTrialIndex += 1;
    state.currentTrial = state.trials[state.currentTrialIndex - 1];
    state.phase = 'waiting';
    updateHeader();

    const waitMs = randomInt(state.itiMin, state.itiMax);
    const isGo = state.currentTrial.kind === 'go';
    const waitingTitle =
      state.mode === 'gonogo' ? (isGo ? 'Čakaj na GO' : 'Čakaj na NO-GO') : 'Čakaj na dražljaj';
    const waitingMessage =
      state.mode === 'gonogo'
        ? isGo
          ? 'Pri zelenem signalu klikni čim prej.'
          : 'Pri rdečem signalu zadrži klik.'
        : 'Ne klikaj prehitro.';

    setStimulusState(
      state.currentTrial.kind,
      waitingTitle,
      waitingMessage,
      'Pripravi se...',
      'rk-box-wait'
    );
    setFeedback('');

    waitTimer = window.setTimeout(() => {
      presentStimulus();
    }, waitMs);
  }

  function presentStimulus() {
    if (!state.currentTrial) return;
    clearTimers();
    state.phase = 'stimulus';
    currentStimulusStartedAt = performance.now();
    updateHeader();

    const isGo = state.currentTrial.kind === 'go';
    const title = state.mode === 'gonogo' ? (isGo ? 'GO' : 'NO-GO') : 'KLIKNI ZDAJ';
    const message =
      state.mode === 'gonogo' ? (isGo ? 'Klikni zdaj.' : 'Ne klikaj.') : 'Klikni čim hitreje.';
    const detail =
      state.mode === 'gonogo'
        ? `${state.responseWindow} ms odzivno okno`
        : `${state.responseWindow} ms odzivno okno`;

    setStimulusState(
      state.currentTrial.kind,
      title,
      message,
      detail,
      isGo ? 'rk-box-go' : 'rk-box-nogo'
    );
    setFeedback('');

    responseTimer = window.setTimeout(() => {
      handleNoResponse();
    }, state.responseWindow);
  }

  function showResponseFeedback(message, tone) {
    setFeedback(message, tone);
    feedbackTimer = window.setTimeout(() => {
      setFeedback('');
    }, 550);
  }

  function handleCorrectResponse(rt) {
    state.correctCount += 1;
    state.hits += 1;
    state.goRtSum += rt;
    state.goRtCount += 1;
    statsManager.addXp(2);
    updateHeader();
    showResponseFeedback(`Pravilno: ${rt} ms`, 'result-success');
    if (stimulusBtn) stimulusBtn.classList.add('rk-box-correct');
    sounds.playSuccess();
    pendingStartTimer = window.setTimeout(() => {
      advanceToNextTrial();
    }, 550);
  }

  function handleNoGoCorrect() {
    state.correctCount += 1;
    state.correctRejections += 1;
    statsManager.addXp(2);
    updateHeader();
    showResponseFeedback('Pravilno zadržan odziv.', 'result-success');
    if (stimulusBtn) stimulusBtn.classList.add('rk-box-correct');
    sounds.playSuccess();
    pendingStartTimer = window.setTimeout(() => {
      advanceToNextTrial();
    }, 550);
  }

  function handleError(message, className) {
    showResponseFeedback(message, 'result-error');
    if (stimulusBtn) stimulusBtn.classList.add(className);
    sounds.playError();
    pendingStartTimer = window.setTimeout(() => {
      advanceToNextTrial();
    }, 650);
  }

  function handleNoResponse() {
    if (state.phase !== 'stimulus') return;
    clearTimers();
    state.phase = 'feedback';

    if (state.mode === 'gonogo' && state.currentTrial?.kind === 'nogo') {
      handleNoGoCorrect();
      return;
    }

    state.misses += 1;
    const message =
      state.mode === 'gonogo' ? 'Preveč počasi. To je bil GO poskus.' : 'Čas je potekel.';
    handleError(message, 'rk-box-error');
  }

  function handlePrematureClick() {
    state.premature += 1;
    state.misses += 1;
    updateHeader();
    handleError('Prehiter klik. Poskus se nadaljuje.', 'rk-box-error');
  }

  function handleStimulusClick() {
    if (state.phase === 'waiting') {
      clearTimers();
      handlePrematureClick();
      return;
    }

    if (state.phase !== 'stimulus' || !state.currentTrial) return;

    clearTimers();
    state.phase = 'feedback';

    const rt = Math.max(0, Math.round(performance.now() - currentStimulusStartedAt));
    const isGo = state.currentTrial.kind === 'go';

    if (state.mode === 'gonogo') {
      if (isGo) {
        handleCorrectResponse(rt);
      } else {
        state.falseAlarms += 1;
        handleError('Komisijska napaka: na NO-GO si kliknil.', 'rk-box-error');
      }
      return;
    }

    handleCorrectResponse(rt);
  }

  function resetGameToStart() {
    clearTimers();
    resetBlock();
    showStartScreen();
  }

  function startGame() {
    if (!validateSettings()) return;
    applySettingsFromPanel();
    resetBlock();
    showPlayScreen();
    advanceToNextTrial();
  }

  modeSel?.addEventListener('change', validateSettings);
  trialsSel?.addEventListener('change', validateSettings);
  responseWindowEl?.addEventListener('input', validateSettings);
  itiMinEl?.addEventListener('input', validateSettings);
  itiMaxEl?.addEventListener('input', validateSettings);
  stimulusBtn?.addEventListener('click', handleStimulusClick);
  startBtn?.addEventListener('click', startGame);
  retryBtn?.addEventListener('click', startGame);

  // Bind adaptive difficulty events
  bindAdaptiveEvents('reakcija');

  if (window._rkKeyHandler) {
    document.removeEventListener('keydown', window._rkKeyHandler);
  }
  window._rkKeyHandler = e => {
    if (e.code === 'Space' && (state.phase === 'waiting' || state.phase === 'stimulus')) {
      e.preventDefault();
      handleStimulusClick();
    }
  };
  document.addEventListener('keydown', window._rkKeyHandler);

  setGameSettingsApplyHandler(() => {
    if (!validateSettings()) return false;
    applySettingsFromPanel();
    resetGameToStart();
    return true;
  });

  loadSettings();
  applySettingsFromPanel();
  resetGameToStart();
  validateSettings();

  return function cleanup() {
    clearTimers();
    resetBlock();
    if (window._rkKeyHandler) {
      document.removeEventListener('keydown', window._rkKeyHandler);
      window._rkKeyHandler = null;
    }
  };
}
