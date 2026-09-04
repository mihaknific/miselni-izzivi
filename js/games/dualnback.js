// js/games/dualnback.js — Dual N-Back preizkus delovnega spomina (ES6 modul)
import { statsManager } from '../stats.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import {
  getAdaptiveDifficulty,
  updateAdaptiveDifficulty,
  isAdaptiveDisabled,
  renderAdaptiveSettingsPanel,
  bindAdaptiveEvents,
} from '../adaptive-difficulty.js';

export function renderDualNBack() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Vrednost N (korakov nazaj)
                <select id="nback-n-val" class="form-select">
                    <option value="1">1-Back (enostavno)</option>
                    <option value="2" selected>2-Back (priporočeno)</option>
                    <option value="3">3-Back (zahtevno)</option>
                    <option value="4">4-Back (ekstremno)</option>
                    <option value="5">5-Back (elite)</option>
                </select>
            </label>
            <label class="form-label">Število ponovitev
                <select id="nback-trials" class="form-select">
                    <option value="15">15 korakov</option>
                    <option value="20" selected>20 korakov</option>
                    <option value="30">30 korakov</option>
                </select>
            </label>
        </div>
        <div class="settings-row">
            <label class="form-label">Časovni interval (ms)
                <select id="nback-speed" class="form-select">
                    <option value="3000">3000 ms (počasi)</option>
                    <option value="2500" selected>2500 ms (normalno)</option>
                    <option value="2000">2000 ms (hitro)</option>
                </select>
            </label>
        </div>
        ${renderAdaptiveSettingsPanel('dualnback')}
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="nback-start-screen" class="stage-layer">
                ${renderStartCard(
                  'Spremljaj položaj svetlega polja. Pritisni Ujemanje, če je položaj enak tistemu izpred N korakov.',
                  'nback-start-btn',
                  '▶ Začni Dual N-Back',
                  'Dual N-Back'
                )}
            </div>

            <div id="nback-play-screen" class="stage-layer hidden">
                <div class="nback-stage-container">
                    <div id="nback-grid" class="nback-grid">
                        ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<div class="nback-cell" data-index="${i}"></div>`).join('')}
                    </div>
                    <div class="nback-actions">
                        <button id="nback-match-btn" class="btn btn-outline nback-btn">Ujemanje (Space)</button>
                    </div>
                </div>
            </div>

            <div id="nback-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align: center; max-width: 360px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title result-success" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--color-success);">Preizkus zaključen! 🧠</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Skupna točnost: <strong id="nback-accuracy">0%</strong></p>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-sm);">Pravilna ujemanja: <strong id="nback-hits">0/0</strong></p>
                    <button id="nback-retry-btn" class="btn">Poskusi znova</button>
                    <button id="nback-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 style="margin-bottom: 8px;">O preizkusu Dual N-Back</h4>
        <p style="margin-bottom: 12px;">Dual N-Back je znanstveno potrjena kognitivna vaja za <strong>širitev delovnega spomina in tekoče inteligence (fluid intelligence)</strong> (Jaeggi et al., 2008).</p>
        <h4 style="margin-bottom: 8px;">Pravila igre:</h4>
        <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.6;">
            <li>Spremljaj samo <strong>položaj svetlečega polja</strong>.</li>
            <li>Pritisni <strong>Ujemanje</strong> ali tipko <code>Space</code>, če se trenutni položaj ujema s položajem izpred N korakov.</li>
        </ul>
    `;

  return renderGameShell({
    title: 'Dual N-Back',
    subtitle: 'Znanstveni preizkus delovnega spomina.',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initDualNBack() {
  let nVal = 2;
  let totalTrials = 20;
  let speedMs = 2500;

  let historyPos = [];
  let currentStep = 0;

  let userMatchPressed = false;

  let hits = 0;
  let totalMatches = 0;
  let falseAlarms = 0;

  let stepTimer = null;

  const startScreen = document.getElementById('nback-start-screen');
  const playScreen = document.getElementById('nback-play-screen');
  const endScreen = document.getElementById('nback-end-screen');

  const cells = Array.from(document.querySelectorAll('.nback-cell'));

  const matchBtn = document.getElementById('nback-match-btn');

  const startBtn = document.getElementById('nback-start-btn');
  const retryBtn = document.getElementById('nback-retry-btn');

  function readSettingsFromUI() {
    // Preveri adaptivno težavnost
    const adaptive = getAdaptiveDifficulty('dualnback');
    if (adaptive && !isAdaptiveDisabled('dualnback')) {
      nVal = adaptive.value;
      const nEl = document.getElementById('nback-n-val');
      if (nEl) nEl.value = String(adaptive.value);
    } else {
      const nEl = document.getElementById('nback-n-val');
      if (nEl) nVal = parseInt(nEl.value, 10) || 2;
    }

    const trialsEl = document.getElementById('nback-trials');
    const speedEl = document.getElementById('nback-speed');
    if (trialsEl) totalTrials = parseInt(trialsEl.value, 10) || 20;
    if (speedEl) speedMs = parseInt(speedEl.value, 10) || 2500;
  }

  setGameSettingsApplyHandler(() => {
    readSettingsFromUI();
    showLayer(startScreen);
  });

  function showLayer(layer) {
    [startScreen, playScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (layer) layer.classList.remove('hidden');
  }

  function evaluatePreviousStep() {
    if (currentStep <= nVal) return;

    const targetIdx = currentStep - 1; // Indeks zadnjega zaključenega koraka (1-based offset)
    const matchPos = historyPos[targetIdx] === historyPos[targetIdx - nVal];
    if (matchPos) totalMatches++;
    if (userMatchPressed && matchPos) hits++;
    if (userMatchPressed && !matchPos) falseAlarms++;
    userMatchPressed = false;
    matchBtn.classList.add('btn-outline');
    matchBtn.style.background = '';
    matchBtn.style.color = '';
  }

  function nextStep() {
    if (stepTimer) clearTimeout(stepTimer);

    evaluatePreviousStep();

    if (currentStep >= totalTrials + nVal) {
      finishGame();
      return;
    }

    currentStep++;

    // Izbiranje položaja in črke z 35% verjetnostjo ujemanja
    let nextPos = Math.floor(Math.random() * 9);

    if (currentStep > nVal && Math.random() < 0.35) {
      nextPos = historyPos[currentStep - 1 - nVal];
    }

    historyPos.push(nextPos);

    // Prikaz polja in zvočna/govorna modulacija
    cells.forEach(c => c.classList.remove('active'));
    if (cells[nextPos]) cells[nextPos].classList.add('active');

    setTimeout(() => {
      cells.forEach(c => c.classList.remove('active'));
    }, speedMs * 0.65);

    stepTimer = setTimeout(nextStep, speedMs);
  }

  function handleMatchPress() {
    if (userMatchPressed) return;
    userMatchPressed = true;
    matchBtn.classList.remove('btn-outline');
    matchBtn.style.background = 'var(--color-primary)';
    matchBtn.style.color = 'var(--custom-primary-text, #fff)';
  }

  function finishGame() {
    evaluatePreviousStep();

    const totalPossibleMatches = Math.max(1, totalMatches);
    const accuracyPct = Math.round((hits / totalPossibleMatches) * 100);

    statsManager.addXp(accuracyPct);
    statsManager.saveRecord('dualnback', {
      nVal: nVal,
      accuracy: accuracyPct,
      hits: `${hits}/${totalPossibleMatches}`,
      falseAlarms,
      speed: speedMs,
    });

    // Adaptive difficulty update
    updateAdaptiveDifficulty('dualnback', {
      success: accuracyPct >= 70,
      score: accuracyPct,
      metric: 'accuracy',
    });

    const accEl = document.getElementById('nback-accuracy');
    const hitsEl = document.getElementById('nback-hits');

    if (accEl) accEl.textContent = `${accuracyPct}%`;
    if (hitsEl) hitsEl.textContent = `${hits}/${totalPossibleMatches}`;

    showLayer(endScreen);
  }

  function startNewGame() {
    readSettingsFromUI();
    currentStep = 0;
    historyPos = [];
    userMatchPressed = false;
    hits = 0;
    totalMatches = 0;
    falseAlarms = 0;

    showLayer(playScreen);
    nextStep();
  }

  if (startBtn) startBtn.addEventListener('click', startNewGame);
  if (retryBtn) retryBtn.addEventListener('click', startNewGame);
  document.getElementById('nback-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  // Bind adaptive difficulty events
  bindAdaptiveEvents('dualnback');

  if (matchBtn) matchBtn.addEventListener('click', handleMatchPress);

  const keyHandler = e => {
    if (e.key === 'Enter') {
      if (!startScreen.classList.contains('hidden')) {
        startNewGame();
      } else if (!endScreen.classList.contains('hidden')) {
        startNewGame();
      }
    } else if (!playScreen.classList.contains('hidden')) {
      if (e.code === 'Space') {
        e.preventDefault();
        handleMatchPress();
      }
    }
  };

  document.addEventListener('keydown', keyHandler);

  return () => {
    if (stepTimer) clearTimeout(stepTimer);
    document.removeEventListener('keydown', keyHandler);
  };
}
