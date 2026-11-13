// js/games/zaporedje.js — Zaporedje števil, ES6 modul
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell, finishGameEpilogue } from './game-layout.js';
import { bindGameKeys } from './game-keys.js';
import { bindGameSettings } from './game-settings-panel.js';
import {
  getAdaptiveDifficulty,
  updateAdaptiveDifficulty,
  isAdaptiveDisabled,
  renderAdaptiveSettingsPanel,
  bindAdaptiveEvents,
} from '../adaptive-difficulty.js';

export function renderZaporedje() {
  const settingsHtml = `
                <div class="settings-row">
                    <label class="form-label">Začetna dolžina
                        <select id="zp-start-length" class="form-select">
                                <option value="3" selected>3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                        </select>
                    </label>
                    <label class="form-label">Hitrost (ms)
                        <select id="zp-speed" class="form-select">
                                <option value="1000">Počasi (1s)</option>
                                <option value="700" selected>Normalno (0.7s)</option>
                                <option value="400">Hitro (0.4s)</option>
                        </select>
                    </label>
                </div>
                <div class="settings-row">
                    <label class="form-label">Način
                        <select id="zp-mode" class="form-select">
                                <option value="survive" selected>Neskončno (povečuj težavnost)</option>
                                <option value="goal">Cilj: dosegi raven</option>
                        </select>
                    </label>
                    <label id="zp-target-row" class="form-label">Ciljna raven
                        <input id="zp-target-level" type="number" min="1" max="100" value="5" class="form-input">
                    </label>
                </div>
                <div class="settings-row">
                    <label class="form-label">Smer vnosa
                        <select id="zp-direction" class="form-select">
                            <option value="forward" selected>Naprej</option>
                            <option value="backward">Obratno</option>
                        </select>
                    </label>
                </div>
                <div id="zp-validate" class="validation-msg" style="display:none"></div>
                ${renderAdaptiveSettingsPanel('zaporedje')}
        `;

  const stageHtml = `
        <div class="game-stage">
            <div id="zp-start-screen" class="stage-layer">
                ${renderStartCard('Zapomni si številke, ki se prikažejo, ter jih nato vnesi v pravilnem vrstnem redu. Večja nastavitev pomeni večji izziv.', 'zp-start-btn', '▶ Začni preizkus', 'Zaporedje števil')}
            </div>

            <div id="zp-show-screen" class="stage-layer hidden">
                <div class="game-status-bar">
                    <div class="game-status-pill">
                        <span class="game-status-label">Raven</span>
                        <strong class="game-status-val" id="zp-level">1</strong>
                    </div>
                    <div class="game-status-pill">
                        <span class="game-status-label">Najboljše</span>
                        <strong class="game-status-val" id="zp-best">0</strong>
                    </div>
                </div>
                <div class="st-play-column">
                    <div id="zp-display" class="zp-display"></div>
                </div>
            </div>

            <div id="zp-input-screen" class="stage-layer hidden">
                <div class="game-status-bar">
                    <div class="game-status-pill">
                        <span class="game-status-label">Raven</span>
                        <strong class="game-status-val" id="zp-level-input">1</strong>
                    </div>
                    <div class="game-status-pill">
                        <span class="game-status-label">Najboljše</span>
                        <strong class="game-status-val" id="zp-best-input">0</strong>
                    </div>
                </div>
                <div id="zp-user-input" class="zp-user-input"></div>
                <div class="numpad-grid">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="btn btn-outline numpad-btn zp-num" data-val="${n}">${n}</button>`).join('')}
                    <button class="btn btn-outline numpad-btn" id="zp-del"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg></button>
                    <button class="btn btn-outline numpad-btn zp-num" data-val="0">0</button>
                    <button class="btn numpad-ok" id="zp-ok">OK</button>
                </div>
            </div>

            <!-- Rezultat vmesne ravni -->
            <div id="zp-result-screen" class="stage-layer hidden">
                <div class="rc-victory-content game-dialog-box" style="--dialog-max-w: 340px;">
                    <h3 class="result-title result-success">✅ Pravilno!</h3>
                    <p id="zp-result-msg" class="muted-xs mb-sm"></p>
                    <button id="zp-next-btn" class="btn" data-primary-action="true">Naprej na raven 2</button>
                </div>
            </div>

            <!-- Konec igre -->
            <div id="zp-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content game-dialog-box" style="--dialog-max-w: 340px;">
                    <h3 class="result-title result-error">Napačno ✗</h3>
                    <p class="muted-xs MBXS">Prišel/a si do ravni <strong id="zp-final-level"></strong>.</p>
                    <p class="muted-xs mb-sm">Uspešno zapomnjena dolžina: <strong id="zp-final-len"></strong></p>
                    <div class="game-action-row">
                        <button id="zp-retry-btn" class="btn" data-primary-action="true">Igraj znova</button>
                        <button id="zp-back-to-list" class="btn btn-outline" data-action="back-to-list">← Seznam iger</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <p class="mb-md">Preizkusi in izboljšaj svoj delovni spomin.</p>
        <p class="mb-md">Igra bo na zaslonu postopoma prikazala zaporedje številk. Tvoja naloga je, da si jih zapomniš in jih nato vneseš v točno takšnem vrstnem redu, kot so bila prikazana.</p>
        <p style="color: var(--color-text-muted); font-size: 0.9em;">Če izbereš način "Neskončno", bo z vsako stopnjo zaporedje postalo za eno številko daljše.</p>
    `;

  return renderGameShell({
    title: 'Zaporedje števil',
    subtitle: 'Zapomni si številke in jih vnesi v pravilnem vrstnem redu.',
    settingsHtml,
    infoHtml,
    stageHtml,
    footerHtml: '',
  });
}

export function initZaporedje() {
  let sequence = [],
    userSequence = [];
  let startLength = 3,
    displaySpeed = 700;
  let mode = 'survive',
    targetLevel = 5;
  let direction = 'forward';
  let sequenceShowing = false;

  const state = new Proxy(
    { level: 1 },
    {
      set(target, prop, value) {
        target[prop] = value;
        if (prop === 'level') {
          if (ui.level) ui.level.textContent = value;
          if (ui.levelInput) ui.levelInput.textContent = value;
        }
        return true;
      },
    }
  );

  // Pridobi prejšnji osebni rekord
  const bestRec = statsManager.getBest('zaporedje', 'level');
  let bestLevel = bestRec ? bestRec.level : 0;

  const screens = {
    start: document.getElementById('zp-start-screen'),
    show: document.getElementById('zp-show-screen'),
    input: document.getElementById('zp-input-screen'),
    result: document.getElementById('zp-result-screen'),
    end: document.getElementById('zp-end-screen'),
  };

  const ui = {
    level: document.getElementById('zp-level'),
    levelInput: document.getElementById('zp-level-input'),
    best: document.getElementById('zp-best'),
    bestInput: document.getElementById('zp-best-input'),
    display: document.getElementById('zp-display'),
    userInput: document.getElementById('zp-user-input'),
    resMsg: document.getElementById('zp-result-msg'),
    nextBtn: document.getElementById('zp-next-btn'),
    finLevel: document.getElementById('zp-final-level'),
    finLen: document.getElementById('zp-final-len'),
  };

  if (ui.best) ui.best.textContent = bestLevel;
  if (ui.bestInput) ui.bestInput.textContent = bestLevel;

  function applySettingsToGame() {
    // Preveri adaptivno težavnost
    const adaptive = getAdaptiveDifficulty('zaporedje');
    if (adaptive && !isAdaptiveDisabled('zaporedje')) {
      startLength = adaptive.value;
      // Posodobi UI
      const slEl = document.getElementById('zp-start-length');
      if (slEl) slEl.value = String(adaptive.value);
    } else {
      startLength = parseInt(document.getElementById('zp-start-length')?.value || '3', 10) || 3;
    }
    displaySpeed = parseInt(document.getElementById('zp-speed')?.value || '700', 10) || 700;
    mode = document.getElementById('zp-mode')?.value || 'survive';
    targetLevel = parseInt(document.getElementById('zp-target-level')?.value || '5', 10) || 5;
    direction = document.getElementById('zp-direction')?.value || 'forward';
  }

  function resetGameState() {
    state.level = 1;
    userSequence = [];
    sequence = [];
    ui.display.textContent = '';
    ui.userInput.textContent = '';
    ui.resMsg.textContent = '';
    const endTitle = screens.end.querySelector('.result-title');
    if (endTitle) {
      endTitle.textContent = 'Napačno ✗';
      endTitle.classList.add('result-error');
      endTitle.classList.remove('result-success');
    }
    hideAll();
    screens.start.classList.remove('hidden');
  }

  attachZaporedjeValidators();

  function hideAll() {
    Object.values(screens).forEach(s => {
      if (s.tagName === 'DIALOG') {
        if (s.open) s.close();
      } else {
        s.classList.add('hidden');
      }
    });
  }

  function generateSequence(len) {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 10));
  }

  function showSequence() {
    if (sequenceShowing) return;
    sequenceShowing = true;
    hideAll();
    screens.show.classList.remove('hidden');

    sequence = generateSequence(state.level + startLength - 1);
    ui.display.textContent = '';

    let i = 0;
    function flashNext() {
      if (i < sequence.length) {
        ui.display.textContent = sequence[i];
        sounds.play('click');
        i++;
        setTimeout(() => {
          ui.display.textContent = ''; // kratek premor med številkami
          setTimeout(flashNext, 200);
        }, displaySpeed);
      } else {
        setTimeout(() => {
          sequenceShowing = false;
          hideAll();
          screens.input.classList.remove('hidden');
          userSequence = [];
          updateInputDisplay();
        }, 400);
      }
    }

    flashNext();
  }

  function updateInputDisplay() {
    let display = '';
    for (let i = 0; i < sequence.length; i++) {
      if (i < userSequence.length) display += userSequence[i] + '  ';
      else display += '_  ';
    }
    ui.userInput.textContent = display.trim();
  }

  function handleNumpad(val) {
    if (screens.input.classList.contains('hidden')) return;

    if (val === 'del') {
      userSequence.pop();
    } else if (val === 'ok') {
      checkAnswer();
      return;
    } else {
      if (userSequence.length < sequence.length) {
        userSequence.push(parseInt(val, 10));
      }
    }
    updateInputDisplay();
  }

  function checkAnswer() {
    if (userSequence.length !== sequence.length) return; // Igra čaka, da uporabnik vnese vse ali pritisne OK

    const targetSequence = direction === 'backward' ? [...sequence].reverse() : sequence;
    const correct = userSequence.every((n, i) => n === targetSequence[i]);
    hideAll();

    if (correct) {
      sounds.playSuccess();
      screens.result.classList.remove('hidden');
      ui.resMsg.textContent = `Zapomnil/a si si ${sequence.length} števil!`;

      state.level++;
      statsManager.addXp(15 + state.level * 5);

      // Adaptive difficulty update - success
      updateAdaptiveDifficulty('zaporedje', { success: true, score: state.level, metric: 'level' });

      if (mode === 'goal' && state.level - 1 >= targetLevel) {
        showGoalWin();
        return;
      }

      ui.nextBtn.textContent = `Naprej na raven ${state.level}`;

      if (state.level - 1 > bestLevel) {
        bestLevel = state.level - 1;
        if (ui.best) ui.best.textContent = bestLevel;
  if (ui.bestInput) ui.bestInput.textContent = bestLevel;
      }
    } else {
      sounds.playError();
      screens.end.classList.remove('hidden');
      const finishedLevel = state.level - 1;
      const finishedLen = finishedLevel === 0 ? 0 : finishedLevel + startLength;

      ui.finLevel.textContent = finishedLevel;
      ui.finLen.textContent = finishedLen;

      finishGameEpilogue('zaporedje', {
        record: {
          level: finishedLevel,
          length: finishedLen,
          startLength,
          displaySpeed,
          direction,
        },
        adaptive: {
          success: false,
          score: finishedLevel,
          metric: 'level',
        },
      });
    }
  }

  function showGoalWin() {
    hideAll();
    const titleEl = screens.end.querySelector('.result-title');
    if (titleEl) {
      titleEl.textContent = 'Cilj dosežen! 🏆';
      titleEl.classList.remove('result-error');
      titleEl.classList.add('result-success');
    }
    const finishedLevel = state.level - 1;
    const finishedLen = finishedLevel + startLength;
    ui.finLevel.textContent = finishedLevel;
    ui.finLen.textContent = finishedLen;

    finishGameEpilogue('zaporedje', {
      record: {
        level: finishedLevel,
        length: finishedLen,
        startLength,
        displaySpeed,
        direction,
        goal: true,
      },
      adaptive: { success: true, score: finishedLevel, metric: 'level' },
      sound: 'victory',
    });

    screens.end.classList.remove('hidden');
  }

  function startGame() {
    applySettingsToGame();
    state.level = 1;
    showSequence();
  }

  // Event Listeners
  function attachZaporedjeValidators() {
    const startBtn = document.getElementById('zp-start-btn');
    const modeEl = document.getElementById('zp-mode');
    const targetEl = document.getElementById('zp-target-level');
    const msgEl = document.getElementById('zp-validate');

    function doValidate() {
      const mode = modeEl?.value || 'survive';
      const target = parseInt(targetEl?.value || '0', 10) || 0;
      let err = '';
      if (mode === 'goal') {
        if (isNaN(target) || target < 1 || target > 100)
          err = 'Ciljna raven mora biti med 1 in 100.';
      }
      if (err) {
        msgEl.textContent = err;
        msgEl.classList.remove('hidden');
        startBtn?.setAttribute('disabled', '');
        return false;
      }
      msgEl.textContent = '';
      msgEl.classList.add('hidden');
      startBtn?.removeAttribute('disabled');
      return true;
    }

    document.getElementById('zp-start-btn').addEventListener('click', () => {
      if (!doValidate()) return;
      startGame();
    });
    document.getElementById('zp-retry-btn').addEventListener('click', startGame);
    doValidate();
  }

  bindGameSettings('zaporedje', {
    apply: saved => {
      const sl = document.getElementById('zp-start-length');
      if (sl && saved.startLength) sl.value = String(saved.startLength);
      const sp = document.getElementById('zp-speed');
      if (sp && saved.displaySpeed) sp.value = String(saved.displaySpeed);
      const modeEl = document.getElementById('zp-mode');
      if (modeEl && saved.mode) modeEl.value = saved.mode;
      const targ = document.getElementById('zp-target-level');
      if (targ && saved.targetLevel) targ.value = String(saved.targetLevel);
      const dir = document.getElementById('zp-direction');
      if (dir && saved.direction) dir.value = saved.direction;
      syncModeVisibility();
      applySettingsToGame();
    },
    collect: () => ({
      startLength: parseInt(document.getElementById('zp-start-length')?.value || '3', 10) || 3,
      displaySpeed: parseInt(document.getElementById('zp-speed')?.value || '700', 10) || 700,
      mode: document.getElementById('zp-mode')?.value || 'survive',
      targetLevel: parseInt(document.getElementById('zp-target-level')?.value || '5', 10) || 5,
      direction: document.getElementById('zp-direction')?.value || 'forward',
    }),
    afterApply: () => {
      applySettingsToGame();
      resetGameState();
    },
  });

  // Bind adaptive difficulty events
  bindAdaptiveEvents('zaporedje');

  ui.nextBtn.addEventListener('click', showSequence);

  const nextBtnKeyHandler = e => {
    if (e.key === 'Enter' && !screens.result.classList.contains('hidden')) {
      e.preventDefault();
      e.stopPropagation();
      showSequence();
    }
  };

  ui.nextBtn.addEventListener('keydown', nextBtnKeyHandler);
  ui.nextBtn.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // mode-dependent visibility
  function syncModeVisibility() {
    const mode = document.getElementById('zp-mode')?.value || 'survive';
    const targetRow = document.getElementById('zp-target-row');
    if (targetRow)
      mode === 'goal' ? targetRow.classList.remove('hidden') : targetRow.classList.add('hidden');
  }
  // Odstranjeni live change listenerji
  // initial sync
  syncModeVisibility();

  document.querySelectorAll('.zp-num').forEach(btn => {
    btn.addEventListener('click', () => handleNumpad(btn.dataset.val));
  });
  document.getElementById('zp-del').addEventListener('click', () => handleNumpad('del'));
  document.getElementById('zp-ok').addEventListener('click', () => handleNumpad('ok'));

  // Keyboard support
  const keyHandler = e => {
    const resultScreen = document.getElementById('zp-result-screen');
    const inputScreen = document.getElementById('zp-input-screen');

    if (!resultScreen || !inputScreen) return; // Igra ni več aktivna

    if (e.key === 'Enter') {
      if (!resultScreen.classList.contains('hidden')) {
        e.preventDefault();
        e.stopPropagation();
        showSequence();
        return;
      }
      if (!inputScreen.classList.contains('hidden')) {
        e.preventDefault();
        e.stopPropagation();
        handleNumpad('ok');
        return;
      }
    }

    if (inputScreen.classList.contains('hidden')) return;
    if (e.key >= '0' && e.key <= '9') handleNumpad(e.key);
    else if (e.key === 'Backspace') handleNumpad('del');
  };

  const unbindKeys = bindGameKeys(keyHandler);

  document.getElementById('zp-start-btn').dataset.bound = 'true';

  return function cleanup() {
    unbindKeys();
  };
}
