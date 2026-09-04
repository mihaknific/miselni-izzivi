// js/games/racunanje.js — Hitro računanje, ES6 modul
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { Settings } from '../store.js';
import { showToast } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';

export function renderRacunanje() {
  const settingsHtml = `
        <div class="flex-col gap-sm">
            <div class="settings-row">
                <label class="form-label" style="flex:1">Način
                    <select id="rc-mode" class="form-select">
                        <option value="time" selected>Časovni izziv</option>
                        <option value="count">Določeno število nalog</option>
                    </select>
                </label>
            </div>

            <div class="settings-row" id="rc-time-count-row">
                <label class="form-label" id="rc-time-wrap" style="flex:1">Časovna omejitev (s)
                    <input id="rc-time-limit" type="number" class="form-input" min="5" max="3600" value="60">
                </label>
                <label class="form-label" id="rc-count-wrap" style="flex:1; display:none;">Poljubno število nalog
                    <input id="rc-target-count" type="number" class="form-input" min="5" max="1000" value="20">
                </label>
            </div>

            <div class="settings-row">
                <label class="form-label" style="flex:1">Velikost števil
                    <select id="rc-digits" class="form-select">
                        <option value="single" selected>Enomestna (do 10)</option>
                        <option value="double">Dvomestna (do 100)</option>
                        <option value="triple">Trimestna (do 1000)</option>
                        <option value="adaptive">Adaptivno</option>
                        <option value="custom">Poljubno</option>
                    </select>
                </label>
            </div>

            <div class="settings-row" id="rc-custom-range-wrap" style="display:none;">
                <label class="form-label" style="flex:1">Poljubni min
                    <input id="rc-custom-min" type="number" class="form-input" value="1">
                </label>
                <label class="form-label" style="flex:1">Poljubni max
                    <input id="rc-custom-max" type="number" class="form-input" value="100">
                </label>
            </div>

            <div class="settings-row">
                <label class="form-label" style="flex:1">Način odgovarjanja
                    <select id="rc-answer-mode" class="form-select">
                        <option value="options" selected>Izbira možnosti</option>
                        <option value="input">Vnos s tipkovnico</option>
                    </select>
                </label>
                <label class="form-label" id="rc-option-count-wrap" style="flex:1">Število možnosti
                    <input id="rc-option-count" type="number" class="form-input" min="2" max="20" value="4">
                </label>
            </div>

            <div class="settings-row" id="rc-keys-wrap" style="flex-direction:column; align-items:flex-start;">
                <label class="form-label">Tipke za izbiro (po vrsti)</label>
                <div id="rc-keys-container" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            </div>

            <label class="form-label">Operacije (izberi vsaj eno)</label>
            <div class="settings-ops">
                <label><input type="checkbox" id="rc-op-add" checked> +</label>
                <label><input type="checkbox" id="rc-op-sub"> −</label>
                <label><input type="checkbox" id="rc-op-mul"> ×</label>
                <label><input type="checkbox" id="rc-op-div"> ÷</label>
                <label><input type="checkbox" id="rc-op-sqr"> x²</label>
                <label><input type="checkbox" id="rc-op-sqrt"> √</label>
            </div>
            <p class="text-sm text-muted mb-sm">Opomba: Vedno mora biti vsaj ena operacija izbrana. Privzeto je izbrano samo seštevanje (+).</p>

            <div id="rc-settings-error" class="settings-error"></div>
        </div>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="rc-start-screen" class="stage-layer">
                ${renderStartCard('Reši izračune hitro in izberi pravilni rezultat. Izbrana nastavitve vplivajo na težavnost in obseg vprašanj.', 'rc-start', '▶ Začni', 'Hitro računanje')}
            </div>

            <div id="rc-play-layer" class="stage-layer hidden">
                <div id="rc-game-area" class="rc-game-area">
                    <div id="rc-equation" class="rc-equation">3 + 5 = ?</div>
                    <div id="rc-options" class="rc-options"></div>
                    <p id="rc-feedback" class="rc-feedback"></p>
                </div>
            </div>
            
            <div id="rc-end" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align: center; max-width: 340px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--custom-heading, var(--color-primary));">Igra končana!</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Končni rezultat: <strong id="rc-final-score"></strong></p>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-sm);">Pravilno: <span id="rc-correct" style="font-weight: 600; color: var(--color-success);"></span> | Napačno: <span id="rc-wrong" style="font-weight: 600; color: var(--color-error);"></span></p>
                    <button id="rc-retry" class="btn">Ponovi preizkus</button>
                    <button id="rc-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <p style="margin-bottom: 12px;">Hitro računanje preverja in izboljšuje tvojo sposobnost hitrega miselnega izvajanja osnovnih matematičnih operacij.</p>
        <p style="margin-bottom: 12px;">V nastavitvah lahko izbereš zahtevane operacije (+, -, *, /) ter velikost števil, od enomestnih do adaptivnih, ki se prilagajajo glede na tvojo uspešnost.</p>
        <p style="color: var(--color-text-muted); font-size: 0.9em;">Hitrejši in natančnejši kot si, višji bo tvoj rezultat!</p>
    `;

  return renderGameShell({
    title: 'Hitro računanje',
    subtitle: 'Reši izračune hitro in pravilno.',
    statusHtml:
      '<span id="rc-progress-label">Čas: <strong id="rc-progress-val">60</strong></span><span>Točke: <strong id="rc-score">0</strong></span>',
    settingsHtml,
    infoHtml,
    stageHtml,
  });
}

