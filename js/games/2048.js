// js/games/2048.js — Združi ploščice (2048) – ES6 modul
// Popolna Cirulli arhitektura s trajnimi ID-ji, GPU transformacijami in brezhibnim UI/UX

import { sounds } from '../sounds.js';
import { showToast } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell, showGameLayer, finishGameEpilogue } from './game-layout.js';
import { bindGameSettings } from './game-settings-panel.js';
import { Settings } from '../store.js';
import {
  getAdaptiveDifficulty,
  isAdaptiveDisabled,
  renderAdaptiveSettingsPanel,
  bindAdaptiveEvents,
  setAdaptiveDifficulty,
} from '../adaptive-difficulty.js';

let nextTileId = 1;

class Tile {
  constructor(row, col, value = 2) {
    this.id = nextTileId++;
    this.row = row;
    this.col = col;
    this.value = value;
    this.previousPosition = null;
    this.mergedInto = null;
    this.isNew = true;
    this.isMerged = false;
  }

  savePosition() {
    this.previousPosition = { row: this.row, col: this.col };
  }

  updatePosition(row, col) {
    this.row = row;
    this.col = col;
  }

  serialize() {
    return {
      id: this.id,
      row: this.row,
      col: this.col,
      value: this.value,
    };
  }

  static deserialize(data) {
    const tile = new Tile(data.row, data.col, data.value);
    tile.id = data.id;
    tile.isNew = false;
    return tile;
  }
}

class Grid {
  constructor(size) {
    this.size = size;
    this.cells = this.empty();
  }

  empty() {
    const cells = [];
    for (let r = 0; r < this.size; r++) {
      const row = [];
      for (let c = 0; c < this.size; c++) {
        row.push(null);
      }
      cells.push(row);
    }
    return cells;
  }

  eachCell(callback) {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        callback(r, c, this.cells[r][c]);
      }
    }
  }

  availableCells() {
    const cells = [];
    this.eachCell((r, c, tile) => {
      if (!tile) cells.push({ row: r, col: c });
    });
    return cells;
  }

  randomAvailableCell() {
    const cells = this.availableCells();
    if (cells.length > 0) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
    return null;
  }

  cellAvailable(pos) {
    return !this.cellOccupied(pos);
  }

  cellOccupied(pos) {
    return !!this.cellContent(pos);
  }

  cellContent(pos) {
    if (this.withinBounds(pos)) {
      return this.cells[pos.row][pos.col];
    }
    return null;
  }

  insertTile(tile) {
    this.cells[tile.row][tile.col] = tile;
  }

  removeTile(tile) {
    this.cells[tile.row][tile.col] = null;
  }

  withinBounds(pos) {
    return pos.row >= 0 && pos.row < this.size && pos.col >= 0 && pos.col < this.size;
  }

  serialize() {
    const state = [];
    this.eachCell((r, c, tile) => {
      if (tile) state.push(tile.serialize());
    });
    return state;
  }
}

