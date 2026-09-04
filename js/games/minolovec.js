// js/games/minolovec.js — Minolovec (Minesweeper) – klasični
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { shuffle } from '../utils/rng.js';

export function renderMinolovec() {
  const settingsHtml = `
    <div class="settings-row">
      <label class="form-label">Težavnost
        <select id="mine-difficulty" class="form-select">
          <option value="easy" selected>Lahko 9×9 – 10 min</option>
          <option value="medium">Srednje 9×9 – 20 min</option>
          <option value="hard">Težko 9×9 – 30 min</option>
        </select>
      </label>
    </div>
  `;
  const stageHtml = `
    <div class="game-stage">
      <div id="mine-start-screen" class="stage-layer">
        ${renderStartCard(
          'Odpravi vsa polja brez min. Številka pove, koliko min je v 8 sosedih. Zastavica označi mino.',
          'mine-start-btn',
          '▶ Začni Minolovec',
          'Minolovec'
        )}
      </div>
      <div id="mine-play-screen" class="stage-layer hidden">
        <div class="mine-stage-container">
          <div class="mine-topbar">
            <div class="mine-counter" id="mine-counter">💣 10</div>
            <button id="mine-face-btn" class="btn" style="font-size:1.2rem; padding:0.3rem 0.8rem;">🙂</button>
            <div class="mine-timer" id="mine-timer">00:00</div>
          </div>
          <div id="mine-board" class="mine-board"></div>
          <div class="mine-controls">
            <button id="mine-mode-reveal" class="btn mine-mode-btn active" style="padding:0.45rem 0.9rem; font-size:0.85rem;">🔍 Odkrij</button>
            <button id="mine-mode-flag" class="btn mine-mode-btn btn-outline" style="padding:0.45rem 0.9rem; font-size:0.85rem;">🚩 Zastavica</button>
            <button id="mine-hint-btn" class="btn btn-outline" style="padding:0.45rem 0.8rem; font-size:0.82rem;">💡 Namig</button>
          </div>
          <p class="mine-help">Levi klik/dotik odkriva, desni klik ali način zastavica postavlja 🚩. Dolgi pritisk na telefonu.</p>
          <div id="mine-message" style="min-height:1.4em; text-align:center; font-weight:700; font-size:0.9rem;"></div>
        </div>
      </div>
      <div id="mine-end-screen" class="stage-layer hidden">
        <div class="rc-victory-content" style="text-align:center; max-width:380px; width:90%; background:var(--color-surface); border:1px solid var(--color-border); padding:var(--spacing-md); border-radius:var(--border-radius); box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <h3 id="mine-end-title" class="result-title" style="font-size:1.3rem; margin-bottom:var(--spacing-xs);"></h3>
          <p class="muted-xs">Čas: <strong id="mine-final-time">00:00</strong> • Težavnost: <strong id="mine-final-diff"></strong></p>
          <p class="muted-xs" style="margin-bottom:var(--spacing-sm);">Potez: <strong id="mine-final-moves">0</strong></p>
          <button id="mine-retry-btn" class="btn">Nova igra</button>
          <button id="mine-back-to-list" class="btn btn-outline" style="margin-left:8px;">← Seznam</button>
        </div>
      </div>
    </div>
  `;
  const infoHtml = `
    <h4 style="margin-bottom:8px;">O Minolovcu</h4>
    <p style="margin-bottom:12px;">Minolovec (Minesweeper) je klasična logična igra (Microsoft, 1990) – mehanika je javna, lastna izvedba z originalno grafiko.</p>
    <ul style="margin-bottom:12px; padding-left:20px; line-height:1.6;">
      <li>Številka = št. min v 8 sosedih.</li>
      <li>Odkrij vsa polja brez min; zastavice pomagajo označiti mine.</li>
      <li>Prvi klik je vedno varen. Prazen krog (0) samodejno razkrije sosede.</li>
      <li>Zmagaj čim hitreje – čas in št. potez se beležita.</li>
    </ul>
  `;
  return renderGameShell({
    title: 'Minolovec',
    subtitle: 'Klasični iskalec min.',
    statusHtml: '<span id="mine-header-mines">💣 10</span><span id="mine-header-time">00:00</span>',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initMinolovec() {
  const startScreen = document.getElementById('mine-start-screen');
  const playScreen = document.getElementById('mine-play-screen');
  const endScreen = document.getElementById('mine-end-screen');
  const boardEl = document.getElementById('mine-board');
  const counterEl = document.getElementById('mine-counter');
  const timerEl = document.getElementById('mine-timer');
  const headerMines = document.getElementById('mine-header-mines');
  const headerTime = document.getElementById('mine-header-time');
  const msgEl = document.getElementById('mine-message');
  const faceBtn = document.getElementById('mine-face-btn');

  let difficulty = 'easy';
  let rows = 9,
    cols = 9,
    mines = 10;
  let grid = []; // {mine, revealed, flagged, adj}
  let firstClick = true;
  let flagMode = false;
  let timerId = null;
  let startTime = 0;
  let moves = 0;
  let gameOver = false;
  let revealedCount = 0;

  function readSettings() {
    const dEl = document.getElementById('mine-difficulty');
    if (dEl) difficulty = dEl.value || 'easy';
    if (difficulty === 'easy') {
      rows = 9;
      cols = 9;
      mines = 10;
    } else if (difficulty === 'medium') {
      rows = 9;
      cols = 9;
      mines = 20;
    } else {
      rows = 9;
      cols = 9;
      mines = 30;
    }
  }

  setGameSettingsApplyHandler(() => {
    readSettings();
    startNewGame();
    showLayer(playScreen);
  });

  function showLayer(l) {
    [startScreen, playScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (l) l.classList.remove('hidden');
  }

  function formatTime(s) {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function startTimer() {
    startTime = Date.now();
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const t = formatTime(elapsed);
      if (timerEl) timerEl.textContent = t;
      if (headerTime) headerTime.textContent = t;
    }, 500);
  }
  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function createEmpty() {
    grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }))
    );
  }

  function placeMines(safeR, safeC) {
    const cells = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        cells.push([r, c]);
      }
    shuffle(cells);
    for (let i = 0; i < mines && i < cells.length; i++) {
      const [r, c] = cells[i];
      grid[r][c].mine = true;
    }

    // Zagotovi, da prvi prazen klik ne more sam odpreti celotne plošče.
    const boundaryCells = cells.filter(
      ([r, c]) => Math.max(Math.abs(r - safeR), Math.abs(c - safeC)) === 2
    );
    const boundaryCell = boundaryCells.find(([r, c]) => !grid[r][c].mine);
    if (boundaryCell && mines > 0) {
      const existingMine = cells.find(([r, c]) => grid[r][c].mine);
      if (existingMine) {
        grid[existingMine[0]][existingMine[1]].mine = false;
        grid[boundaryCell[0]][boundaryCell[1]].mine = true;
      }
    }

    // compute adj
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].mine) continue;
        let cnt = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr,
              nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) cnt++;
          }
        grid[r][c].adj = cnt;
      }
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    boardEl.innerHTML = '';
    let flags = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c].flagged) flags++;
    const remaining = mines - flags;
    if (counterEl) counterEl.textContent = `💣 ${remaining}`;
    if (headerMines) headerMines.textContent = `💣 ${remaining}`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const div = document.createElement('div');
        div.className = 'mine-cell';
        div.dataset.r = r;
        div.dataset.c = c;
        if (cell.revealed) {
          div.classList.add('revealed');
          if (cell.mine) {
            div.classList.add('mine');
            div.textContent = '💣';
            if (cell.mine && gameOver && cell.revealed) {
              // hit?
            }
          } else if (cell.adj > 0) {
            div.innerHTML = `<span class="mine-num-${cell.adj}">${cell.adj}</span>`;
          }
        } else {
          if (cell.flagged) {
            div.classList.add('flagged');
            div.textContent = '🚩';
          }
          div.addEventListener('click', e => handleCellClick(r, c, e));
          div.addEventListener('contextmenu', e => {
            e.preventDefault();
            handleFlag(r, c);
          });
          // long press for mobile
          let pressTimer = null;
          div.addEventListener(
            'touchstart',
            e => {
              pressTimer = setTimeout(() => {
                handleFlag(r, c);
                e.preventDefault();
              }, 500);
            },
            { passive: false }
          );
          div.addEventListener('touchend', () => {
            if (pressTimer) clearTimeout(pressTimer);
          });
          div.addEventListener('touchmove', () => {
            if (pressTimer) clearTimeout(pressTimer);
          });
        }
        boardEl.appendChild(div);
      }
    }
  }

  function handleCellClick(r, c, e) {
    if (gameOver) return;
    const cell = grid[r][c];
    if (cell.flagged) return;
    // Chord – klik na odkrito številko
    if (cell.revealed) {
      if (cell.adj > 0) {
        let flagged = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr,
              nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].flagged) flagged++;
          }
        if (flagged === cell.adj) {
          let hitMine = false;
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr,
                nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const nb = grid[nr][nc];
                if (!nb.revealed && !nb.flagged) {
                  reveal(nr, nc);
                  moves++;
                  if (nb.mine) hitMine = true;
                }
              }
            }
          renderBoard();
          if (hitMine) {
            checkWinLoss(r, c);
            return;
          }
          // preveri zmago po chordanju
          const totalNonMine = rows * cols - mines;
          let revealedNonMine = 0;
          for (let rr = 0; rr < rows; rr++)
            for (let cc = 0; cc < cols; cc++)
              if (grid[rr][cc].revealed && !grid[rr][cc].mine) revealedNonMine++;
          if (revealedNonMine === totalNonMine) {
            gameOver = true;
            stopTimer();
            for (let rr = 0; rr < rows; rr++)
              for (let cc = 0; cc < cols; cc++) if (grid[rr][cc].mine) grid[rr][cc].flagged = true;
            renderBoard();
            if (faceBtn) faceBtn.textContent = '😎';
            sounds.play('victory');
            showConfetti({ count: 30 });
            showMessage('Zmaga! 🎉', 'success');
            setTimeout(() => finish(true), 700);
          }
        }
      }
      return;
    }
    if (flagMode) {
      handleFlag(r, c);
      return;
    }
    if (firstClick) {
      placeMines(r, c);
      firstClick = false;
      startTimer();
    }
    reveal(r, c);
    moves++;
    renderBoard();
    checkWinLoss(r, c);
  }

  function handleFlag(r, c) {
    if (gameOver) return;
    const cell = grid[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    sounds.play('click');
    renderBoard();
  }

  function reveal(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const cell = grid[r][c];
    if (cell.revealed || cell.flagged) return;
    cell.revealed = true;
    revealedCount++;
    if (cell.adj === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          reveal(r + dr, c + dc);
        }
    }
  }

  function revealAllMines(hitR = -1, hitC = -1) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].mine) {
          grid[r][c].revealed = true;
          // mark hit
        }
      }
    // render hit differently
    renderBoard();
    // add hit class
    if (hitR >= 0) {
      const idx = hitR * cols + hitC;
      const el = boardEl.children[idx];
      if (el) el.classList.add('mine-hit');
    }
  }

  function checkWinLoss(lastR, lastC) {
    const cell = grid[lastR][lastC];
    if (cell.mine) {
      // loss
      gameOver = true;
      stopTimer();
      revealAllMines(lastR, lastC);
      if (faceBtn) faceBtn.textContent = '😵';
      sounds.play('error');
      showMessage('Bum! Mina zadeta 💥', 'error');
      setTimeout(() => finish(false), 900);
      return;
    }
    // win if all non-mine revealed
    const totalNonMine = rows * cols - mines;
    let revealedNonMine = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (grid[r][c].revealed && !grid[r][c].mine) revealedNonMine++;
    if (revealedNonMine === totalNonMine) {
      gameOver = true;
      stopTimer();
      // flag all mines
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) if (grid[r][c].mine) grid[r][c].flagged = true;
      renderBoard();
      if (faceBtn) faceBtn.textContent = '😎';
      sounds.play('victory');
      showConfetti({ count: 30 });
      showMessage('Zmaga! 🎉', 'success');
      setTimeout(() => finish(true), 700);
    }
  }

  function showMessage(t, type = 'info') {
    if (!msgEl) return;
    msgEl.textContent = t;
    msgEl.style.color =
      type === 'error' ? '#ef4444' : type === 'success' ? '#16a34a' : 'var(--color-primary)';
    if (t) {
      clearTimeout(showMessage._t);
      showMessage._t = setTimeout(() => {
        msgEl.textContent = '';
      }, 1800);
    }
  }

  function finish(won) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('mine-final-time').textContent = formatTime(elapsed);
    document.getElementById('mine-final-diff').textContent = difficulty;
    document.getElementById('mine-final-moves').textContent = String(moves);
    const titleEl = document.getElementById('mine-end-title');
    if (titleEl)
      titleEl.textContent = won ? '🎉 Zmaga – polje očiščeno!' : '💥 Poraz – mina zadeta';
    if (titleEl) titleEl.style.color = won ? '#16a34a' : '#ef4444';
    const xp = won
      ? (difficulty === 'hard' ? 60 : difficulty === 'medium' ? 40 : 25) -
        Math.floor(elapsed / 60) * 2
      : 5;
    statsManager.addXp(Math.max(5, xp));
    statsManager.saveRecord('minolovec', {
      time: elapsed,
      moves,
      difficulty,
      won,
      score: Math.max(5, xp),
    });
    showLayer(endScreen);
  }

  function handleHint() {
    // reveal a safe cell
    const candidates = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!grid[r][c].revealed && !grid[r][c].mine && !grid[r][c].flagged)
          candidates.push([r, c]);
    if (candidates.length === 0) {
      showMessage('Ni varnih namigov', 'info');
      return;
    }
    const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
    reveal(r, c);
    renderBoard();
    showMessage('Namig: polje razkrito', 'info');
    sounds.play('correct');
    checkWinLoss(r, c);
  }

  function updateModeBtns() {
    document.getElementById('mine-mode-reveal')?.classList.toggle('active', !flagMode);
    document.getElementById('mine-mode-flag')?.classList.toggle('active', flagMode);
    document.getElementById('mine-mode-reveal')?.classList.toggle('btn-outline', flagMode);
    document.getElementById('mine-mode-flag')?.classList.toggle('btn-outline', !flagMode);
  }

  function startNewGame() {
    readSettings();
    createEmpty();
    firstClick = true;
    flagMode = false;
    gameOver = false;
    moves = 0;
    revealedCount = 0;
    stopTimer();
    if (timerEl) timerEl.textContent = '00:00';
    if (headerTime) headerTime.textContent = '00:00';
    if (faceBtn) faceBtn.textContent = '🙂';
    if (msgEl) msgEl.textContent = '';
    updateModeBtns();
    renderBoard();
  }

  document.getElementById('mine-start-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('mine-new-btn')?.addEventListener('click', () => {
    startNewGame();
  });
  document.getElementById('mine-retry-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('mine-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });
  document.getElementById('mine-mode-reveal')?.addEventListener('click', () => {
    flagMode = false;
    updateModeBtns();
  });
  document.getElementById('mine-mode-flag')?.addEventListener('click', () => {
    flagMode = true;
    updateModeBtns();
  });
  document.getElementById('mine-hint-btn')?.addEventListener('click', handleHint);
  document.getElementById('mine-face-btn')?.addEventListener('click', () => {
    startNewGame();
  });

  // right click prevention on board
  boardEl?.addEventListener('contextmenu', e => e.preventDefault());

  showLayer(startScreen);
  readSettings();
  createEmpty();
  renderBoard();

  return () => {
    stopTimer();
  };
}