export function initRacunanje() {
  let mode = 'time',
    diffMode = 'single';
  let timeLimit = 60,
    targetCount = 20;

  const state = new Proxy(
    { score: 0, correctCount: 0, wrongCount: 0, currentQ: 0, timeLeft: 0 },
    {
      set(target, prop, value) {
        target[prop] = value;
        if (prop === 'score' && ui.scoreEl) ui.scoreEl.textContent = value;
        if (prop === 'timeLeft' && ui.progVal && mode === 'time') ui.progVal.textContent = value;
        if (prop === 'currentQ' && ui.progVal && mode === 'count')
          ui.progVal.textContent = `${value} / ${targetCount}`;
        return true;
      },
    }
  );

  let timerInterval = null,
    isPlaying = false;

  // Adaptivno
  let adaptiveLevel = 1,
    consecutiveCorrect = 0;
  let currentAnswer = 0;

  const ui = {
    modeSel: document.getElementById('rc-mode'),
    diffSel: document.getElementById('rc-digits'),
    timeLimitInput: document.getElementById('rc-time-limit'),
    targetCountInput: document.getElementById('rc-target-count'),
    customMin: document.getElementById('rc-custom-min'),
    customMax: document.getElementById('rc-custom-max'),
    answerModeSel: document.getElementById('rc-answer-mode'),
    optionCountInput: document.getElementById('rc-option-count'),
    keysContainer: document.getElementById('rc-keys-container'),
    opAdd: document.getElementById('rc-op-add'),
    opSub: document.getElementById('rc-op-sub'),
    opMul: document.getElementById('rc-op-mul'),
    opDiv: document.getElementById('rc-op-div'),
    opSqr: document.getElementById('rc-op-sqr'),
    opSqrt: document.getElementById('rc-op-sqrt'),
    settingsError: document.getElementById('rc-settings-error'),
    startBtn: document.getElementById('rc-start'),
    progLabel:
      document.getElementById('rc-progress-label') ||
      document.getElementById('rc-progress-val')?.parentElement ||
      null,
    progVal: document.getElementById('rc-progress-val'),
    scoreEl: document.getElementById('rc-score'),
    equation: document.getElementById('rc-equation'),
    options: document.getElementById('rc-options'),
    feedback: document.getElementById('rc-feedback'),
    gameArea: document.getElementById('rc-game-area'),
    endArea: document.getElementById('rc-end'),
    finScore: document.getElementById('rc-final-score'),
    correctEl: document.getElementById('rc-correct'),
    wrongEl: document.getElementById('rc-wrong'),
    retryBtn: document.getElementById('rc-retry'),
    startScreen: document.getElementById('rc-start-screen'),
    playLayer: document.getElementById('rc-play-layer'),
  };

  let savedCustomKeys = [];
  async function loadSavedSettings() {
    const saved = await Settings.get('game.racunanje', null);
    if (!saved) return;
    try {
      if (saved.mode) ui.modeSel.value = saved.mode;
      if (saved.timeLimit) ui.timeLimitInput.value = saved.timeLimit;
      if (saved.targetCount) ui.targetCountInput.value = saved.targetCount;
      if (saved.digits) ui.diffSel.value = saved.digits;
      if (saved.customMin) ui.customMin.value = saved.customMin;
      if (saved.customMax) ui.customMax.value = saved.customMax;
      if (saved.answerMode) ui.answerModeSel.value = saved.answerMode;
      if (saved.optionCount) ui.optionCountInput.value = saved.optionCount;
      if (saved.customKeys && Array.isArray(saved.customKeys)) {
        savedCustomKeys = saved.customKeys;
      } else if (typeof saved.customKeys === 'string') {
        savedCustomKeys = saved.customKeys.split('');
      }
      ui.opAdd.checked = !!saved.ops?.add;
      ui.opSub.checked = !!saved.ops?.sub;
      ui.opMul.checked = !!saved.ops?.mul;
      ui.opDiv.checked = !!saved.ops?.div;
      ui.opSqr.checked = !!saved.ops?.sqr;
      ui.opSqrt.checked = !!saved.ops?.sqrt;
      if (![ui.opAdd, ui.opSub, ui.opMul, ui.opDiv, ui.opSqr, ui.opSqrt].some(op => op.checked)) {
        ui.opAdd.checked = true;
      }
    } catch (e) {
      console.error('Load settings failed', e);
    }
  }

  loadSavedSettings().then(() => {
    syncSettingsVisibility();
    renderKeyInputs();
    validateSettings();
  });

  function syncSettingsVisibility() {
    try {
      const modeVal = ui.modeSel.value;
      const timeWrap = document.getElementById('rc-time-wrap');
      if (timeWrap) timeWrap.style.display = modeVal === 'time' ? '' : 'none';

      const countWrap = document.getElementById('rc-count-wrap');
      if (countWrap) countWrap.style.display = modeVal === 'count' ? '' : 'none';

      const digitsVal = ui.diffSel.value;
      const customWrap = document.getElementById('rc-custom-range-wrap');
      if (customWrap) customWrap.style.display = digitsVal === 'custom' ? 'flex' : 'none';

      const answerMode = ui.answerModeSel.value;
      const optWrap = document.getElementById('rc-option-count-wrap');
      if (optWrap) optWrap.style.display = answerMode === 'options' ? '' : 'none';
      const keysWrap = document.getElementById('rc-keys-wrap');
      if (keysWrap) keysWrap.style.display = answerMode === 'options' ? 'flex' : 'none';
    } catch (e) {
      console.warn('syncSettingsVisibility error', e);
    }
  }

  function renderKeyInputs() {
    if (!ui.keysContainer) return;
    const count = parseInt(ui.optionCountInput.value) || 4;

    const currentInputs = ui.keysContainer.querySelectorAll('input');
    let currentKeys = [];
    if (currentInputs.length > 0) {
      currentKeys = Array.from(currentInputs).map(inp => inp.value);
    } else {
      currentKeys = savedCustomKeys.length ? savedCustomKeys : 'fghjklqwertyuiopasdf'.split('');
    }

    const defaults = 'fghjklqwertyuiopasdf'.split('');

    ui.keysContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const val = currentKeys[i] || defaults[i] || '';
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = 'center';
      wrap.style.gap = '4px';
      const label = document.createElement('small');
      label.style.fontSize = '0.7em';
      label.style.color = 'var(--color-text-muted)';
      label.textContent = `Mož. ${i + 1}`;
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'form-input rc-key-input';
      inp.style.width = '44px';
      inp.style.textAlign = 'center';
      inp.style.padding = 'var(--spacing-sm)';
      inp.maxLength = 1;
      inp.value = val;

      wrap.appendChild(label);
      wrap.appendChild(inp);
      ui.keysContainer.appendChild(wrap);
    }
  }

  syncSettingsVisibility();
  renderKeyInputs();

  function showSettingsError(msg) {
    if (!ui.settingsError) {
      showToast(msg, { type: 'error' });
      return;
    }
    ui.settingsError.textContent = msg;
    ui.settingsError.style.display = 'block';
  }

  function clearSettingsError() {
    if (!ui.settingsError) return;
    ui.settingsError.textContent = '';
    ui.settingsError.style.display = 'none';
  }

  function validateSettings() {
    clearSettingsError();
    const modeVal = ui.modeSel.value;
    const timeVal = Number(ui.timeLimitInput.value || 0);
    const targ = Number(ui.targetCountInput.value || 0);
    const digits = ui.diffSel.value;
    const cmin = Number(ui.customMin.value || 0);
    const cmax = Number(ui.customMax.value || 0);
    const optionCount = Number(ui.optionCountInput.value || 0);
    const keysInputs = document.querySelectorAll('.rc-key-input');
    const keysArr = Array.from(keysInputs)
      .map(i => i.value.toLowerCase().trim())
      .filter(v => v);
    const uniqueKeys = new Set(keysArr);

    if (modeVal === 'time' && (timeVal < 5 || timeVal > 3600)) {
      showSettingsError('Čas mora biti med 5 in 3600s');
      return false;
    }
    if (modeVal === 'count' && (targ < 5 || targ > 1000)) {
      showSettingsError('Število nalog mora biti med 5 in 1000');
      return false;
    }
    if (digits === 'custom') {
      if (cmin > cmax) {
        showSettingsError('Poljubni razpon: min mora biti manjši ali enak max');
        return false;
      }
      if (cmax > 100000) {
        showSettingsError('Poljubni razpon: max je lahko največ 100.000');
        return false;
      }
    }
    if (optionCount < 2 || optionCount > 20) {
      showSettingsError('Število možnosti mora biti med 2 in 20');
      return false;
    }
    if (ui.answerModeSel.value === 'options' && uniqueKeys.size < optionCount) {
      showSettingsError(`Za ${optionCount} možnosti potrebuješ ${optionCount} različnih tipk.`);
      return false;
    }
    if (!(
      ui.opAdd.checked ||
      ui.opSub.checked ||
      ui.opMul.checked ||
      ui.opDiv.checked ||
      ui.opSqr.checked ||
      ui.opSqrt.checked
    )) {
      showSettingsError('Izberi vsaj eno operacijo');
      return false;
    }
    clearSettingsError();
    return true;
  }

  function showInitialScreen() {
    ui.startScreen.classList.remove('hidden');
    if (ui.playLayer) ui.playLayer.classList.add('hidden');
    ui.endArea.classList.add('hidden');
  }

  function showGameScreen() {
    ui.startScreen.classList.add('hidden');
    if (ui.playLayer) ui.playLayer.classList.remove('hidden');
    ui.endArea.classList.add('hidden');
  }

  function persistSettings() {
    const keysInputs = document.querySelectorAll('.rc-key-input');
    const keysArr = Array.from(keysInputs).map(i => i.value.toLowerCase().trim() || 'a');

    const toSave = {
      mode: ui.modeSel.value,
      timeLimit: Number(ui.timeLimitInput.value || 60),
      targetCount: Number(ui.targetCountInput.value || 20),
      digits: ui.diffSel.value,
      customMin: Number(ui.customMin.value || 1),
      customMax: Number(ui.customMax.value || 100),
      answerMode: ui.answerModeSel.value,
      optionCount: Number(ui.optionCountInput.value || 4),
      customKeys: keysArr,
      ops: {
        add: ui.opAdd.checked,
        sub: ui.opSub.checked,
        mul: ui.opMul.checked,
        div: ui.opDiv.checked,
        sqr: ui.opSqr.checked,
        sqrt: ui.opSqrt.checked,
      },
    };
    Settings.set('game.racunanje', toSave);
  }

  function applySettingsToGame() {
    mode = ui.modeSel.value;
    diffMode = ui.diffSel.value;
    timeLimit = Number(ui.timeLimitInput.value || 60);
    targetCount = Number(ui.targetCountInput.value || 20);

    if (ui.modeSel.value === 'time') {
      ui.progLabel.innerHTML = `Čas: <strong id="rc-progress-val">${timeLimit}</strong> s`;
    } else {
      ui.progLabel.innerHTML = `Naloge: <strong id="rc-progress-val">0 / ${targetCount}</strong>`;
    }

    persistSettings();
  }

  function showEndScreen() {
    ui.startScreen.classList.add('hidden');
    if (ui.playLayer) ui.playLayer.classList.add('hidden');
    ui.endArea.classList.remove('hidden');
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRangeForDigits(levelStr) {
    let level = 1;
    if (levelStr === 'single') level = 1;
    else if (levelStr === 'double') level = 2;
    else if (levelStr === 'triple') level = 3;
    else if (levelStr === 'adaptive') level = adaptiveLevel;
    else if (levelStr === 'custom') level = 2;

    let minA, maxA, minB, maxB;
    switch (level) {
      case 1:
        minA = 1;
        maxA = 10;
        minB = 1;
        maxB = 10;
        break;
      case 2:
        minA = 10;
        maxA = 100;
        minB = 2;
        maxB = 20;
        break;
      case 3:
        minA = 50;
        maxA = 500;
        minB = 5;
        maxB = 50;
        break;
      default:
        minA = 1;
        maxA = 10;
        minB = 1;
        maxB = 10;
        break;
    }

    if (levelStr === 'custom') {
      const customMin = Number(ui.customMin?.value || 1);
      const customMax = Number(ui.customMax?.value || 100);
      minA = Math.min(customMin, customMax);
      maxA = Math.max(customMin, customMax);
      minB = 1;
      maxB = Math.max(2, maxA);
    }

    return { minA, maxA, minB, maxB };
  }

  function getEnabledOperations() {
    const ops = [];
    if (ui.opAdd.checked) ops.push('+');
    if (ui.opSub.checked) ops.push('-');
    if (ui.opMul.checked) ops.push('*');
    if (ui.opDiv.checked) ops.push('/');
    if (ui.opSqr.checked) ops.push('sqr');
    if (ui.opSqrt.checked) ops.push('sqrt');
    return ops;
  }

  function buildQuestion(op, range) {
    const minA = Math.max(0, range.minA);
    const maxA = Math.max(minA, range.maxA);
    const minB = Math.max(0, range.minB);
    const maxB = Math.max(minB, range.maxB);

    let a = 0;
    let b = 0;
    let answer = 0;
    let equation = '';

    if (op === '+') {
      a = randomInt(minA, maxA);
      b = randomInt(minB, maxB);
      answer = a + b;
      equation = `${a} + ${b} = ?`;
    } else if (op === '-') {
      a = randomInt(minA, maxA);
      b = randomInt(minB, maxB);
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      equation = `${a} - ${b} = ?`;
    } else if (op === '*') {
      if (diffMode === 'double' || adaptiveLevel === 2) {
        a = randomInt(2, 12);
        b = randomInt(2, 12);
      } else if (diffMode === 'triple' || adaptiveLevel === 3) {
        a = randomInt(10, 50);
        b = randomInt(2, 20);
      } else {
        a = randomInt(Math.max(1, minA), Math.max(1, maxA));
        b = randomInt(Math.max(1, minB), Math.max(1, maxB));
      }
      answer = a * b;
      equation = `${a} × ${b} = ?`;
    } else if (op === '/') {
      if (diffMode === 'double' || adaptiveLevel === 2) {
        b = randomInt(2, 12);
        answer = randomInt(2, 12);
      } else if (diffMode === 'triple' || adaptiveLevel === 3) {
        b = randomInt(2, 20);
        answer = randomInt(10, 50);
      } else {
        b = randomInt(1, 10);
        answer = randomInt(1, 10);
      }
      a = answer * b;
      equation = `${a} ÷ ${b} = ?`;
    } else if (op === 'sqr') {
      a = randomInt(Math.max(0, minA), Math.max(0, maxA));
      answer = a * a;
      equation = `${a}² = ?`;
    } else if (op === 'sqrt') {
      let rootMin = Math.ceil(Math.sqrt(minA));
      let rootMax = Math.floor(Math.sqrt(maxA));
      const root =
        rootMax < rootMin ? Math.max(0, Math.round(Math.sqrt(maxA))) : randomInt(rootMin, rootMax);
      a = root * root;
      answer = root;
      equation = `√${a} = ?`;
    } else {
      throw new Error(`Unsupported operation: ${op}`);
    }

    return { answer, equation };
  }

  function generateQuestion() {
    if (window._rcKeyHandler) {
      document.removeEventListener('keydown', window._rcKeyHandler);
    }

    const operations = getEnabledOperations();
    if (!operations.length) {
      showSettingsError('Izberi vsaj eno operacijo');
      return;
    }

    const op = operations[randomInt(0, operations.length - 1)];
    const range = getRangeForDigits(diffMode);
    const { answer, equation } = buildQuestion(op, range);

    currentAnswer = answer;
    ui.equation.textContent = equation;

    const optionCount = Number(ui.optionCountInput?.value || 4);
    const answerMode = ui.answerModeSel?.value || 'options';
    const options = new Set([answer]);
    let failsafe = 0;
    while (options.size < optionCount && failsafe < 200) {
      let wrng = answer + randomInt(-10, 10);
      if (wrng === answer) wrng += 2;
      if (wrng >= 0) options.add(wrng);
      failsafe++;
    }
    while (options.size < optionCount) options.add(randomInt(0, Math.max(50, answer + 10)));

    ui.options.innerHTML = '';
    if (answerMode === 'input') {
      const wrap = document.createElement('div');
      wrap.className = 'flex-row gap-sm';
      wrap.style.justifyContent = 'center';
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.id = 'rc-input-answer';
      inp.className = 'form-input text-xl p-sm';
      const submit = document.createElement('button');
      submit.className = 'btn';
      submit.textContent = 'Oddaj';
      const doSubmit = () => {
        const v = Number(inp.value);
        handleAnswer(v, null);
      };
      submit.addEventListener('click', doSubmit);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') doSubmit();
      });

      wrap.appendChild(inp);
      wrap.appendChild(submit);
      ui.options.appendChild(wrap);
    } else {
      const opArr = Array.from(options);
      for (let i = opArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opArr[i], opArr[j]] = [opArr[j], opArr[i]];
      }

      let keys = savedCustomKeys.length ? savedCustomKeys : 'fghjklqwertyuiopasdf'.split('');

      window._rcKeyHandler = e => {
        if (!isPlaying) return;
        const idx = keys.indexOf(e.key.toLowerCase());
        if (idx >= 0 && idx < opArr.length) {
          const btns = ui.options.querySelectorAll('button');
          if (btns[idx]) btns[idx].click();
        }
      };
      document.addEventListener('keydown', window._rcKeyHandler);

      opArr.forEach((val, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline p-md text-xl';
        btn.innerHTML = `<span>${val}</span> <small style="display:block; opacity:0.5; font-size:0.6em; margin-top:4px;">[Tipka ${keys[i].toUpperCase()}]</small>`;
        btn.addEventListener('click', () => handleAnswer(val, btn));
        ui.options.appendChild(btn);
      });
    }
  }

  function handleAnswer(val, btn) {
    if (!isPlaying) return;

    Array.from(ui.options.children).forEach(b => (b.disabled = true));
    const isCorrect = val === currentAnswer;

    if (isCorrect) {
      if (btn) {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-correct');
      }
      state.score += adaptiveLevel * 10;
      statsManager.addXp(10);
      state.correctCount++;
      consecutiveCorrect++;
      if (consecutiveCorrect >= 3 && adaptiveLevel < 3) {
        adaptiveLevel++;
        consecutiveCorrect = 0;
      }
      ui.feedback.textContent = 'Pravilno! ✓';
      ui.feedback.className = 'rc-feedback result-success';
      sounds.playSuccess();
    } else {
      if (btn) {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-incorrect');
      }
      Array.from(ui.options.children).forEach(b => {
        if (parseInt(b.textContent) === currentAnswer) {
          b.classList.remove('btn-outline');
          b.classList.add('btn-correct');
        }
      });

      state.wrongCount++;
      consecutiveCorrect = 0;
      if (adaptiveLevel > 1) adaptiveLevel--;
      ui.feedback.textContent = `Napačno! Pravilno je bilo ${currentAnswer}`;
      ui.feedback.className = 'rc-feedback result-error shake';
      sounds.playError();

      const gameArea = document.getElementById('rc-game-area');
      if (gameArea) {
        gameArea.classList.add('shake');
        setTimeout(() => gameArea.classList.remove('shake'), 400);
      }
    }

    setTimeout(() => {
      if (!isPlaying) return;
      ui.feedback.textContent = '';
      ui.feedback.className = 'rc-feedback';
      Array.from(ui.options.children).forEach(b => (b.disabled = false));

      if (mode === 'count') {
        state.currentQ++;
        if (state.currentQ >= targetCount) endGame();
        else generateQuestion();
      } else {
        generateQuestion();
      }
    }, 800);
  }

  function startTimer() {
    clearInterval(timerInterval);
    state.timeLeft = timeLimit;
    timerInterval = setInterval(() => {
      state.timeLeft--;
      if (state.timeLeft <= 0) endGame();
    }, 1000);
  }

  function resetGameState() {
    clearInterval(timerInterval);
    state.score = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.currentQ = 0;
    adaptiveLevel = 1;
    consecutiveCorrect = 0;
    isPlaying = false;
    ui.feedback.textContent = '';
    ui.options.innerHTML = '';
  }

  function startGame() {
    if (!validateSettings()) return;

    mode = ui.modeSel.value;
    diffMode = ui.diffSel.value;
    timeLimit = Number(ui.timeLimitInput.value || 60);
    targetCount = Number(ui.targetCountInput.value || 20);

    persistSettings();

    state.score = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.currentQ = 0;
    adaptiveLevel = 1;
    consecutiveCorrect = 0;
    isPlaying = true;

    ui.feedback.textContent = '';
    showGameScreen();

    if (mode === 'time') {
      if (ui.progLabel)
        ui.progLabel.innerHTML = `Čas: <strong id="rc-progress-val">${timeLimit}</strong> s`;
      ui.progVal = document.getElementById('rc-progress-val');
      startTimer();
    } else {
      if (ui.progLabel)
        ui.progLabel.innerHTML = `Naloge: <strong id="rc-progress-val">0 / ${targetCount}</strong>`;
      ui.progVal = document.getElementById('rc-progress-val');
      state.currentQ = 0;
    }

    generateQuestion();
  }

  function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    showEndScreen();

    ui.finScore.textContent = state.score;
    ui.correctEl.textContent = state.correctCount;
    ui.wrongEl.textContent = state.wrongCount;

    statsManager.saveRecord('racunanje', {
      score: state.score,
      correct: state.correctCount,
      mode,
      diff: diffMode,
    });
    sounds.playVictory();
  }

  setGameSettingsApplyHandler(() => {
    if (!validateSettings()) return false;
    applySettingsToGame();
    resetGameState();
    showInitialScreen();
    return true;
  });

  ui.startBtn.addEventListener('click', startGame);
  ui.retryBtn.addEventListener('click', startGame);

  const operationInputs = [ui.opAdd, ui.opSub, ui.opMul, ui.opDiv, ui.opSqr, ui.opSqrt];
  operationInputs.forEach(input =>
    input.addEventListener('change', () => {
      if (!operationInputs.some(operation => operation.checked)) {
        input.checked = true;
        showSettingsError('Vsaj ena operacija mora ostati izbrana.');
      } else {
        clearSettingsError();
      }
    })
  );
  document.getElementById('rc-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  ui.modeSel?.addEventListener('change', syncSettingsVisibility);
  ui.diffSel?.addEventListener('change', syncSettingsVisibility);
  ui.answerModeSel?.addEventListener('change', syncSettingsVisibility);
  ui.optionCountInput?.addEventListener('input', renderKeyInputs);

  showInitialScreen();

  return function cleanup() {
    clearInterval(timerInterval);
    isPlaying = false;
    if (window._rcKeyHandler) {
      document.removeEventListener('keydown', window._rcKeyHandler);
      window._rcKeyHandler = null;
    }
  };
}
