// js/games/sudoku.js — Sudoku 9x9 (klasični)
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { shuffle } from '../utils/rng.js';

export function renderSudoku() {
  const settingsHtml = `
    <div class="settings-row">
      <label class="form-label">Težavnost
        <select id="sud-difficulty" class="form-select">
          <option value="easy" selected>Lahko (več namigov)</option>
          <option value="medium">Srednje</option>
          <option value="hard">Težko (malo namigov)</option>
        </select>
      </label>
      <label class="form-label">Pomoč
        <select id="sud-assist" class="form-select">
          <option value="off" selected>Preveri ročno</option>
          <option value="on">Označi napake sproti</option>
        </select>
      </label>
      <label class="form-label">Zapiski
        <select id="sud-autonotes" class="form-select">
          <option value="off" selected>Ročni</option>
          <option value="on">Samodejni kandidati</option>
        </select>
      </label>
    </div>
  `;
  const stageHtml = `
    <div class="game-stage sudoku-game-stage">
      <div id="sud-start-screen" class="stage-layer">
        ${renderStartCard(
          'Izpolni mrežo 9×9 tako, da bo vsaka vrstica, stolpec in 3×3 kvadrat vseboval števila 1–9 brez ponavljanja.',
          'sud-start-btn',
          '▶ Začni Sudoku',
          'Sudoku'
        )}
      </div>
      <div id="sud-play-screen" class="stage-layer hidden">
        <div class="sud-stage-container">
          <div class="sud-topbar">
            <div class="sud-timer" id="sud-timer">00:00</div>
            <div style="display:flex; gap:6px; align-items:center;">
              <span id="sud-errors" style="font-size:0.85rem; font-weight:700; color:var(--color-error);">Napake: 0</span>
              <button id="sud-new-btn" class="btn btn-outline" style="padding:0.35rem 0.7rem; font-size:0.82rem;">↺ Nova</button>
            </div>
          </div>
          <div id="sud-board" class="sud-board" role="grid" aria-label="Sudoku mreža 9×9"></div>
          <div class="sud-numpad" id="sud-numpad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="sud-num-btn" data-num="${n}">${n}</button>`).join('')}
            <button class="sud-num-btn erase" data-num="0">⌫</button>
            <button class="sud-num-btn note-toggle" id="sud-note-toggle" data-note="0">✏️ Zapiski</button>
          </div>
          <div class="sud-actions">
            <button id="sud-hint-btn" class="btn btn-outline" style="padding:0.45rem 0.8rem; font-size:0.85rem;">💡 Namig</button>
            <button id="sud-check-btn" class="btn btn-outline" style="padding:0.45rem 0.8rem; font-size:0.85rem;">✓ Preveri</button>
            <button id="sud-solve-btn" class="btn btn-outline" style="padding:0.45rem 0.8rem; font-size:0.82rem; color:var(--color-text-muted);">Reši</button>
          </div>
          <p class="sud-help">Tapni polje, nato številko. V načinu zapisaki dodaš svinčnikove opombe.</p>
          <div id="sud-message" aria-live="polite" aria-atomic="true" style="min-height:1.4em; text-align:center; font-weight:700; font-size:0.9rem;"></div>
        </div>
      </div>
      <div id="sud-end-screen" class="stage-layer hidden">
        <div class="rc-victory-content" style="text-align:center; max-width:380px; width:90%; background:var(--color-surface); border:1px solid var(--color-border); padding:var(--spacing-md); border-radius:var(--border-radius); box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <h3 class="result-title" style="font-size:1.3rem; margin-bottom:var(--spacing-xs); color:var(--color-success);">Sudoku rešen! 🎉</h3>
          <p class="muted-xs">Čas: <strong id="sud-final-time">00:00</strong> • Napake: <strong id="sud-final-errors">0</strong></p>
          <p class="muted-xs" style="margin-bottom:var(--spacing-sm);">Težavnost: <strong id="sud-final-diff"></strong></p>
          <button id="sud-retry-btn" class="btn">Nova igra</button>
          <button id="sud-back-to-list" class="btn btn-outline" style="margin-left:8px;">← Seznam</button>
        </div>
      </div>
    </div>
  `;
  const infoHtml = `
    <h4 style="margin-bottom:8px;">O Sudoku</h4>
    <p style="margin-bottom:12px;">Sudoku je logična uganka (Howard Garns, 1979) – javna domena. Cilj je zapolniti 9×9 mrežo s števili 1–9, brez ponavljanja v vrstici, stolpcu ali 3×3 bloku.</p>
    <ul style="margin-bottom:12px; padding-left:20px; line-height:1.6;">
      <li>Siva polja so dana, bela izpolniš.</li>
      <li>Način Zapiski omogoča svinčnikove opombe (majhne številke v celici).</li>
      <li>Namig razkrije eno celico (kazen -5 xp), Preveri označi napačne vnose.</li>
    </ul>
  `;
  return renderGameShell({
    title: 'Sudoku',
    subtitle: 'Klasični 9×9 – logika števil.',
    statusHtml:
      '<span>Čas: <strong id="sud-header-time">00:00</strong></span><span id="sud-header-diff">Lahko</span>',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initSudoku() {
  const startScreen = document.getElementById('sud-start-screen');
  const playScreen = document.getElementById('sud-play-screen');
  const endScreen = document.getElementById('sud-end-screen');
  const boardEl = document.getElementById('sud-board');
  const timerEl = document.getElementById('sud-timer');
  const headerTime = document.getElementById('sud-header-time');
  const headerDiff = document.getElementById('sud-header-diff');
  const errorsEl = document.getElementById('sud-errors');
  const msgEl = document.getElementById('sud-message');

  let difficulty = 'easy';
  let assist = 'off';
  let autoNotes = 'off';
  let puzzle = null; // {board, solution}
  let grid = []; // 9x9 current values 0 empty
  let notes = []; // 9x9 Set
  let given = []; // 9x9 boolean
  let selected = null; // [r,c]
  let noteMode = false;
  let errors = 0;
  let startTime = 0;
  let timerId = null;
  let solved = false;

  function readSettings() {
    const dEl = document.getElementById('sud-difficulty');
    const aEl = document.getElementById('sud-assist');
    const anEl = document.getElementById('sud-autonotes');
    if (dEl) difficulty = dEl.value || 'easy';
    if (aEl) assist = aEl.value || 'on';
    if (anEl) autoNotes = anEl.value || 'off';
    if (headerDiff)
      headerDiff.textContent =
        difficulty === 'easy' ? 'Lahko' : difficulty === 'medium' ? 'Srednje' : 'Težko';
  }

  function updateAutoNotes() {
    if (autoNotes !== 'on') return;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== 0 || given[r][c]) {
          notes[r][c].clear();
          continue;
        }
        const candidates = new Set();
        for (let n = 1; n <= 9; n++) if (sudokuIsValidForNotes(grid, r, c, n)) candidates.add(n);
        notes[r][c] = candidates;
      }
  }
  function sudokuIsValidForNotes(b, r, c, n) {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === n) return false;
      if (b[i][c] === n) return false;
    }
    const br = Math.floor(r / 3) * 3,
      bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) if (b[br + i][bc + j] === n) return false;
    return true;
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

  // Sudoku generation
  function generateSolved() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    function isValid(b, r, c, n) {
      for (let i = 0; i < 9; i++) {
        if (b[r][i] === n) return false;
        if (b[i][c] === n) return false;
      }
      const br = Math.floor(r / 3) * 3,
        bc = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) if (b[br + i][bc + j] === n) return false;
      return true;
    }
    function solve(b) {
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (b[r][c] === 0) {
            const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (const n of nums) {
              if (isValid(b, r, c, n)) {
                b[r][c] = n;
                if (solve(b)) return true;
                b[r][c] = 0;
              }
            }
            return false;
          }
      return true;
    }
    solve(board);
    return board;
  }

  function copyBoard(b) {
    return b.map(row => [...row]);
  }

  function countSolutions(board) {
    // count up to 2 solutions for uniqueness check, with early exit
    let count = 0;
    function isValid(b, r, c, n) {
      for (let i = 0; i < 9; i++) {
        if (b[r][i] === n) return false;
        if (b[i][c] === n) return false;
      }
      const br = Math.floor(r / 3) * 3,
        bc = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) if (b[br + i][bc + j] === n) return false;
      return true;
    }
    function dfs(b) {
      if (count >= 2) return;
      let r = -1,
        c = -1;
      outer: for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          if (b[i][j] === 0) {
            r = i;
            c = j;
            break outer;
          }
      if (r === -1) {
        count++;
        return;
      }
      for (let n = 1; n <= 9; n++) {
        if (isValid(b, r, c, n)) {
          b[r][c] = n;
          dfs(b);
          b[r][c] = 0;
          if (count >= 2) return;
        }
      }
    }
    dfs(copyBoard(board));
    return count;
  }

  function generatePuzzle(diff) {
    const solved = generateSolved();
    const board = copyBoard(solved);
    const cells = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c]);
    shuffle(cells);
    let clues = 81;
    const targetClues = diff === 'easy' ? 36 : diff === 'medium' ? 32 : 26;
    // remove cells while keeping unique solution
    for (const [r, c] of cells) {
      if (clues <= targetClues) break;
      const backup = board[r][c];
      board[r][c] = 0;
      const sols = countSolutions(board);
      if (sols !== 1) {
        board[r][c] = backup;
      } else {
        clues--;
      }
    }
    return { board, solution: solved };
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.setAttribute('role', 'grid');
    boardEl.setAttribute('aria-label', 'Sudoku mreža 9×9, izberi polje in vnesi številko');
    boardEl.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sud-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.setAttribute('role', 'gridcell');
        const valLabel = grid[r][c] ? `, vrednost ${grid[r][c]}` : ', prazno';
        cell.setAttribute(
          'aria-label',
          `Vrstica ${r + 1} stolpec ${c + 1}${valLabel}${given[r][c] ? ' dano' : ''}`
        );
        cell.setAttribute(
          'tabindex',
          selected && selected[0] === r && selected[1] === c ? '0' : '-1'
        );
        if (given[r][c]) cell.classList.add('given');
        if (selected && selected[0] === r && selected[1] === c) cell.classList.add('selected');
        // box borders
        if ((c + 1) % 3 === 0 && c !== 8) cell.classList.add('box-right');
        if ((r + 1) % 3 === 0 && r !== 8) cell.classList.add('box-bottom');
        const val = grid[r][c];
        if (val !== 0) {
          if (!given[r][c] && assist === 'on' && puzzle && val !== puzzle.solution[r][c]) {
            cell.classList.add('error');
          }
          // highlight same number as selected
          if (
            selected &&
            grid[selected[0]][selected[1]] !== 0 &&
            val === grid[selected[0]][selected[1]]
          ) {
            cell.classList.add('same-number');
          }
          cell.textContent = String(val);
        } else {
          // show notes
          if (notes[r][c] && notes[r][c].size > 0) {
            const notesDiv = document.createElement('div');
            notesDiv.className = 'sud-notes';
            for (let n = 1; n <= 9; n++) {
              const nEl = document.createElement('div');
              nEl.className = 'sud-note';
              nEl.textContent = notes[r][c].has(n) ? String(n) : '';
              notesDiv.appendChild(nEl);
            }
            cell.appendChild(notesDiv);
          }
        }
        cell.addEventListener('click', () => selectCell(r, c));
        boardEl.appendChild(cell);
      }
    }
    // highlight same row/col/box for selected? optional
  }

  function selectCell(r, c) {
    selected = [r, c];
    renderBoard();
    sounds.play('click');
  }

  function inputNumber(num) {
    if (!selected) {
      showMessage('Najprej izberi polje', 'info');
      return;
    }
    const [r, c] = selected;
    if (given[r][c]) return;
    if (noteMode) {
      if (num === 0) {
        notes[r][c].clear();
      } else {
        if (notes[r][c].has(num)) notes[r][c].delete(num);
        else notes[r][c].add(num);
        // if has value, clear value? notes only when empty
        if (grid[r][c] !== 0) {
          grid[r][c] = 0;
        }
      }
      renderBoard();
      return;
    }
    // normal mode
    if (num === 0) {
      grid[r][c] = 0;
      notes[r][c].clear();
    } else {
      grid[r][c] = num;
      notes[r][c].clear();
      // check error immediate
      if (assist === 'on' && puzzle && num !== puzzle.solution[r][c]) {
        errors++;
        if (errorsEl) errorsEl.textContent = 'Napake: ' + errors;
        sounds.play('error');
        showMessage('Napačna številka', 'error');
      } else {
        sounds.play('click');
      }
    }
    if (autoNotes === 'on') updateAutoNotes();
    renderBoard();
    checkWin();
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
      }, 1500);
    }
  }

  function checkWin() {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (grid[r][c] === 0) return;
    // check all correct
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (grid[r][c] !== puzzle.solution[r][c]) return;
    // win
    solved = true;
    stopTimer();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('sud-final-time').textContent = formatTime(elapsed);
    document.getElementById('sud-final-errors').textContent = String(errors);
    document.getElementById('sud-final-diff').textContent = difficulty;
    showConfetti({ count: 30 });
    sounds.play('victory');
    const baseXp = difficulty === 'hard' ? 50 : difficulty === 'medium' ? 35 : 25;
    const xp = Math.max(10, baseXp - Math.floor(elapsed / 60) * 2 - errors * 2);
    statsManager.addXp(xp);
    statsManager.saveRecord('sudoku', { time: elapsed, errors, difficulty, score: xp });
    showLayer(endScreen);
  }

  function handleHint() {
    const empties = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (grid[r][c] === 0) empties.push([r, c]);
    if (empties.length === 0) {
      showMessage('Ni praznih polj', 'info');
      return;
    }
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    grid[r][c] = puzzle.solution[r][c];
    notes[r][c].clear();
    given[r][c] = false; // still not given but filled
    renderBoard();
    showMessage('Namig dodan', 'info');
    sounds.play('correct');
    statsManager.addXp(-5);
    checkWin();
  }

  function handleCheck() {
    let wrong = 0;
    const wrongPos = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (grid[r][c] !== 0 && grid[r][c] !== puzzle.solution[r][c]) {
          wrong++;
          wrongPos.push([r, c]);
        }
    if (wrong === 0) showMessage('Vse pravilno do sedaj ✓', 'success');
    else showMessage('Napačnih: ' + wrong, 'error');
    renderBoard();
    // Označi napačne ne glede na nastavitev assist
    if (wrong > 0) {
      wrongPos.forEach(([r, c]) => {
        const idx = r * 9 + c;
        const el = boardEl.children[idx];
        if (el) el.classList.add('error');
      });
      setTimeout(() => renderBoard(), 1400);
    }
  }

  function handleSolve() {
    if (!confirm('Res želiš razkriti rešitev?')) return;
    grid = copyBoard(puzzle.solution);
    renderBoard();
    stopTimer();
    showToast('Rešitev prikazana', 'info');
  }

  function onKey(e) {
    if (playScreen.classList.contains('hidden')) return;
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      inputNumber(parseInt(e.key, 10));
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      e.preventDefault();
      inputNumber(0);
    } else if (e.key === 'n' || e.key === 'N') {
      noteMode = !noteMode;
      updateNoteBtn();
    } else if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      if (!selected) {
        selected = [0, 0];
        renderBoard();
        return;
      }
      e.preventDefault();
      let [r, c] = selected;
      if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
      if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
      if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
      if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
      selected = [r, c];
      renderBoard();
    }
  }

  function updateNoteBtn() {
    const btn = document.getElementById('sud-note-toggle');
    if (btn) btn.classList.toggle('active', noteMode);
  }

  function startNewGame() {
    readSettings();
    puzzle = generatePuzzle(difficulty);
    grid = copyBoard(puzzle.board);
    given = puzzle.board.map(row => row.map(v => v !== 0));
    notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    if (autoNotes === 'on') updateAutoNotes();
    selected = null;
    errors = 0;
    solved = false;
    if (errorsEl) errorsEl.textContent = 'Napake: 0';
    if (msgEl) msgEl.textContent = '';
    renderBoard();
    startTimer();
  }

  document.getElementById('sud-start-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('sud-new-btn')?.addEventListener('click', () => {
    startNewGame();
  });
  document.getElementById('sud-retry-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('sud-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });
  document.getElementById('sud-note-toggle')?.addEventListener('click', () => {
    noteMode = !noteMode;
    updateNoteBtn();
    sounds.play('click');
  });
  document.getElementById('sud-hint-btn')?.addEventListener('click', handleHint);
  document.getElementById('sud-check-btn')?.addEventListener('click', handleCheck);
  document.getElementById('sud-solve-btn')?.addEventListener('click', handleSolve);
  document.getElementById('sud-numpad')?.addEventListener('click', e => {
    const btn = e.target.closest('.sud-num-btn');
    if (!btn || btn.dataset.num === undefined) return;
    const n = parseInt(btn.dataset.num, 10);
    inputNumber(n);
  });
  document.addEventListener('keydown', onKey);

  showLayer(startScreen);
  // preview board
  puzzle = generatePuzzle('easy');
  grid = copyBoard(puzzle.board);
  given = puzzle.board.map(row => row.map(v => v !== 0));
  notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
  renderBoard();

  return () => {
    stopTimer();
    document.removeEventListener('keydown', onKey);
  };
}