export function render2048() {
  const settingsHtml = `
    <div class="settings-row">
      <label class="form-label">Velikost mreže
        <select id="twfo-size" class="form-select">
          <option value="4" selected>4 × 4 (klasično)</option>
          <option value="5">5 × 5 (več prostora)</option>
          <option value="6">6 × 6 (izziv za mojstre)</option>
        </select>
      </label>
      <label class="form-label">Ciljna ploščica
        <select id="twfo-target" class="form-select">
          <option value="2048" selected>2048</option>
          <option value="4096">4096</option>
          <option value="8192">8192</option>
        </select>
      </label>
    </div>
${renderAdaptiveSettingsPanel('2048')}
  `;

  const actionsHtml = `
    <button id="twfo-undo-btn" type="button" class="icon-btn header-action-btn" title="Razveljavi (Ctrl+Z)" aria-label="Razveljavi" disabled>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
    </button>
    <button id="twfo-hint-btn" type="button" class="icon-btn header-action-btn" title="Namig" aria-label="Namig">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"></path></svg>
    </button>
    <button id="twfo-new-btn" type="button" class="icon-btn header-action-btn" title="Nova igra" aria-label="Nova igra">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
    </button>
  `;

  const stageHtml = `
    <div class="game-stage">
      <div id="twfo-start-screen" class="stage-layer">
        ${renderStartCard(
          'Združuj enake številke s potegi (puščice, WASD ali podrs). Doseži ciljno številko 2048!',
          'twfo-start-btn',
          '▶ Začni 2048',
          'Združi ploščice – 2048'
        )}
      </div>

      <div id="twfo-play-screen" class="stage-layer hidden">
        <div class="twfo-stage-container">
          <div class="twfo-topbar">
            <div class="twfo-score-box">
              <div class="twfo-score-pill">
                <span class="twfo-score-label">Točke</span>
                <span class="twfo-score-val" id="twfo-score">0</span>
              </div>
              <div class="twfo-score-pill">
                <span class="twfo-score-label">Najboljše</span>
                <span class="twfo-score-val" id="twfo-best">0</span>
              </div>
            </div>
          </div>
          <div id="twfo-board" class="twfo-board twfo-size-4" aria-label="Igralna plošča 2048" role="grid">
            <div class="twfo-grid" id="twfo-grid"></div>
            <div class="twfo-tile-layer" id="twfo-tile-layer"></div>
            <div id="twfo-overlay" class="twfo-board-overlay hidden">
              <div class="twfo-overlay-content">
                <div id="twfo-overlay-badge" class="twfo-overlay-badge">🎉</div>
                <h3 id="twfo-overlay-title" class="twfo-overlay-title">Bravo!</h3>
                <p id="twfo-overlay-desc" class="twfo-overlay-desc">Dosegel/a si cilj!</p>
                <div class="twfo-overlay-actions">
                  <button id="twfo-overlay-continue-btn" class="btn">Nadaljuj igro</button>
                  <button id="twfo-overlay-restart-btn" class="btn btn-outline">Igraj znova</button>
                  <button id="twfo-overlay-undo-btn" class="btn btn-outline hidden">↩ Razveljavi</button>
                </div>
              </div>
            </div>
          </div>

          <div id="twfo-msg" class="twfo-message"></div>

          <div class="twfo-dpad-wrap">
            <div class="twfo-dpad" aria-label="Smerne tipke">
              <span></span><button data-dir="up" aria-label="Gor">▲</button><span></span>
              <button data-dir="left" aria-label="Levo">◀</button><button data-dir="down" aria-label="Dol">▼</button><button data-dir="right" aria-label="Desno">▶</button>
            </div>
          </div>
        </div>
      </div>

      <div id="twfo-end-screen" class="stage-layer hidden">
        <div class="rc-victory-content game-dialog-box">
          <h3 id="twfo-end-title" class="result-title" style="font-size:1.25rem; margin-bottom:var(--spacing-xs);">Konec igre</h3>
          <p class="muted-xs MBXS">Točke: <strong id="twfo-final-score">0</strong> • Največja ploščica: <strong id="twfo-final-tile">0</strong></p>
          <p class="muted-xs mb-sm">Potez: <strong id="twfo-final-moves">0</strong></p>
          <button id="twfo-retry-btn" class="btn">Igraj znova</button>
          <button id="twfo-back-to-list" class="btn btn-outline ml-sm" data-action="back-to-list">← Seznam iger</button>
        </div>
      </div>
    </div>
  `;

  const infoHtml = `
    <h4 class="mb-sm">O igri 2048 – Združi ploščice</h4>
    <p class="mb-md">Mehanika združevanja ploščic temelji na klasični igri 2048 (Gabriele Cirulli, MIT). Ta izvedba prinaša <strong>popolno 60 fps strojno pospešeno animacijo, plavajoče točke, večstopenjsko razveljavitev ter podporo za podrsavanje z miško ali na dotik</strong>.</p>
    <h4 class="mb-sm">Pravila igre:</h4>
    <ul class="info-list">
      <li>Podrsaj po plošči, uporabi puščice ali tipke <strong>W, A, S, D</strong>.</li>
      <li>Vse ploščice zdrsnejo v izbrano smer.</li>
      <li>Dve ploščici z enako vrednostjo se ob trku združita v vsoto (2+2=4, 4+4=8 …).</li>
      <li>Po vsaki potezi se na praznem mestu pojavi nova ploščica (2 ali 4).</li>
      <li>Zmage dosežeš z ustvaritvijo ploščice <strong>2048</strong> (lahko nadaljuješ do 4096 ali 8192).</li>
    </ul>
    <p style="color:var(--color-text-muted); font-size:0.9em;">Strategija: Največjo ploščico ohranjaj v enem izmed kotov in gradite verigo padajočih vrednosti ob robu.</p>
  `;

  return renderGameShell({
    title: '2048 – Združi ploščice',
    subtitle: 'Logična sestavljanka združevanja številk.',
    settingsHtml,
    stageHtml,
    infoHtml,
    actionsHtml,
  });
}

