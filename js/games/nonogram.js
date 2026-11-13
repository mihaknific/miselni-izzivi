// js/games/nonogram.js — Nonogram Picross (Japonska križanka)
import { sounds } from '../sounds.js';
import { showToast } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import {
  renderGameShell,
  showStageMessage,
  createGameTimer,
  finishGameEpilogue,
} from './game-layout.js';
import { bindGameSettings } from './game-settings-panel.js';
import {
  getAdaptiveDifficulty,
  isAdaptiveDisabled,
  renderAdaptiveSettingsPanel,
  bindAdaptiveEvents,
  setAdaptiveDifficulty,
} from '../adaptive-difficulty.js';
import { formatTime } from '../utils/helpers.js';

export function renderNonogram() {
  const settingsHtml = `
    <div class="settings-row">
      <label class="form-label">Velikost
        <select id="nono-size" class="form-select">
          <option value="5">5×5 (lahko)</option>
          <option value="10" selected>10×10 (srednje)</option>
          <option value="15">15×15 (težko)</option>
        </select>
      </label>
      <label class="form-label">Gostota
        <select id="nono-density" class="form-select">
          <option value="0.45">Redko</option>
          <option value="0.5" selected>Srednje</option>
          <option value="0.55">Gosto</option>
        </select>
      </label>
    </div>
${renderAdaptiveSettingsPanel('nonogram')}
  `;
  const stageHtml = `
    <div class="game-stage">
      <div id="nono-start-screen" class="stage-layer">
        ${renderStartCard(
          'Iz namigov sestavi skrito sliko. Številke levo pripadajo vrsticam, številke zgoraj pa stolpcem. Na primer 3 1 pomeni tri polne celice, najmanj eno prazno celico, nato eno polno celico.',
          'nono-start-btn',
          '▶ Začni Nonogram',
          'Nonogram – Japonska križanka'
        )}
      </div>
      <div id="nono-play-screen" class="stage-layer hidden">
        <div class="nono-stage-container">
          <div class="game-status-bar">
            <div class="game-status-pill">
              <span class="game-status-label">Čas</span>
              <strong class="game-status-val" id="nono-header-time">00:00</strong>
            </div>
            <div class="game-status-pill">
              <span class="game-status-label">Velikost</span>
              <strong class="game-status-val" id="nono-header-size">10×10</strong>
            </div>
          </div>
          <div id="nono-wrapper" class="nono-wrapper"></div>
          <div class="game-controls-stack">
            <div class="game-segmented-group" role="radiogroup" aria-label="Način risanja">
              <button id="nono-mode-fill" class="seg-btn nono-mode-btn active" role="radio" aria-checked="true">⬛ Polni</button>
              <button id="nono-mode-mark" class="seg-btn nono-mode-btn" role="radio" aria-checked="false">✕ Označi</button>
              <button id="nono-mode-erase" class="seg-btn nono-mode-btn" role="radio" aria-checked="false">⌫ Briši</button>
            </div>
            <div class="game-action-row">
              <button id="nono-hint-btn" class="btn btn-outline">💡 Namig</button>
              <button id="nono-check-btn" class="btn btn-outline">✓ Preveri</button>
              <button id="nono-new-btn" class="btn btn-outline">↺ Nova igra</button>
              <button id="nono-solve-btn" class="btn btn-outline" style="opacity: 0.7;">Reši</button>
            </div>
          </div>
          <p class="nono-help">Klik/drag po poljih: črno = polno, ✕ = prazno. Preveri označi napačne.</p>
          <div id="nono-message" style="min-height:1.4em; text-align:center; font-weight:700; font-size:0.9rem;"></div>
        </div>
      </div>
      <div id="nono-end-screen" class="stage-layer hidden">
        <div class="rc-victory-content game-dialog-box">
          <h3 class="result-title">Rešeno! 🎉</h3>
          <p class="muted-xs">Čas: <strong id="nono-final-time">00:00</strong> • Velikost: <strong id="nono-final-size"></strong></p>
          <p class="muted-xs mb-sm">Napake: <strong id="nono-final-errors">0</strong></p>
          <div class="game-action-row">
            <button id="nono-retry-btn" class="btn" data-primary-action="true">Nova igra</button>
            <button id="nono-back-to-list" class="btn btn-outline" data-action="back-to-list">← Seznam iger</button>
          </div>
        </div>
      </div>
    </div>
  `;
  const infoHtml = `
    <h4 class="mb-sm">O Nonogramu</h4>
    <p class="mb-md">Nonogram (Picross oziroma japonska križanka) je logična slikovna uganka. Z namigi ob mreži ugotoviš, katere celice morajo biti polne.</p>
    <ul class="info-list">
      <li>Namigi levo so za vrstice, namigi zgoraj so za stolpce. Berejo se po vrsti.</li>
      <li>Vsaka številka pove dolžino zaporednega bloka polnih celic.</li>
      <li>Med dvema blokoma mora biti vsaj ena prazna celica. Namig <strong>3 1</strong> zato pomeni: ■■■, prazno, ■.</li>
      <li>Z gumbom <strong>Polni</strong> označiš črno celico, z gumbom <strong>Označi prazno</strong> dodaš ✕, z gumbom <strong>Briši</strong> pa počistiš celico.</li>
      <li>Gumb <strong>Preveri</strong> označi napačne črne celice. Prazne celice, ki jih še nisi rešil, niso napaka.</li>
      <li>Ko se vsa mreža ujema z namigi, se igra zaključi. Z miško ali prstom lahko vlečeš čez več celic.</li>
    </ul>
  `;
  return renderGameShell({
    title: 'Nonogram',
    subtitle: 'Japonska križanka – logika slik.',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initNonogram() {
  const startScreen = document.getElementById('nono-start-screen');
  const playScreen = document.getElementById('nono-play-screen');
  const endScreen = document.getElementById('nono-end-screen');
  const wrapperEl = document.getElementById('nono-wrapper');
  const headerTime = document.getElementById('nono-header-time');
  const headerSize = document.getElementById('nono-header-size');
  const msgEl = document.getElementById('nono-message');

  let size = 10;
  let density = 0.5;
  let solution = []; // 2D boolean
  let grid = []; // 0 empty, 1 filled, 2 marked X
  let rowClues = [],
    colClues = [];
  let mode = 'fill'; // fill, mark, erase
  let startTime = 0;
  let errors = 0;
  let isDragging = false;
  let dragMode = null;
  const gameTimer = createGameTimer(elapsed => {
    if (headerTime) headerTime.textContent = formatTime(elapsed);
  });

  const SIZE_LABELS = [5, 10, 15];

  function readSettings() {
    const adaptive = getAdaptiveDifficulty('nonogram');
    if (adaptive && !isAdaptiveDisabled('nonogram')) {
      size = SIZE_LABELS[adaptive.value] || size;
      const sEl = document.getElementById('nono-size');
      if (sEl) sEl.value = String(size);
    } else {
      const sEl = document.getElementById('nono-size');
      if (sEl) size = parseInt(sEl.value, 10) || 10;
    }
    const dEl = document.getElementById('nono-density');
    if (dEl) density = parseFloat(dEl.value) || 0.5;
    if (headerSize) headerSize.textContent = `${size}×${size}`;
  }

  bindGameSettings('nonogram', {
    defaults: { size: 10, density: 0.5 },
    apply: saved => {
      size = saved.size || 10;
      const adaptive = getAdaptiveDifficulty('nonogram');
      if (adaptive && !isAdaptiveDisabled('nonogram')) {
        size = SIZE_LABELS[adaptive.value] || size;
      }
      density = saved.density || 0.5;
      const sEl = document.getElementById('nono-size');
      const dEl = document.getElementById('nono-density');
      if (sEl) sEl.value = String(size);
      if (dEl) dEl.value = String(density);
      if (headerSize) headerSize.textContent = `${size}×${size}`;
    },
    readFromUI: readSettings,
    collect: () => ({ size, density }),
    afterApply: () => {
      const idx = SIZE_LABELS.indexOf(size);
      if (idx >= 0) setAdaptiveDifficulty('nonogram', idx);
      startNewGame();
      showLayer(playScreen);
    },
  });

  bindAdaptiveEvents('nonogram');

  function showLayer(l) {
    [startScreen, playScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (l) l.classList.remove('hidden');
  }

  function startTimer() {
    startTime = Date.now();
    gameTimer.reset();
    gameTimer.start();
  }
  function stopTimer() {
    gameTimer.stop();
  }

  function generate() {
    // random solution with density, ensure at least one filled per row/col?
    solution = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => Math.random() < density)
    );
    // ensure not empty row/col (if empty, add one random)
    for (let r = 0; r < size; r++)
      if (solution[r].every(v => !v)) {
        solution[r][Math.floor(Math.random() * size)] = true;
      }
    for (let c = 0; c < size; c++) {
      let colEmpty = true;
      for (let r = 0; r < size; r++) if (solution[r][c]) colEmpty = false;
      if (colEmpty) {
        solution[Math.floor(Math.random() * size)][c] = true;
      }
    }
    // compute clues
    rowClues = solution.map(row => {
      const clues = [];
      let cnt = 0;
      for (const v of row) {
        if (v) cnt++;
        else {
          if (cnt > 0) {
            clues.push(cnt);
            cnt = 0;
          }
        }
      }
      if (cnt > 0) clues.push(cnt);
      return clues.length ? clues : [0];
    });
    colClues = Array.from({ length: size }, (_, c) => {
      const clues = [];
      let cnt = 0;
      for (let r = 0; r < size; r++) {
        if (solution[r][c]) cnt++;
        else {
          if (cnt > 0) {
            clues.push(cnt);
            cnt = 0;
          }
        }
      }
      if (cnt > 0) clues.push(cnt);
      return clues.length ? clues : [0];
    });
    grid = Array.from({ length: size }, () => Array(size).fill(0));
  }

  function render() {
    if (!wrapperEl) return;
    wrapperEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'nono-grid-wrap';
    const maxRowClueLen = Math.max(...rowClues.map(c => c.length));
    const maxColClueLen = Math.max(...colClues.map(c => c.length));
    // grid dimensions: (maxColClueLen rows for col clues + size) x (maxRowClueLen cols for row clues + size)
    wrap.style.setProperty('--nono-cell-size', `clamp(16px, calc((100vw - 95px) / ${size}), 30px)`);
    wrap.style.gridTemplateColumns = `${Math.max(40, maxRowClueLen * 18)}px repeat(${size}, var(--nono-cell-size))`;
    wrap.style.gridTemplateRows = `${Math.max(40, maxColClueLen * 18)}px repeat(${size}, var(--nono-cell-size))`;
    // corner
    const corner = document.createElement('div');
    corner.className = 'nono-corner';
    wrap.appendChild(corner);
    // col clues
    for (let c = 0; c < size; c++) {
      const clueDiv = document.createElement('div');
      clueDiv.className = 'nono-clue col-clue';
      const clues = colClues[c];
      if (clues.length === 1 && clues[0] === 0) clueDiv.textContent = '0';
      else clueDiv.innerHTML = clues.map(n => `<span>${n}</span>`).join('');
      wrap.appendChild(clueDiv);
    }
    // rows
    for (let r = 0; r < size; r++) {
      const rowClue = document.createElement('div');
      rowClue.className = 'nono-clue row-clue';
      const clues = rowClues[r];
      if (clues.length === 1 && clues[0] === 0) rowClue.textContent = '0';
      else rowClue.innerHTML = clues.map(n => `<span>${n}</span>`).join(' ');
      wrap.appendChild(rowClue);
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('div');
        cell.className = 'nono-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        const val = grid[r][c];
        if (val === 1) cell.classList.add('filled');
        else if (val === 2) {
          cell.classList.add('marked');
          cell.textContent = '✕';
        }
        cell.addEventListener('mousedown', e => {
          e.preventDefault();
          handleCellDown(r, c);
        });
        cell.addEventListener('mouseenter', () => {
          if (isDragging) handleCellEnter(r, c);
        });
        cell.addEventListener(
          'touchstart',
          e => {
            e.preventDefault();
            handleCellDown(r, c);
          },
          { passive: false }
        );
        cell.addEventListener(
          'touchmove',
          e => {
            const t = e.touches[0];
            const el = document.elementFromPoint(t.clientX, t.clientY);
            if (el && el.classList.contains('nono-cell')) {
              const rr = parseInt(el.dataset.r, 10),
                cc = parseInt(el.dataset.c, 10);
              handleCellEnter(rr, cc);
            }
          },
          { passive: false }
        );
        wrap.appendChild(cell);
      }
    }
    wrapperEl.appendChild(wrap);
    // global mouse up
  }

  function updateCellDOM(r, c) {
    const el = wrapperEl.querySelector(`.nono-cell[data-r="${r}"][data-c="${c}"]`);
    if (!el) return;
    el.className = 'nono-cell';
    const val = grid[r][c];
    if (val === 1) el.classList.add('filled');
    else if (val === 2) {
      el.classList.add('marked');
      el.textContent = '✕';
    } else el.textContent = '';
  }

  function handleCellDown(r, c) {
    isDragging = true;
    dragMode = mode;
    applyCell(r, c, dragMode);
  }
  function handleCellEnter(r, c) {
    if (!isDragging) return;
    applyCell(r, c, dragMode);
  }
  function applyCell(r, c, m) {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    const cur = grid[r][c];
    let next = cur;
    if (m === 'fill') {
      next = cur === 1 ? 0 : 1;
    } else if (m === 'mark') {
      next = cur === 2 ? 0 : 2;
    } else if (m === 'erase') {
      next = 0;
    }
    if (next !== cur) {
      grid[r][c] = next;
      sounds.play('click');
      updateCellDOM(r, c);
      // preveri zmago po vsaki potezi (nevsiljivo)
      if (isSolved()) {
        // kratek delay da se vidi zadnja poteza
        setTimeout(() => {
          if (isSolved()) finish();
        }, 120);
      }
    }
  }

  function handleCheck() {
    let wrong = 0;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 1 && !solution[r][c]) wrong++;
        else if (grid[r][c] === 0 && solution[r][c]) {
        } // empty not wrong yet
      }
    if (wrong === 0 && isSolved()) {
      showMessage('Pravilno! 🎉', 'success');
      finish();
    } else if (wrong > 0) {
      showMessage('Napačnih polnih: ' + wrong, 'error');
      // highlight wrong
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {}
      // simpler: iterate grid cells by position
      const allCells = Array.from(wrapperEl.querySelectorAll('.nono-cell'));
      let ptr = 0;
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++) {
          const el = allCells[ptr++];
          el.classList.remove('wrong', 'correct');
          if (grid[r][c] === 1 && !solution[r][c]) el.classList.add('wrong');
          else if (grid[r][c] === 1 && solution[r][c]) el.classList.add('correct');
        }
      setTimeout(() => {
        Array.from(wrapperEl.querySelectorAll('.nono-cell')).forEach(el => {
          el.classList.remove('wrong', 'correct');
        });
      }, 1500);
      errors += wrong;
    } else {
      // not yet wrong but not solved
      if (isSolved()) finish();
      else showMessage('Do sedaj pravilno, nadaljuj', 'info');
    }
  }

  function isSolved() {
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) {
        if (solution[r][c] && grid[r][c] !== 1) return false;
        if (!solution[r][c] && grid[r][c] === 1) return false;
      }
    return true;
  }

  function handleHint() {
    const candidates = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) {
        if (solution[r][c] && grid[r][c] !== 1) candidates.push([r, c]);
      }
    if (candidates.length === 0) {
      showMessage('Ni namigov', 'info');
      return;
    }
    const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
    grid[r][c] = 1;
    render();
    showMessage('Namig dodan', 'info');
    sounds.play('correct');
  }

  function handleSolve() {
    if (!confirm('Prikaži rešitev?')) return;
    grid = solution.map(row => row.map(v => (v ? 1 : 0)));
    render();
    stopTimer();
    showToast('Rešitev prikazana', 'info');
  }

  function showMessage(t, type = 'info') {
    showStageMessage(msgEl, t, { type, timeout: 1500 });
  }

  function finish() {
    stopTimer();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('nono-final-time').textContent = formatTime(elapsed);
    document.getElementById('nono-final-size').textContent = `${size}×${size}`;
    document.getElementById('nono-final-errors').textContent = String(errors);
    const base = size === 5 ? 20 : size === 10 ? 35 : 60;
    const xp = Math.max(10, base - Math.floor(elapsed / 60) * 2 - errors);

    finishGameEpilogue('nonogram', {
      record: { time: elapsed, size, errors, score: xp },
      xp,
      adaptive: { success: true, score: 1, metric: 'level' },
      sound: 'victory',
      confetti: { count: 24 },
    });

    showLayer(endScreen);
  }

  function updateModeBtns() {
    document.getElementById('nono-mode-fill')?.classList.toggle('active', mode === 'fill');
    document.getElementById('nono-mode-fill')?.classList.toggle('btn-outline', mode !== 'fill');
    document.getElementById('nono-mode-mark')?.classList.toggle('active', mode === 'mark');
    document.getElementById('nono-mode-mark')?.classList.toggle('btn-outline', mode !== 'mark');
    document.getElementById('nono-mode-erase')?.classList.toggle('active', mode === 'erase');
    document.getElementById('nono-mode-erase')?.classList.toggle('btn-outline', mode !== 'erase');
  }

  function startNewGame() {
    readSettings();
    generate();
    errors = 0;
    startTimer();
    render();
    if (msgEl) msgEl.textContent = '';
  }

  const endDrag = () => {
    isDragging = false;
    dragMode = null;
  };
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  document.getElementById('nono-start-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('nono-new-btn')?.addEventListener('click', () => {
    startNewGame();
  });
  document.getElementById('nono-retry-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('nono-mode-fill')?.addEventListener('click', () => {
    mode = 'fill';
    updateModeBtns();
  });
  document.getElementById('nono-mode-mark')?.addEventListener('click', () => {
    mode = 'mark';
    updateModeBtns();
  });
  document.getElementById('nono-mode-erase')?.addEventListener('click', () => {
    mode = 'erase';
    updateModeBtns();
  });
  document.getElementById('nono-check-btn')?.addEventListener('click', handleCheck);
  document.getElementById('nono-hint-btn')?.addEventListener('click', handleHint);
  document.getElementById('nono-solve-btn')?.addEventListener('click', handleSolve);

  showLayer(startScreen);
  readSettings();
  generate();
  render();

  return () => {
    stopTimer();
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
  };
}
