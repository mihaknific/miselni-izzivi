// js/games/switch.js — Task Switching / Preklop pozornosti (ES6 modul)
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';

export function renderSwitch() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Število poskusov
                <select id="switch-trials" class="form-select">
                    <option value="10">10 poskusov</option>
                    <option value="20" selected>20 poskusov</option>
                    <option value="30">30 poskusov</option>
                </select>
            </label>
            <label class="form-label">Časovni pritisk
                <select id="switch-timeout" class="form-select">
                    <option value="0">Brez omejitve</option>
                    <option value="3000" selected>3 sekunde</option>
                    <option value="2000">2 sekundi</option>
                </select>
            </label>
        </div>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="switch-start-screen" class="stage-layer">
                ${renderStartCard(
                  'Hitro prilagajaj odločitev glede na pravilo. Uporabi miško ali puščici levo/desno na tipkovnici.',
                  'switch-start-btn',
                  '▶ Začni preizkus',
                  'Preklop pozornosti (Task Switching)'
                )}
            </div>

            <div id="switch-play-screen" class="stage-layer hidden">
                <div class="switch-stage-container">
                    <div id="switch-rule-card" class="switch-rule-card rule-evenodd">Pravilo: Sodo / Liho</div>
                    <div id="switch-stimulus" class="switch-stimulus-box">7</div>
                    <div class="switch-actions">
                        <button id="switch-left-btn" class="btn btn-outline switch-btn">← Sodo</button>
                        <button id="switch-right-btn" class="btn btn-outline switch-btn">Liho →</button>
                    </div>
                    <p class="muted-xs" style="text-align:center;">Izberi z gumbom ali s puščico levo/desno.</p>
                </div>
            </div>

            <div id="switch-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align: center; max-width: 360px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title result-success" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--color-success);">Preizkus zaključen! 🎯</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Točnost: <strong id="switch-accuracy">0%</strong></p>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-sm);">Povprečni odzivni čas: <strong id="switch-avg-time">0</strong> ms</p>
                    <button id="switch-retry-btn" class="btn">Poskusi znova</button>
                    <button id="switch-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 style="margin-bottom: 8px;">O preizkusu preklapljanja pozornosti (Task Switching)</h4>
        <p style="margin-bottom: 12px;">Preizkus meri <strong>kognitivno prožnost (executive flexibility)</strong> — sposobnost možganov, da neprekinjeno in brez napak preklapljajo med različnimi mentalnimi pravili (Rogers & Monsell, 1995).</p>
        <h4 style="margin-bottom: 8px;">Pravila igre:</h4>
        <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.6;">
            <li>Spremljaj napis na zgornji znački pravila:
                <br>• <strong>MODRA značka (Sodo / Liho)</strong>: Odgovori ali je prikazana številka soda ali liha.
                <br>• <strong>ORANŽNA značka (Manjše / Večje od 5)</strong>: Odgovori ali je številka manša (< 5) ali večja (> 5) od številke 5.
            </li>
            <li>Pravilo se izmenjuje naključno. Bodi pozoren/na na spremembo pravila!</li>
        </ul>
    `;

  return renderGameShell({
    title: 'Preklop pozornosti',
    subtitle: 'Preizkus kognitivne prožnosti in preklapljanja pravil.',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initSwitch() {
  let totalTrials = 20;
  let timeoutMs = 3000;
  let currentTrial = 0;
  let currentRule = 'evenodd'; // 'evenodd' ali 'magnitude'
  let currentNumber = 1;
  let trialStartTime = 0;
  let responseTimes = [];
  let correctCount = 0;
  let trialTimer = null;
  let awaitingAnswer = false;

  const startScreen = document.getElementById('switch-start-screen');
  const playScreen = document.getElementById('switch-play-screen');
  const endScreen = document.getElementById('switch-end-screen');

  const ruleCard = document.getElementById('switch-rule-card');
  const stimulusEl = document.getElementById('switch-stimulus');
  const leftBtn = document.getElementById('switch-left-btn');
  const rightBtn = document.getElementById('switch-right-btn');

  const startBtn = document.getElementById('switch-start-btn');
  const retryBtn = document.getElementById('switch-retry-btn');

  function readSettingsFromUI() {
    const trialsEl = document.getElementById('switch-trials');
    const timeoutEl = document.getElementById('switch-timeout');

    if (trialsEl) totalTrials = parseInt(trialsEl.value, 10) || 20;
    if (timeoutEl) {
      const parsed = parseInt(timeoutEl.value, 10);
      timeoutMs = isNaN(parsed) ? 3000 : parsed;
    }
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

  let previousRule = null;
  let switchTimes = [];
  let repeatTimes = [];

  function nextTrial() {
    if (trialTimer) clearTimeout(trialTimer);

    if (currentTrial >= totalTrials) {
      finishGame();
      return;
    }

    currentTrial++;

    // Pravilo se z verjetnostjo 50% zamenja ali ostane enako
    previousRule = currentRule;
    currentRule = Math.random() < 0.5 ? 'evenodd' : 'magnitude';

    // Generiraj število od 1 do 9 (razen 5 pri pravilu magnitude, da ni dvoma)
    let nums = [1, 2, 3, 4, 6, 7, 8, 9];
    currentNumber = nums[Math.floor(Math.random() * nums.length)];

    if (currentRule === 'evenodd') {
      ruleCard.className = 'switch-rule-card rule-evenodd';
      ruleCard.textContent = 'Pravilo: Sodo / Liho';
      leftBtn.textContent = 'Sodo';
      rightBtn.textContent = 'Liho';
    } else {
      ruleCard.className = 'switch-rule-card rule-magnitude';
      ruleCard.textContent = 'Pravilo: Manjše / Večje od 5';
      leftBtn.textContent = 'Manjše (< 5)';
      rightBtn.textContent = 'Večje (> 5)';
    }

    stimulusEl.textContent = currentNumber;
    trialStartTime = performance.now();
    awaitingAnswer = true;

    if (timeoutMs > 0) {
      trialTimer = setTimeout(() => {
        handleAnswer(null); // Čas potekel
      }, timeoutMs);
    }
  }

  function handleAnswer(answerChoice) {
    if (!awaitingAnswer) return;
    awaitingAnswer = false;
    if (trialTimer) clearTimeout(trialTimer);

    const timeTaken = Math.round(performance.now() - trialStartTime);
    let isCorrect = false;

    if (currentRule === 'evenodd') {
      const isEven = currentNumber % 2 === 0;
      if (answerChoice === 'left' && isEven) isCorrect = true;
      if (answerChoice === 'right' && !isEven) isCorrect = true;
    } else {
      // magnitude
      const isLess = currentNumber < 5;
      if (answerChoice === 'left' && isLess) isCorrect = true;
      if (answerChoice === 'right' && !isLess) isCorrect = true;
    }

    if (isCorrect) {
      correctCount++;
      responseTimes.push(timeTaken);
      if (previousRule !== null) {
        if (previousRule !== currentRule) {
          switchTimes.push(timeTaken);
        } else {
          repeatTimes.push(timeTaken);
        }
      }
      sounds.play('correct');
    } else {
      sounds.play('error');
    }

    setTimeout(nextTrial, 250);
  }

  function finishGame() {
    const accuracyPct = Math.round((correctCount / totalTrials) * 100);
    const avgMs =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    const avgSwitch =
      switchTimes.length > 0
        ? Math.round(switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length)
        : avgMs;
    const avgRepeat =
      repeatTimes.length > 0
        ? Math.round(repeatTimes.reduce((a, b) => a + b, 0) / repeatTimes.length)
        : avgMs;
    const switchCost = Math.max(0, avgSwitch - avgRepeat);

    statsManager.addXp(correctCount * 5);
    statsManager.saveRecord('switch', {
      accuracy: accuracyPct,
      avgMs: avgMs,
      switchCostMs: switchCost,
      trials: totalTrials,
      timeout: timeoutMs,
    });

    const accEl = document.getElementById('switch-accuracy');
    const avgEl = document.getElementById('switch-avg-time');

    if (accEl) accEl.textContent = `${accuracyPct}% (Cena preklopa: +${switchCost} ms)`;
    if (avgEl) avgEl.textContent = `${avgMs} ms`;

    showLayer(endScreen);
  }

  function startNewGame() {
    readSettingsFromUI();
    currentTrial = 0;
    correctCount = 0;
    responseTimes = [];
    switchTimes = [];
    repeatTimes = [];
    previousRule = null;
    showLayer(playScreen);
    nextTrial();
  }

  if (startBtn) startBtn.addEventListener('click', startNewGame);
  if (retryBtn) retryBtn.addEventListener('click', startNewGame);
  document.getElementById('switch-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  if (leftBtn) leftBtn.addEventListener('click', () => handleAnswer('left'));
  if (rightBtn) rightBtn.addEventListener('click', () => handleAnswer('right'));

  const keyHandler = e => {
    if (e.key === 'Enter') {
      if (!startScreen.classList.contains('hidden')) {
        startNewGame();
      } else if (!endScreen.classList.contains('hidden')) {
        startNewGame();
      }
    } else if (!playScreen.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') handleAnswer('left');
      if (e.key === 'ArrowRight') handleAnswer('right');
    }
  };

  document.addEventListener('keydown', keyHandler);

  return () => {
    if (trialTimer) clearTimeout(trialTimer);
    document.removeEventListener('keydown', keyHandler);
  };
}
