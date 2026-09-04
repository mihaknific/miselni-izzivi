// js/games/corsi.js — Corsi Block preizkus prostorskega spomina (ES6 modul)
import { sounds } from '../sounds.js';
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

export function renderCorsi() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Začetna dolžina zaporedja
                <select id="corsi-start-len" class="form-select">
                    <option value="2">2 polji</option>
                    <option value="3" selected>3 polja</option>
                    <option value="4">4 polja</option>
                    <option value="5">5 polj</option>
                    <option value="6">6 polj</option>
                    <option value="7">7 polj</option>
                    <option value="8">8 polj</option>
                    <option value="9">9 polj</option>
                </select>
            </label>
            <label class="form-label">Postavitev blokov
                <select id="corsi-layout" class="form-select">
                    <option value="irregular" selected>Asimetrična plošča (klasični Corsi)</option>
                    <option value="grid">Pravilna mreža (3x3)</option>
                </select>
            </label>
        </div>
        <div class="settings-row">
            <label class="form-label">Smer vnosa
                <select id="corsi-direction" class="form-select">
                    <option value="forward" selected>Naprej (točno zaporedje)</option>
                    <option value="backward">Obratno (vzvratno zaporedje)</option>
                </select>
            </label>
            <label class="form-label">Hitrost prikaza
                <select id="corsi-speed" class="form-select">
                    <option value="1000">Počasi (1000 ms)</option>
                    <option value="750" selected>Normalno (750 ms)</option>
                    <option value="500">Hitro (500 ms)</option>
                </select>
            </label>
        </div>
        ${renderAdaptiveSettingsPanel('corsi')}
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="corsi-start-screen" class="stage-layer">
                ${renderStartCard(
                  'Opazuj zaporedje zasvetitve kvadratov na mreži ter jih nato klikni v točnem (ali obratnem) vrstnem redu.',
                  'corsi-start-btn',
                  '▶ Začni Corsi preizkus',
                  'Prostorski spomin (Corsi)'
                )}
            </div>

            <div id="corsi-play-screen" class="stage-layer hidden">
                <div class="corsi-stage-container">
                    <div id="corsi-status" class="corsi-status-text">Opazuj zaporedje...</div>
                    <div id="corsi-grid" class="corsi-grid">
                        ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<div class="corsi-block disabled" data-index="${i}"></div>`).join('')}
                    </div>
                </div>
            </div>

            <div id="corsi-result-screen" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align: center; max-width: 360px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title result-success" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--color-success);">Pravilno!</h3>
                    <p id="corsi-result-msg" class="muted-xs" style="margin-bottom: var(--spacing-sm);"></p>
                    <button id="corsi-next-btn" class="btn">Naslednja raven ▶</button>
                </div>
            </div>

            <div id="corsi-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align: center; max-width: 360px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title result-error" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--color-error);">Konec preizkusa</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Prišel/a si do ravni <strong id="corsi-final-level">1</strong>.</p>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-sm);">Najdaljše ponovljeno zaporedje: <strong id="corsi-final-span">0</strong> polj.</p>
                    <button id="corsi-retry-btn" class="btn">Poskusi znova</button>
                    <button id="corsi-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 style="margin-bottom: 8px;">O preizkusu Corsi Block</h4>
        <p style="margin-bottom: 12px;">Corsi block-tapping test je uveljavljen nevropsihološki preizkus za merjenje <strong>vizualno-prostorskega delovnega spomina</strong> (Corsi, 1972).</p>
        <h4 style="margin-bottom: 8px;">Pravila igre:</h4>
        <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.6;">
            <li>Opazuj vrstni red, v katerem zasvetijo posamezni kvadrati.</li>
            <li>Ko se prikaz zaključi, klikni na kvadrate v enakem (ali vzvratnem) zaporedju.</li>
            <li>Z vsako uspešno stopnjo se zaporedje podaljša za en kvadrat.</li>
        </ul>
        <p style="color: var(--color-text-muted); font-size: 0.9em;">Preizkus spodbuja prostorsko orientacijo ter kratkotrajno pomnjenje vizualnih vzorcev.</p>
    `;

  return renderGameShell({
    title: 'Prostorski spomin',
    subtitle: 'Corsi test vizualno-prostorskega delovnega spomina.',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initCorsi() {
  let currentSequence = [];
  let userInput = [];
  let currentLevel = 1;
  let sequenceLength = 3;
  let isAcceptingInput = false;
  let flashTimeout = null;

  let config = {
    startLen: 3,
    layout: 'irregular',
    direction: 'forward',
    speed: 750,
  };

  const startScreen = document.getElementById('corsi-start-screen');
  const playScreen = document.getElementById('corsi-play-screen');
  const resultScreen = document.getElementById('corsi-result-screen');
  const endScreen = document.getElementById('corsi-end-screen');

  const statusText = document.getElementById('corsi-status');
  const gridContainer = document.getElementById('corsi-grid');
  const blocks = Array.from(document.querySelectorAll('.corsi-block'));

  const startBtn = document.getElementById('corsi-start-btn');
  const nextBtn = document.getElementById('corsi-next-btn');
  const retryBtn = document.getElementById('corsi-retry-btn');
  const resultMsg = document.getElementById('corsi-result-msg');

  function readSettingsFromUI() {
    const lenEl = document.getElementById('corsi-start-len');
    const layoutEl = document.getElementById('corsi-layout');
    const dirEl = document.getElementById('corsi-direction');
    const speedEl = document.getElementById('corsi-speed');

    // Preveri adaptivno težavnost
    const adaptive = getAdaptiveDifficulty('corsi');
    if (adaptive && !isAdaptiveDisabled('corsi')) {
      config.startLen = adaptive.value;
      if (lenEl) lenEl.value = String(adaptive.value);
    } else {
      if (lenEl) config.startLen = parseInt(lenEl.value, 10) || 3;
    }

    if (layoutEl) config.layout = layoutEl.value || 'irregular';
    if (dirEl) config.direction = dirEl.value || 'forward';
    if (speedEl) config.speed = parseInt(speedEl.value, 10) || 750;

    if (gridContainer) {
      gridContainer.classList.toggle('corsi-irregular-mode', config.layout === 'irregular');
    }
  }

  setGameSettingsApplyHandler(() => {
    readSettingsFromUI();
    resetToStart();
  });

  function showLayer(layer) {
    [startScreen, playScreen, resultScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (layer) layer.classList.remove('hidden');
  }

  function setBlocksClickable(enabled) {
    isAcceptingInput = enabled;
    blocks.forEach(b => {
      if (enabled) b.classList.remove('disabled');
      else b.classList.add('disabled');
    });
  }

  function generateSequence(len) {
    const seq = [];
    for (let i = 0; i < len; i++) {
      let next;
      do {
        next = Math.floor(Math.random() * 9);
      } while (seq.length > 0 && next === seq[seq.length - 1]);
      seq.push(next);
    }
    return seq;
  }

  async function playSequence() {
    setBlocksClickable(false);
    userInput = [];
    if (statusText) {
      statusText.textContent =
        config.direction === 'backward'
          ? 'Opazuj zaporedje (vnesel/a boš OBRATNO)...'
          : 'Opazuj zaporedje...';
    }

    await new Promise(r => setTimeout(r, 600));

    for (let i = 0; i < currentSequence.length; i++) {
      const idx = currentSequence[i];
      const block = blocks[idx];
      if (!block) continue;

      block.classList.add('lit');
      sounds.play('click');

      await new Promise(r => {
        flashTimeout = setTimeout(() => {
          block.classList.remove('lit');
          r();
        }, config.speed * 0.7);
      });

      await new Promise(r => {
        flashTimeout = setTimeout(r, config.speed * 0.3);
      });
    }

    if (statusText) {
      statusText.textContent =
        config.direction === 'backward'
          ? 'Klikni polja v VZVRATNEM vrstnem redu!'
          : 'Ponovi zaporedje polj!';
    }
    setBlocksClickable(true);
  }

  function handleBlockClick(idx) {
    if (!isAcceptingInput) return;

    const block = blocks[idx];
    if (!block) return;

    userInput.push(idx);

    // Svetel vizualni in zvočni odziv
    block.classList.add('lit');
    sounds.play('click');
    setTimeout(() => block.classList.remove('lit'), 200);

    const expectedSequence =
      config.direction === 'backward' ? [...currentSequence].reverse() : currentSequence;

    const stepIdx = userInput.length - 1;

    if (userInput[stepIdx] !== expectedSequence[stepIdx]) {
      // Napaka
      setBlocksClickable(false);
      block.classList.add('user-wrong');
      sounds.play('error');

      setTimeout(() => {
        block.classList.remove('user-wrong');
        handleFailure();
      }, 600);
      return;
    }

    // Čevse pravilno do sedaj
    if (userInput.length === expectedSequence.length) {
      setBlocksClickable(false);
      block.classList.add('user-correct');
      sounds.play('correct');

      setTimeout(() => {
        block.classList.remove('user-correct');
        handleSuccess();
      }, 600);
    }
  }

  function handleSuccess() {
    const achievedSpan = sequenceLength;
    statsManager.addXp(15 + currentLevel * 5);

    // Adaptive difficulty update - success
    updateAdaptiveDifficulty('corsi', { success: true, score: achievedSpan, metric: 'span' });

    currentLevel++;
    sequenceLength++;

    if (resultMsg) {
      resultMsg.textContent = `Odlično! Zapomnil/a si si zaporedje dolžine ${achievedSpan}.`;
    }
    if (nextBtn) {
      nextBtn.textContent = `Naprej na raven ${currentLevel} ▶`;
    }
    showLayer(resultScreen);
  }

  function handleFailure() {
    const finalSpan = sequenceLength - 1;
    statsManager.saveRecord('corsi', {
      level: currentLevel,
      span: finalSpan,
      layout: config.layout,
      direction: config.direction,
      startLen: config.startLen,
      speed: config.speed,
    });

    // Adaptive difficulty update - failure
    updateAdaptiveDifficulty('corsi', { success: false, score: finalSpan, metric: 'span' });

    const finalLevelEl = document.getElementById('corsi-final-level');
    const finalSpanEl = document.getElementById('corsi-final-span');

    if (finalLevelEl) finalLevelEl.textContent = currentLevel;
    if (finalSpanEl) finalSpanEl.textContent = finalSpan;

    showLayer(endScreen);
  }

  function startNewGame() {
    readSettingsFromUI();
    currentLevel = 1;
    sequenceLength = config.startLen;
    showLayer(playScreen);
    currentSequence = generateSequence(sequenceLength);
    playSequence();
  }

  function nextLevel() {
    showLayer(playScreen);
    currentSequence = generateSequence(sequenceLength);
    playSequence();
  }

  function resetToStart() {
    if (flashTimeout) clearTimeout(flashTimeout);
    showLayer(startScreen);
  }

  // Poslušalci dogodkov
  if (startBtn) startBtn.addEventListener('click', startNewGame);
  if (nextBtn) nextBtn.addEventListener('click', nextLevel);
  if (retryBtn) retryBtn.addEventListener('click', startNewGame);
  document.getElementById('corsi-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  // Bind adaptive difficulty events
  bindAdaptiveEvents('corsi');

  blocks.forEach((b, idx) => {
    b.addEventListener('click', () => handleBlockClick(idx));
  });

  const keyHandler = e => {
    if (e.key === 'Enter') {
      if (!startScreen.classList.contains('hidden')) {
        startNewGame();
      } else if (!resultScreen.classList.contains('hidden')) {
        nextLevel();
      } else if (!endScreen.classList.contains('hidden')) {
        startNewGame();
      }
    }
  };

  document.addEventListener('keydown', keyHandler);

  return () => {
    if (flashTimeout) clearTimeout(flashTimeout);
    document.removeEventListener('keydown', keyHandler);
  };
}