export function init2048() {
  const startScreen = document.getElementById('twfo-start-screen');
  const playScreen = document.getElementById('twfo-play-screen');
  const endScreen = document.getElementById('twfo-end-screen');
  const boardEl = document.getElementById('twfo-board');
  const gridEl = document.getElementById('twfo-grid');
  const tileLayer = document.getElementById('twfo-tile-layer');
  const headerScore = document.getElementById('twfo-score');
  const headerBest = document.getElementById('twfo-best');
  const msgEl = document.getElementById('twfo-msg');
  const startBtn = document.getElementById('twfo-start-btn');
  const newBtn = document.getElementById('twfo-new-btn');
  const retryBtn = document.getElementById('twfo-retry-btn');
  const undoBtn = document.getElementById('twfo-undo-btn');
  const hintBtn = document.getElementById('twfo-hint-btn');
  const overlayEl = document.getElementById('twfo-overlay');
  const overlayBadge = document.getElementById('twfo-overlay-badge');
  const overlayTitle = document.getElementById('twfo-overlay-title');
  const overlayDesc = document.getElementById('twfo-overlay-desc');
  const overlayContinueBtn = document.getElementById('twfo-overlay-continue-btn');
  const overlayRestartBtn = document.getElementById('twfo-overlay-restart-btn');
  const overlayUndoBtn = document.getElementById('twfo-overlay-undo-btn');

  let size = 4;
  let target = 2048;
  let grid = new Grid(size);
  let score = 0;
  let bestScore = 0;
  let moves = 0;
  let bestTile = 0;
  let wonNotified = false;
  let keepPlaying = false;
  let isGameOver = false;
  let historyStack = []; // sklad za večstopenjski undo

  // DOM krmilnik ploščic
  const domTiles = new Map(); // id -> HTMLElement
  let pendingRemovalTimer = null;
  const pendingRemovals = new Set(); // ploščice za izbris po končani animaciji

  function readSettingsFromUI() {
    const sizeEl = document.getElementById('twfo-size');
    const targetEl = document.getElementById('twfo-target');
    const adaptive = getAdaptiveDifficulty('2048');
    if (adaptive && !isAdaptiveDisabled('2048')) {
      size = adaptive.value;
      if (sizeEl) sizeEl.value = String(size);
    } else if (sizeEl) {
      size = parseInt(sizeEl.value, 10) || 4;
    }
    if (targetEl) target = parseInt(targetEl.value, 10) || 2048;
  }

  bindGameSettings('2048', {
    defaults: { size: 4, target: 2048, bestScore: 0 },
    apply: async saved => {
      const savedSize = saved?.size ?? (await Settings.get('game.2048.size', 4));
      const savedTarget = saved?.target ?? (await Settings.get('game.2048.target', 2048));
      const savedBest = saved?.bestScore ?? (await Settings.get('game.2048.bestScore', 0));
      const adaptive = getAdaptiveDifficulty('2048');
      if (adaptive && !isAdaptiveDisabled('2048')) {
        size = adaptive.value;
      } else if (savedSize) {
        size = parseInt(savedSize, 10) || 4;
      }
      if (savedTarget) target = parseInt(savedTarget, 10) || 2048;
      if (savedBest) bestScore = parseInt(savedBest, 10) || 0;

      const sizeEl = document.getElementById('twfo-size');
      const targetEl = document.getElementById('twfo-target');
      if (sizeEl) sizeEl.value = String(size);
      if (targetEl) targetEl.value = String(target);
      updateScoreUI();
    },
    collect: () => ({ size, target, bestScore }),
    readFromUI: readSettingsFromUI,
    afterApply: () => {
      setAdaptiveDifficulty('2048', size);
      startNewGame();
      showLayer(playScreen);
    },
  });

  async function persistBestScore() {
    try {
      await Settings.set('game.2048.bestScore', bestScore);
      await Settings.set('game.2048', { size, target, bestScore });
    } catch {}
  }

  function showLayer(layer) {
    showGameLayer([startScreen, playScreen, endScreen], layer);
  }

  function updateScoreUI(gain = 0) {
    if (headerScore) headerScore.textContent = String(score);
    if (headerBest) headerBest.textContent = String(bestScore);

    if (gain > 0 && headerScore) {
      const anchor = headerScore.parentElement || headerScore;
      const floatEl = document.createElement('div');
      floatEl.className = 'twfo-score-float';
      floatEl.textContent = `+${gain}`;
      anchor.style.position = 'relative';
      anchor.appendChild(floatEl);
      setTimeout(() => floatEl.remove(), 650);
    }

    if (undoBtn) {
      undoBtn.disabled = historyStack.length === 0;
    }
  }

  function setupGridDOM() {
    if (!gridEl || !boardEl) return;
    boardEl.className = `twfo-board twfo-size-${size}`;
    gridEl.innerHTML = '';
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      cell.className = 'twfo-cell';
      gridEl.appendChild(cell);
    }
  }

  function flushPendingRemovals() {
    if (pendingRemovalTimer) {
      clearTimeout(pendingRemovalTimer);
      pendingRemovalTimer = null;
    }
    pendingRemovals.forEach(tile => {
      const el = domTiles.get(tile.id);
      if (el) {
        el.remove();
        domTiles.delete(tile.id);
      }
    });
    pendingRemovals.clear();
  }

  function clearAllTileDOM() {
    flushPendingRemovals();
    domTiles.forEach(el => el.remove());
    domTiles.clear();
    if (tileLayer) tileLayer.innerHTML = '';
  }

  function renderTiles(allTiles) {
    if (!tileLayer) return;
    flushPendingRemovals();

    const currentTiles = new Set();
    const toRemoveAfterAnim = [];

    allTiles.forEach(tile => {
      currentTiles.add(tile.id);
      let el = domTiles.get(tile.id);

      if (!el) {
        el = document.createElement('div');
        el.className = `twfo-tile v${tile.value}`;
        if (tile.value >= 10000) el.classList.add('d5');
        else if (tile.value >= 1000) el.classList.add('d4');
        else if (tile.value >= 100) el.classList.add('d3');

        el.textContent = String(tile.value);
        el.setAttribute('data-id', String(tile.id));
        el.setAttribute('aria-label', String(tile.value));

        if (tile.previousPosition) {
          el.style.setProperty('--col', tile.previousPosition.col);
          el.style.setProperty('--row', tile.previousPosition.row);
          tileLayer.appendChild(el);
          domTiles.set(tile.id, el);

          requestAnimationFrame(() => {
            el.style.setProperty('--col', tile.col);
            el.style.setProperty('--row', tile.row);
          });
        } else {
          el.style.setProperty('--col', tile.col);
          el.style.setProperty('--row', tile.row);
          if (tile.isNew) el.classList.add('twfo-tile-new');
          tileLayer.appendChild(el);
          domTiles.set(tile.id, el);
        }
      } else {
        // Obstoječa ploščica – zdrsi na nov položaj
        el.className = `twfo-tile v${tile.value}`;
        if (tile.value >= 10000) el.classList.add('d5');
        else if (tile.value >= 1000) el.classList.add('d4');
        else if (tile.value >= 100) el.classList.add('d3');
        el.textContent = String(tile.value);

        el.style.setProperty('--col', tile.col);
        el.style.setProperty('--row', tile.row);
      }

      if (tile.isMerged) {
        el.classList.add('twfo-tile-merged');
      }

      if (tile.mergedInto) {
        toRemoveAfterAnim.push(tile);
      }
    });

    // Očisti ploščice, ki niso več prisotne
    domTiles.forEach((el, id) => {
      if (!currentTiles.has(id)) {
        el.remove();
        domTiles.delete(id);
      }
    });

    // Odstrani združene ploščice po koncu zdrsa (110ms)
    if (toRemoveAfterAnim.length > 0) {
      toRemoveAfterAnim.forEach(t => pendingRemovals.add(t));
      pendingRemovalTimer = setTimeout(() => {
        pendingRemovals.forEach(t => {
          const el = domTiles.get(t.id);
          if (el) {
            el.remove();
            domTiles.delete(t.id);
          }
        });
        pendingRemovals.clear();
        pendingRemovalTimer = null;
      }, 110);
    }
  }

  function addRandomTile() {
    const pos = grid.randomAvailableCell();
    if (pos) {
      const val = Math.random() < 0.9 ? 2 : 4;
      const tile = new Tile(pos.row, pos.col, val);
      grid.insertTile(tile);
      return tile;
    }
    return null;
  }

  function getVector(dir) {
    const map = {
      up: { row: -1, col: 0 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
      right: { row: 0, col: 1 },
    };
    return map[dir];
  }

  function buildTraversals(vector) {
    const rows = [];
    const cols = [];
    for (let i = 0; i < size; i++) {
      rows.push(i);
      cols.push(i);
    }
    if (vector.row === 1) rows.reverse();
    if (vector.col === 1) cols.reverse();
    return { rows, cols };
  }

  function findFarthestPosition(cell, vector) {
    let previous;
    let current = { row: cell.row, col: cell.col };
    do {
      previous = current;
      current = { row: previous.row + vector.row, col: previous.col + vector.col };
    } while (grid.withinBounds(current) && grid.cellAvailable(current));

    return {
      farthest: previous,
      next: current,
    };
  }

  function movesAvailable() {
    if (grid.availableCells().length > 0) return true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tile = grid.cellContent({ row: r, col: c });
        if (tile) {
          const dirs = [
            { row: 1, col: 0 },
            { row: 0, col: 1 },
          ];
          for (const d of dirs) {
            const next = { row: r + d.row, col: c + d.col };
            const other = grid.cellContent(next);
            if (other && other.value === tile.value) return true;
          }
        }
      }
    }
    return false;
  }

  function saveStateToHistory(state) {
    historyStack.push(state);
    if (historyStack.length > 10) historyStack.shift();
    if (undoBtn) undoBtn.disabled = false;
  }

  function handleUndo() {
    if (historyStack.length === 0) {
      showToast('Ni poteze za razveljavitev.', { type: 'info' });
      return;
    }
    const prev = historyStack.pop();
    score = prev.score;
    moves = prev.moves;
    bestTile = prev.bestTile;
    wonNotified = prev.wonNotified;
    keepPlaying = prev.keepPlaying;
    isGameOver = false;

    clearAllTileDOM();
    grid = new Grid(size);
    const restoredTiles = [];
    prev.tiles.forEach(data => {
      const tile = Tile.deserialize(data);
      grid.insertTile(tile);
      restoredTiles.push(tile);
    });

    renderTiles(restoredTiles);
    updateScoreUI();
    hideOverlay();
    if (msgEl) {
      msgEl.textContent = 'Poteza razveljavljena.';
      msgEl.className = 'twfo-message';
    }
    sounds.play('click');
  }

  function showOverlay({ badge, title, desc, canContinue, canUndo }) {
    if (!overlayEl) return;
    if (overlayBadge) overlayBadge.textContent = badge;
    if (overlayTitle) overlayTitle.textContent = title;
    if (overlayDesc) overlayDesc.textContent = desc;
    if (overlayContinueBtn) {
      overlayContinueBtn.classList.toggle('hidden', !canContinue);
    }
    if (overlayUndoBtn) {
      overlayUndoBtn.classList.toggle('hidden', !canUndo);
    }
    overlayEl.classList.remove('hidden');
  }

  function hideOverlay() {
    if (overlayEl) overlayEl.classList.add('hidden');
  }

  function playMergeSound(val) {
    try {
      const freq = 340 + Math.min(12, Math.log2(val)) * 75;
      sounds.playTone(freq, 'sine', 0.12, 0.08);
      if (navigator.vibrate) navigator.vibrate(12);
    } catch {
      sounds.play('click');
    }
  }

  function move(dir) {
    if (isGameOver) return false;
    const vector = getVector(dir);
    if (!vector) return false;

    const traversals = buildTraversals(vector);
    let moved = false;
    let scoreGain = 0;
    let highestMerge = 0;

    // Shrani prejšnje položaje vseh ploščic in pobriši stare oznake
    grid.eachCell((r, c, tile) => {
      if (tile) {
        tile.savePosition();
        tile.isNew = false;
        tile.isMerged = false;
        tile.mergedInto = null;
      }
    });

    // Pred premikom shrani stanje za možnost razveljavitve
    const preMoveState = {
      tiles: grid.serialize(),
      score,
      moves,
      bestTile,
      wonNotified,
      keepPlaying,
    };

    const movingAndMergedTiles = [];

    traversals.rows.forEach(r => {
      traversals.cols.forEach(c => {
        const tile = grid.cellContent({ row: r, col: c });
        if (tile) {
          movingAndMergedTiles.push(tile);
          const positions = findFarthestPosition({ row: r, col: c }, vector);
          const nextTile = grid.cellContent(positions.next);

          if (nextTile && nextTile.value === tile.value && !nextTile.mergedInto) {
            const merged = new Tile(positions.next.row, positions.next.col, tile.value * 2);
            merged.isNew = false;
            merged.isMerged = true;
            tile.mergedInto = merged;
            nextTile.mergedInto = merged;

            grid.insertTile(merged);
            grid.removeTile(tile);
            tile.updatePosition(positions.next.row, positions.next.col);

            movingAndMergedTiles.push(merged);
            scoreGain += merged.value;
            if (merged.value > highestMerge) highestMerge = merged.value;
            if (merged.value > bestTile) bestTile = merged.value;
            moved = true;
          } else {
            if (positions.farthest.row !== r || positions.farthest.col !== c) {
              grid.removeTile(tile);
              tile.updatePosition(positions.farthest.row, positions.farthest.col);
              grid.insertTile(tile);
              moved = true;
            }
          }
        }
      });
    });

    if (moved) {
      saveStateToHistory(preMoveState);

      score += scoreGain;
      if (score > bestScore) {
        bestScore = score;
        persistBestScore();
      }
      moves++;

      const newTile = addRandomTile();
      if (newTile) movingAndMergedTiles.push(newTile);

      renderTiles(movingAndMergedTiles);
      updateScoreUI(scoreGain);

      if (scoreGain > 0) {
        playMergeSound(highestMerge);
      } else {
        sounds.play('click');
      }

      checkGameStatus();
      return true;
    }

    return false;
  }

  function checkGameStatus() {
    // Preveri zmago
    if (!wonNotified && !keepPlaying && bestTile >= target) {
      wonNotified = true;
      showOverlay({
        badge: '🎉',
        title: `Dosegel/a si ${target}!`,
        desc: 'Čestitke za zmago! Želiš nadaljevati igro za še višji rezultat?',
        canContinue: true,
        canUndo: false,
      });
      showToast(`Čestitke! Dosegel/a si ${target} 🎉`, { type: 'success' });
      finishGameEpilogue('2048', {
        record: { score, bestTile, size, target, moves, won: true },
        xp: 50 + Math.floor(score / 100),
        adaptive: { success: true, score: 1, metric: 'level' },
        sound: 'victory',
        confetti: { count: 35 },
      });
      return;
    }

    // Preveri konec igre
    if (!movesAvailable()) {
      isGameOver = true;
      sounds.play('error');
      showOverlay({
        badge: '🏁',
        title: 'Konec igre!',
        desc: `Ni več možnih potez. Končne točke: ${score}.`,
        canContinue: false,
        canUndo: historyStack.length > 0,
      });

      // Posodobi še končni zaslon za statistiko/fallback
      const finalScoreEl = document.getElementById('twfo-final-score');
      const finalTileEl = document.getElementById('twfo-final-tile');
      const finalMovesEl = document.getElementById('twfo-final-moves');
      const titleEl = document.getElementById('twfo-end-title');
      if (finalScoreEl) finalScoreEl.textContent = String(score);
      if (finalTileEl) finalTileEl.textContent = String(bestTile);
      if (finalMovesEl) finalMovesEl.textContent = String(moves);
      if (titleEl)
        titleEl.textContent = wonNotified ? `Odlično – ploščica ${bestTile}!` : 'Konec igre';

      finishGameEpilogue('2048', {
        record: { score, bestTile, size, target, moves, won: wonNotified },
        xp: Math.max(5, Math.floor(score / 120)),
        adaptive: {
          success: !!wonNotified,
          score: wonNotified ? 1 : 0,
          metric: 'level',
        },
      });
    }
  }

  async function startNewGame() {
    await readSettingsFromUI();
    clearAllTileDOM();
    setupGridDOM();

    grid = new Grid(size);
    score = 0;
    moves = 0;
    bestTile = 0;
    wonNotified = false;
    keepPlaying = false;
    isGameOver = false;
    historyStack = [];

    hideOverlay();
    if (msgEl) {
      msgEl.textContent = '';
      msgEl.className = 'twfo-message';
    }

    const t1 = addRandomTile();
    const t2 = addRandomTile();
    const initial = [];
    if (t1) initial.push(t1);
    if (t2) initial.push(t2);
    renderTiles(initial);
    updateScoreUI();
  }

  function giveHint() {
    const dirs = ['up', 'right', 'down', 'left'];
    let bestDir = null;
    let bestHeuristic = -1;

    for (const d of dirs) {
      const vector = getVector(d);
      const traversals = buildTraversals(vector);
      let canMove = false;
      let gain = 0;

      // Simulacija premika na kopiji
      const copyCells = [];
      for (let r = 0; r < size; r++) {
        copyCells[r] = [];
        for (let c = 0; c < size; c++) {
          const t = grid.cells[r][c];
          copyCells[r][c] = t ? { value: t.value } : null;
        }
      }

      traversals.rows.forEach(r => {
        traversals.cols.forEach(c => {
          const val = copyCells[r][c];
          if (val) {
            let prev = { row: r, col: c };
            let curr = { row: r + vector.row, col: c + vector.col };
            while (
              curr.row >= 0 &&
              curr.row < size &&
              curr.col >= 0 &&
              curr.col < size &&
              !copyCells[curr.row][curr.col]
            ) {
              prev = curr;
              curr = { row: prev.row + vector.row, col: prev.col + vector.col };
            }
            if (
              curr.row >= 0 &&
              curr.row < size &&
              curr.col >= 0 &&
              curr.col < size &&
              copyCells[curr.row][curr.col] &&
              copyCells[curr.row][curr.col].value === val.value &&
              !copyCells[curr.row][curr.col].merged
            ) {
              copyCells[curr.row][curr.col] = { value: val.value * 2, merged: true };
              copyCells[r][c] = null;
              gain += val.value * 2;
              canMove = true;
            } else if (prev.row !== r || prev.col !== c) {
              copyCells[prev.row][prev.col] = val;
              copyCells[r][c] = null;
              canMove = true;
            }
          }
        });
      });

      if (canMove) {
        let emptyCount = 0;
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (!copyCells[r][c]) emptyCount++;
          }
        }
        const heuristic = gain * 2 + emptyCount * 4;
        if (heuristic > bestHeuristic) {
          bestHeuristic = heuristic;
          bestDir = d;
        }
      }
    }

    if (bestDir) {
      const labels = { up: 'GOR ▲', down: 'DOL ▼', left: 'LEVO ◀', right: 'DESNO ▶' };
      showToast(`💡 Poskusi: ${labels[bestDir]}`, { type: 'info' });
    } else {
      showToast('Ni očitne boljše poteze.', { type: 'info' });
    }
  }

  // --- Krmiljenje (Tipkovnica, Touch, Miška, D-pad) ---

  function onKey(e) {
    if (playScreen.classList.contains('hidden')) return;
    const key = e.key.toLowerCase();
    let dir = null;
    if (key === 'arrowup' || key === 'w') dir = 'up';
    else if (key === 'arrowdown' || key === 's') dir = 'down';
    else if (key === 'arrowleft' || key === 'a') dir = 'left';
    else if (key === 'arrowright' || key === 'd') dir = 'right';
    else if (key === 'u' || (e.ctrlKey && key === 'z')) {
      e.preventDefault();
      handleUndo();
      return;
    }

    if (dir) {
      e.preventDefault();
      move(dir);
    }
  }

  // Touch & Pointer geste
  let pointerStart = null;
  let pointerMoved = false;

  function onPointerDown(e) {
    pointerStart = { x: e.clientX, y: e.clientY };
    pointerMoved = false;
  }

  function onPointerMove(e) {
    if (!pointerStart || pointerMoved) return;
    const dx = e.clientX - pointerStart.x;
    const dy = e.clientY - pointerStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) >= 28) {
      pointerMoved = true;
      pointerStart = null;
      const dir = absX > absY ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      move(dir);
    }
  }

  function onPointerEnd() {
    pointerStart = null;
    pointerMoved = false;
  }

  function bindBoardGestures() {
    if (!boardEl) return;
    boardEl.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });

    // Prepreči skrolanje brskalnika med potegom po plošči
    boardEl.addEventListener(
      'touchmove',
      e => {
        if (playScreen && !playScreen.classList.contains('hidden')) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  function onDpadClick(e) {
    const btn = e.target.closest('button[data-dir]');
    if (!btn) return;
    const dir = btn.dataset.dir;
    if (dir) move(dir);
  }

  // Povezava gumbov
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  }

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      startNewGame();
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  }

  if (undoBtn) undoBtn.addEventListener('click', handleUndo);
  if (hintBtn) hintBtn.addEventListener('click', giveHint);

  if (overlayContinueBtn) {
    overlayContinueBtn.addEventListener('click', () => {
      keepPlaying = true;
      hideOverlay();
    });
  }

  if (overlayRestartBtn) {
    overlayRestartBtn.addEventListener('click', () => {
      startNewGame();
    });
  }

  if (overlayUndoBtn) {
    overlayUndoBtn.addEventListener('click', () => {
      handleUndo();
    });
  }

  document.addEventListener('keydown', onKey);
  bindBoardGestures();
  document.querySelector('.twfo-dpad')?.addEventListener('click', onDpadClick);

  // Med spreminjanjem velikosti okna ploščice ne započujejo transformov (brez zamika za grid reflowom)
  let resizeTimer = null;
  let resizeObserver = null;
  const pauseTileAnim = () => {
    if (!boardEl) return;
    boardEl.classList.add('twfo-resizing');
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => boardEl && boardEl.classList.remove('twfo-resizing'), 150);
  };
  if (typeof ResizeObserver !== 'undefined' && boardEl) {
    resizeObserver = new ResizeObserver(pauseTileAnim);
    resizeObserver.observe(boardEl);
  } else {
    window.addEventListener('resize', pauseTileAnim);
  }

  // Začetni prikaz
  showLayer(startScreen);
  setupGridDOM();
  updateScoreUI();
  bindAdaptiveEvents('2048');

  return () => {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerEnd);
    window.removeEventListener('pointercancel', onPointerEnd);
    if (resizeTimer) clearTimeout(resizeTimer);
    if (resizeObserver) resizeObserver.disconnect();
    flushPendingRemovals();
  };
}
