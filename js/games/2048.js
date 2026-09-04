// js/games/2048.js — Združi ploščice (2048) – ES6 modul
// Legal: mehanika navdihnjena z 2048 (MIT by Gabriele Cirulli), lastna izvedba, slovenski UI
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { Settings } from '../store.js';

export function render2048() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Velikost mreže
                <select id="twfo-size" class="form-select">
                    <option value="4" selected>4 × 4 (klasično)</option>
                    <option value="5">5 × 5 (več prostora)</option>
                    <option value="6">6 × 6 (izzyw za strokovnjake)</option>
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
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="twfo-start-screen" class="stage-layer">
                ${renderStartCard(
                  'Združuj enake številke s potegi. Dve enaki ploščici se združita v vsoto. Doseži ciljno številko!',
                  'twfo-start-btn',
                  '▶ Začni 2048',
                  'Združi ploščice – 2048'
                )}
            </div>

            <div id="twfo-play-screen" class="stage-layer hidden">
                <div class="twfo-stage-container">
                    <div class="twfo-topbar">
                        <div class="twfo-score-box">
                            <div class="twfo-score-pill"><span class="twfo-score-label">Točke</span><span class="twfo-score-val" id="twfo-score">0</span></div>
                            <div class="twfo-score-pill"><span class="twfo-score-label">Najboljše</span><span class="twfo-score-val" id="twfo-best">0</span></div>
                        </div>
                        <button id="twfo-new-btn" class="btn btn-outline" style="padding:0.45rem 0.9rem; font-size:0.85rem;">↺ Nova igra</button>
                    </div>

                    <div id="twfo-board" class="twfo-board size-4" aria-label="Igralna plošča 2048" role="grid"></div>

                    <div id="twfo-msg" class="twfo-message"></div>

                    <div class="twfo-controls">
                        <div class="twfo-dpad" aria-label="Smerne tipke">
                            <span></span><button data-dir="up" aria-label="Gor">▲</button><span></span>
                            <button data-dir="left" aria-label="Levo">◀</button><button data-dir="down" aria-label="Dol">▼</button><button data-dir="right" aria-label="Desno">▶</button>
                        </div>
                        <div class="twfo-actions">
                            <button id="twfo-undo-btn" class="btn btn-outline" style="padding:0.45rem 0.8rem; font-size:0.85rem;">↩ Razveljavi</button>
                            <button id="twfo-hint-btn" class="btn btn-outline" style="padding:0.45rem 0.8rem; font-size:0.85rem;">💡 Nasvet</button>
                        </div>
                    </div>

                    <p class="muted-xs" style="text-align:center; font-size:0.82rem;">Namig: uporabi puščice / WASD ali podrsaj po plošči. Na telefonu tapni smerne gumbe.</p>
                </div>
            </div>

            <div id="twfo-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align:center; max-width:380px; width:90%; background:var(--color-surface); border:1px solid var(--color-border); padding:var(--spacing-md); border-radius:var(--border-radius); box-shadow:0 10px 25px rgba(0,0,0,0.05);">
                    <h3 id="twfo-end-title" class="result-title" style="font-size:1.25rem; margin-bottom:var(--spacing-xs);">Konec igre</h3>
                    <p class="muted-xs" style="margin-bottom:var(--spacing-xs);">Točke: <strong id="twfo-final-score">0</strong> • Največja ploščica: <strong id="twfo-final-tile">0</strong></p>
                    <p class="muted-xs" style="margin-bottom:var(--spacing-sm);">Potez: <strong id="twfo-final-moves">0</strong></p>
                    <button id="twfo-retry-btn" class="btn">Igraj znova</button>
                    <button id="twfo-back-to-list" class="btn btn-outline" style="margin-left:8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 style="margin-bottom:8px;">O igri 2048 – Združi ploščice</h4>
        <p style="margin-bottom:12px;">Izvirnik 2048 je ustvaril Gabriele Cirulli (MIT licenca, 2014). Mehanika združevanja ploščic je prosto dostopna; ta izvedba je <strong>lastna koda z originalno grafiko in slovenskim vmesnikom</strong>.</p>
        <h4 style="margin-bottom:8px;">Pravila:</h4>
        <ul style="margin-bottom:12px; padding-left:20px; line-height:1.6;">
            <li>Podrsaj / pritisni puščico – vse ploščice zdrsnejo v to smer.</li>
            <li>Dve enaki sosednji ploščici se združita v vsoto (2+2=4, 4+4=8 …).</li>
            <li>Po vsaki potezi se pojavi nova ploščica (2 ali 4).</li>
            <li>Cilj: ustvari ploščico <strong>2048</strong> (v nastavitvah lahko 4096/8192). Lahko igraš naprej tudi po zmagi.</li>
            <li>Igra se konča, ko ni več prostih polj in ni možnih združitev.</li>
        </ul>
        <p style="color:var(--color-text-muted); font-size:0.9em;">Nasvet: drži največjo ploščico v kotu in gradi verigo padajočih vrednosti.</p>
    `;

  return renderGameShell({
    title: '2048 – Združi ploščice',
    subtitle: 'Logična sestavljanka združevanja.',
    statusHtml:
      '<span>Točke: <strong id="twfo-header-score">0</strong></span><span>Rekord: <strong id="twfo-header-best">0</strong></span>',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function init2048() {
  const startScreen = document.getElementById('twfo-start-screen');
  const playScreen = document.getElementById('twfo-play-screen');
  const endScreen = document.getElementById('twfo-end-screen');
  const boardEl = document.getElementById('twfo-board');
  const scoreEl = document.getElementById('twfo-score');
  const bestEl = document.getElementById('twfo-best');
  const headerScore = document.getElementById('twfo-header-score');
  const headerBest = document.getElementById('twfo-header-best');
  const msgEl = document.getElementById('twfo-msg');
  const startBtn = document.getElementById('twfo-start-btn');
  const newBtn = document.getElementById('twfo-new-btn');
  const retryBtn = document.getElementById('twfo-retry-btn');
  const undoBtn = document.getElementById('twfo-undo-btn');
  const hintBtn = document.getElementById('twfo-hint-btn');

  let size = 4;
  let target = 2048;
  let grid = [];
  let score = 0;
  let bestScore = 0;
  let moves = 0;
  let bestTile = 0;
  let history = null; // {grid, score, moves, bestTile}
  let wonNotified = false;
  let gameOver = false;
  let touchStart = null;

  // Naloži shranjene nastavitve in rekord
  (async () => {
    try {
      const savedSize = await Settings.get('game.2048.size', 4);
      const savedTarget = await Settings.get('game.2048.target', 2048);
      const savedBest = await Settings.get('game.2048.bestScore', 0);
      if (savedSize) size = parseInt(savedSize, 10) || 4;
      if (savedTarget) target = parseInt(savedTarget, 10) || 2048;
      if (savedBest) bestScore = parseInt(savedBest, 10) || 0;
      const sizeEl = document.getElementById('twfo-size');
      const targetEl = document.getElementById('twfo-target');
      if (sizeEl) sizeEl.value = String(size);
      if (targetEl) targetEl.value = String(target);
      updateScoreUI();
    } catch {}
  })();

  async function persistSettings() {
    try {
      await Settings.set('game.2048.size', size);
      await Settings.set('game.2048.target', target);
      await Settings.set('game.2048.bestScore', bestScore);
    } catch {}
  }

  function readSettingsFromUI() {
    const sizeEl = document.getElementById('twfo-size');
    const targetEl = document.getElementById('twfo-target');
    if (sizeEl) size = parseInt(sizeEl.value, 10) || 4;
    if (targetEl) target = parseInt(targetEl.value, 10) || 2048;
    persistSettings();
  }

  setGameSettingsApplyHandler(() => {
    readSettingsFromUI();
    startNewGame();
    showLayer(playScreen);
  });

  function showLayer(layer) {
    [startScreen, playScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (layer) layer.classList.remove('hidden');
  }

  function updateScoreUI() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (headerScore) headerScore.textContent = String(score);
    if (bestEl) bestEl.textContent = String(bestScore);
    if (headerBest) headerBest.textContent = String(bestScore);
  }

  function createEmptyGrid() {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function cloneGrid(g) {
    return g.map(row => [...row]);
  }

  function getEmptyCells() {
    const cells = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (grid[r][c] === 0) cells.push([r, c]);
    return cells;
  }

  let tileElements = new Map(); // key -> {element, r, c, val}
  let lastNewTileKeys = new Set(); // sledi novim ploščicam za animacijo
  let renderGeneration = 0;

  function addRandomTile() {
    const empties = getEmptyCells();
    if (empties.length === 0) return false;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    lastNewTileKeys = new Set([`${r},${c}`]);
    return true;
  }

  // FLIP animation helper
  function animateTiles(mergedPositions = new Set()) {
    const currentRenderGeneration = ++renderGeneration;
    const animateNewTiles = tileElements.size > 0;
    const boardRect = boardEl.getBoundingClientRect();
    const cells = Array.from(boardEl.querySelectorAll('.twfo-cell'));
    const tileLayer = boardEl.querySelector('.twfo-tile-layer');

    const positionTile = (tile, row, column) => {
      const cell = cells[row * size + column];
      if (!cell) return;
      tile.style.left = `${cell.offsetLeft - tileLayer.offsetLeft}px`;
      tile.style.top = `${cell.offsetTop - tileLayer.offsetTop}px`;
      tile.style.width = `${cell.offsetWidth}px`;
      tile.style.height = `${cell.offsetHeight}px`;
    };

    // First: measure current positions (First)
    const firstPositions = new Map();
    const previousTiles = Array.from(tileElements.values());
    previousTiles.forEach(tileData => {
      const rect = tileData.element.getBoundingClientRect();
      firstPositions.set(tileData.element, {
        x: rect.left - boardRect.left,
        y: rect.top - boardRect.top,
        val: tileData.val,
      });
    });

    // Update grid data already done in move()
    // Now render/update DOM to match new grid (Last)
    const newTileElements = new Map();
    const usedPreviousTiles = new Set();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        const key = `${r},${c}`;
        const isNew = lastNewTileKeys.has(key);
        const isMerged = mergedPositions.has(key);

        if (val !== 0) {
          let tileData = null;
          if (!isNew && !isMerged) {
            tileData =
              previousTiles
                .filter(previous => !usedPreviousTiles.has(previous) && previous.val === val)
                .sort((a, b) => {
                  const distanceA = Math.abs(a.r - r) + Math.abs(a.c - c);
                  const distanceB = Math.abs(b.r - r) + Math.abs(b.c - c);
                  return distanceA - distanceB;
                })[0] || null;
          }

          if (!tileData) {
            // Create new tile
            const tile = document.createElement('div');
            const extra = isMerged ? ' merged' : ' new';
            tile.className = `twfo-tile v${val}${extra}`;
            tile.textContent = String(val);
            tile.setAttribute('aria-label', String(val));
            tileLayer.appendChild(tile);
            positionTile(tile, r, c);
            newTileElements.set(key, { element: tile, r, c, val });
          } else {
            // Move existing tile to new cell
            const mergedExtra = mergedPositions.has(key) ? ' merged' : '';
            const movedExtra = tileData.r !== r || tileData.c !== c ? ' moved' : '';
            tileData.element.className = `twfo-tile v${val}${mergedExtra}${movedExtra}`;
            tileData.element.textContent = String(val);
            tileLayer.appendChild(tileData.element);
            positionTile(tileData.element, r, c);
            usedPreviousTiles.add(tileData);
            tileData.r = r;
            tileData.c = c;
            tileData.val = val;
            newTileElements.set(key, tileData);
          }
        }
      }
    }

    // Clean up removed tiles
    previousTiles.forEach(tileData => {
      if (!usedPreviousTiles.has(tileData)) {
        tileData.element.remove();
      }
    });

    tileElements = newTileElements;

    // Now animate: measure Last positions and apply FLIP
    requestAnimationFrame(() => {
      if (currentRenderGeneration !== renderGeneration) return;
      tileElements.forEach((tileData, key) => {
        const rect = tileData.element.getBoundingClientRect();
        const lastX = rect.left - boardRect.left;
        const lastY = rect.top - boardRect.top;
        const first = firstPositions.get(tileData.element);
        let wasMoved = false;

        if (first) {
          const dx = first.x - lastX;
          const dy = first.y - lastY;

          if (dx !== 0 || dy !== 0) {
            wasMoved = true;
            tileData.element.animate(
              [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
              {
                duration: 280,
                easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                fill: 'both',
              }
            );
          }
        }

        // Handle new/merged animations
        const isMerged = mergedPositions.has(key);

        if (isMerged) {
          const showMergeAnimation = () => {
            tileData.element.classList.add('merged');
            tileData.element.classList.remove('new', 'moved');
            setTimeout(() => tileData.element.classList.remove('merged'), 180);
          };
          if (wasMoved) setTimeout(showMergeAnimation, 150);
          else showMergeAnimation();
        } else if (animateNewTiles && lastNewTileKeys.has(key)) {
          tileData.element.classList.add('new');
          setTimeout(() => tileData.element.classList.remove('new'), 200);
        }
      });

      lastNewTileKeys.clear();
    });
  }

  function renderBoard(mergedPositions = new Set()) {
    if (!boardEl) return;
    boardEl.className = `twfo-board size-${size}`;
    // Initialize board structure once
    if (boardEl.children.length === 0) {
      boardEl.innerHTML = '';
      boardEl.setAttribute('aria-rowcount', String(size));
      boardEl.setAttribute('aria-colcount', String(size));
      for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'twfo-cell';
        cell.setAttribute('role', 'gridcell');
        boardEl.appendChild(cell);
      }
      const tileLayer = document.createElement('div');
      tileLayer.className = 'twfo-tile-layer';
      tileLayer.setAttribute('aria-hidden', 'true');
      boardEl.appendChild(tileLayer);
    }

    animateTiles(mergedPositions);

    // Update score UI
    let maxTile = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] > maxTile) maxTile = grid[r][c];
      }
    }
    bestTile = maxTile;
    updateScoreUI();
    if (undoBtn) undoBtn.disabled = !history;
  }

  function slideAndMergeRow(row) {
    const filtered = row.filter(v => v !== 0);
    const merged = [];
    const mergedFlags = [];
    let scoreGain = 0;
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const nv = filtered[i] * 2;
        merged.push(nv);
        mergedFlags.push(true);
        scoreGain += nv;
        i += 2;
      } else {
        merged.push(filtered[i]);
        mergedFlags.push(false);
        i += 1;
      }
    }
    while (merged.length < size) {
      merged.push(0);
      mergedFlags.push(false);
    }
    return { row: merged, flags: mergedFlags, gain: scoreGain };
  }

  function movesAvailable() {
    if (getEmptyCells().length > 0) return true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const v = grid[r][c];
        if (c + 1 < size && grid[r][c + 1] === v) return true;
        if (r + 1 < size && grid[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  function saveHistory() {
    history = { grid: cloneGrid(grid), score, moves, bestTile, wonNotified };
  }

  function move(dir) {
    if (gameOver) return false;
    const before = JSON.stringify(grid);
    const beforeScore = score;
    let totalGain = 0;
    const mergedPos = new Set();

    if (dir === 'left') {
      for (let r = 0; r < size; r++) {
        const { row, flags, gain } = slideAndMergeRow(grid[r]);
        grid[r] = row;
        totalGain += gain;
        row.forEach((v, c) => {
          if (flags[c] && v !== 0) mergedPos.add(`${r},${c}`);
        });
      }
    } else if (dir === 'right') {
      for (let r = 0; r < size; r++) {
        const rev = [...grid[r]].reverse();
        const { row, flags, gain } = slideAndMergeRow(rev);
        const restored = [...row].reverse();
        const restoredFlags = [...flags].reverse();
        grid[r] = restored;
        totalGain += gain;
        restored.forEach((v, c) => {
          if (restoredFlags[c] && v !== 0) mergedPos.add(`${r},${c}`);
        });
      }
    } else if (dir === 'up') {
      for (let c = 0; c < size; c++) {
        const col = grid.map(row => row[c]);
        const { row, flags, gain } = slideAndMergeRow(col);
        totalGain += gain;
        for (let r = 0; r < size; r++) {
          grid[r][c] = row[r];
          if (flags[r] && row[r] !== 0) mergedPos.add(`${r},${c}`);
        }
      }
    } else if (dir === 'down') {
      for (let c = 0; c < size; c++) {
        const col = grid.map(row => row[c]).reverse();
        const { row, flags, gain } = slideAndMergeRow(col);
        totalGain += gain;
        const restored = [...row].reverse();
        const restoredFlags = [...flags].reverse();
        for (let r = 0; r < size; r++) {
          grid[r][c] = restored[r];
          if (restoredFlags[r] && restored[r] !== 0) mergedPos.add(`${r},${c}`);
        }
      }
    }

    const after = JSON.stringify(grid);
    if (before === after) return false;

    score += totalGain;
    if (score > bestScore) {
      bestScore = score;
      persistSettings();
    }
    moves++;
    addRandomTile();
    renderBoard(mergedPos);
    if (totalGain > 0) sounds.play('correct');
    else sounds.play('click');
    checkWinOrOver();
    updateScoreUI();
    return true;
  }

  function checkWinOrOver() {
    if (!wonNotified && bestTile >= target) {
      wonNotified = true;
      if (msgEl) {
        msgEl.textContent = `🎉 Dosegel/a si ${target}! Lahko nadaljuješ do ${target * 2}.`;
        msgEl.className = 'twfo-message win';
      }
      showToast(`Čestitke! Dosegel/a si ${target} 🎉`, { type: 'success' });
      showConfetti({ count: 28 });
      sounds.play('victory');
      statsManager.addXp(50 + Math.floor(score / 100));
      statsManager.saveRecord('2048', { score, bestTile, size, target, moves, won: true });
      if (!movesAvailable()) {
        /* still not over, continue */
      }
      return;
    }
    if (!movesAvailable()) {
      gameOver = true;
      if (msgEl) {
        msgEl.textContent = 'Konec igre – ni več potez!';
        msgEl.className = 'twfo-message over';
      }
      sounds.play('error');
      showToast('Konec igre – poskusi znova!', { type: 'error' });
      const finalScoreEl = document.getElementById('twfo-final-score');
      const finalTileEl = document.getElementById('twfo-final-tile');
      const finalMovesEl = document.getElementById('twfo-final-moves');
      const titleEl = document.getElementById('twfo-end-title');
      if (finalScoreEl) finalScoreEl.textContent = String(score);
      if (finalTileEl) finalTileEl.textContent = String(bestTile);
      if (finalMovesEl) finalMovesEl.textContent = String(moves);
      if (titleEl)
        titleEl.textContent = wonNotified ? `Bravo – dosegel/a si ${bestTile}!` : 'Konec igre';
      // delay show end screen slightly to see board
      setTimeout(() => showLayer(endScreen), 800);
      statsManager.addXp(Math.max(5, Math.floor(score / 120)));
      statsManager.saveRecord('2048', { score, bestTile, size, target, moves, won: wonNotified });
    }
  }

  function startNewGame() {
    readSettingsFromUI();
    renderGeneration += 1;
    tileElements.forEach(tileData => {
      tileData.element.getAnimations().forEach(animation => animation.cancel());
      tileData.element.remove();
    });
    tileElements = new Map();
    lastNewTileKeys.clear();
    grid = createEmptyGrid();
    score = 0;
    moves = 0;
    wonNotified = false;
    gameOver = false;
    history = null;
    if (msgEl) {
      msgEl.textContent = '';
      msgEl.className = 'twfo-message';
    }
    addRandomTile();
    addRandomTile();
    lastNewTileKeys.clear();
    requestAnimationFrame(() => {
      if (!gameOver) {
        renderBoard();
        updateScoreUI();
      }
    });
  }

  function handleUndo() {
    if (!history) {
      showToast('Ni poteze za razveljavitev.', { type: 'info' });
      return;
    }
    grid = cloneGrid(history.grid);
    score = history.score;
    moves = history.moves;
    bestTile = history.bestTile;
    wonNotified = history.wonNotified;
    gameOver = false;
    history = null;
    if (msgEl) {
      msgEl.textContent = 'Poteza razveljavljena.';
      msgEl.className = 'twfo-message';
    }
    renderBoard();
    updateScoreUI();
    sounds.play('click');
  }

  function giveHint() {
    // Simple hint: which direction gives most merges/empty creation
    const dirs = ['up', 'right', 'down', 'left'];
    let bestDir = null;
    let bestScore = -1;
    for (const d of dirs) {
      const testGrid = cloneGrid(grid);
      const before = JSON.stringify(testGrid);
      // simulate move without side effects
      let gain = 0;
      let changed = false;
      // use temporary logic
      const tmpGrid = cloneGrid(grid);
      const tmp = { grid: tmpGrid, score: 0 };
      // quick simulation using same algorithm but on copy
      // replicate minimal
      const sizeTmp = size;
      function slideRow(r) {
        const f = r.filter(v => v !== 0);
        const m = [];
        let g = 0;
        let i = 0;
        while (i < f.length) {
          if (i + 1 < f.length && f[i] === f[i + 1]) {
            m.push(f[i] * 2);
            g += f[i] * 2;
            i += 2;
          } else {
            m.push(f[i]);
            i++;
          }
        }
        while (m.length < sizeTmp) m.push(0);
        return { m, g };
      }
      let gAcc = 0;
      let copy = cloneGrid(grid);
      if (d === 'left') {
        for (let r = 0; r < sizeTmp; r++) {
          const { m, g } = slideRow(copy[r]);
          copy[r] = m;
          gAcc += g;
        }
      } else if (d === 'right') {
        for (let r = 0; r < sizeTmp; r++) {
          const rev = [...copy[r]].reverse();
          const { m, g } = slideRow(rev);
          copy[r] = [...m].reverse();
          gAcc += g;
        }
      } else if (d === 'up') {
        for (let c = 0; c < sizeTmp; c++) {
          const col = copy.map(row => row[c]);
          const { m, g } = slideRow(col);
          gAcc += g;
          for (let r = 0; r < sizeTmp; r++) copy[r][c] = m[r];
        }
      } else if (d === 'down') {
        for (let c = 0; c < sizeTmp; c++) {
          const col = copy.map(row => row[c]).reverse();
          const { m, g } = slideRow(col);
          const rest = [...m].reverse();
          gAcc += g;
          for (let r = 0; r < sizeTmp; r++) copy[r][c] = rest[r];
        }
      }
      if (JSON.stringify(copy) !== before) {
        const emptyAfter = copy.flat().filter(v => v === 0).length;
        const heuristic = gAcc * 2 + emptyAfter;
        if (heuristic > bestScore) {
          bestScore = heuristic;
          bestDir = d;
        }
      }
    }
    if (bestDir) {
      const labels = { up: 'GOR', down: 'DOL', left: 'LEVO', right: 'DESNO' };
      showToast(`💡 Poskusi: ${labels[bestDir]}`, { type: 'info' });
    } else {
      showToast('Ni očitne dobre poteze – poskusi katerokoli smer.', { type: 'info' });
    }
  }

  function onKey(e) {
    if (playScreen.classList.contains('hidden')) return;
    const key = e.key.toLowerCase();
    let dir = null;
    if (key === 'arrowup' || key === 'w') dir = 'up';
    else if (key === 'arrowdown' || key === 's') dir = 'down';
    else if (key === 'arrowleft' || key === 'a') dir = 'left';
    else if (key === 'arrowright' || key === 'd') dir = 'right';
    if (dir) {
      e.preventDefault();
      // save history before move
      const before = JSON.stringify(grid);
      saveHistoryForDir(dir, before);
      const moved = move(dir);
      if (!moved && history && JSON.stringify(history.grid) === before) {
        // revert history if no move
        const last = history;
        // if no change, remove history
        if (JSON.stringify(grid) === before) history = null;
        if (undoBtn) undoBtn.disabled = !history;
      }
    } else if (key === 'u') {
      handleUndo();
    }
  }

  function saveHistoryForDir(dir, beforeSnapshot) {
    // only save if move will be attempted; we save current state before move
    // avoid saving duplicate when no change will happen – but we save optimistically and clear if needed
    history = { grid: JSON.parse(beforeSnapshot), score, moves, bestTile, wonNotified };
    // Actually need deep clone JSON parse already did for grid snapshot string; convert
    history.grid = JSON.parse(beforeSnapshot);
  }

  function onTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e) {
    if (!touchStart || !e.changedTouches || e.changedTouches.length !== 1) {
      touchStart = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    let dir = null;
    if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left';
    else dir = dy > 0 ? 'down' : 'up';
    if (dir) {
      const before = JSON.stringify(grid);
      saveHistoryForDir(dir, before);
      const moved = move(dir);
      if (!moved) history = null;
      if (undoBtn) undoBtn.disabled = !history;
    }
  }

  function bindBoardTouch() {
    if (!boardEl) return;
    boardEl.addEventListener('touchstart', onTouchStart, { passive: true });
    boardEl.addEventListener('touchend', onTouchEnd, { passive: true });
    // also prevent scroll
    boardEl.addEventListener(
      'touchmove',
      e => {
        if (playScreen && !playScreen.classList.contains('hidden')) e.preventDefault();
      },
      { passive: false }
    );
  }

  function onDpad(e) {
    const btn = e.target.closest('button[data-dir]');
    if (!btn) return;
    const dir = btn.dataset.dir;
    const before = JSON.stringify(grid);
    saveHistoryForDir(dir, before);
    const moved = move(dir);
    if (!moved) history = null;
    if (undoBtn) undoBtn.disabled = !history;
  }

  // Listeners
  if (startBtn)
    startBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  if (newBtn)
    newBtn.addEventListener('click', () => {
      startNewGame();
    });
  if (retryBtn)
    retryBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  document.getElementById('twfo-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });
  if (undoBtn) undoBtn.addEventListener('click', handleUndo);
  if (hintBtn) hintBtn.addEventListener('click', giveHint);
  document.addEventListener('keydown', onKey);
  bindBoardTouch();
  boardEl?.addEventListener('click', onDpad);

  // also listen dpad container? add separate listeners for buttons already via delegation
  document.querySelector('.twfo-dpad')?.addEventListener('click', onDpad);

  showLayer(startScreen);
  // initialize board preview but not started yet
  grid = createEmptyGrid();
  addRandomTile();
  addRandomTile();
  renderBoard();
  score = 0;
  moves = 0; // reset score after preview
  updateScoreUI();

  return () => {
    document.removeEventListener('keydown', onKey);
    if (boardEl) {
      boardEl.removeEventListener('touchstart', onTouchStart);
      boardEl.removeEventListener('touchend', onTouchEnd);
    }
  };
}
