// js/games/trail.js — Barvni Labirint (Trail Making) – moderna naloga (ES6 modul)
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';

const SEQUENCE = ['1', 'A', '2', 'B', '3', 'C', '4', 'D'];

export function renderTrail() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Težavnost
                <select id="trail-difficulty" class="form-select">
                    <option value="easy">Lahko (1-A-2-B-3)</option>
                    <option value="medium" selected>Srednje (1-A-2-B-3-C-4-D)</option>
                    <option value="hard">Težko (1-A-2-B-3-C-4-D-E-5)</option>
                </select>
            </label>
            <label class="form-label">Pomoč
                <select id="trail-assist" class="form-select">
                    <option value="on" selected>Črta med pravilnimi kliki</option>
                    <option value="off">Brez črte</option>
                </select>
            </label>
        </div>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="trail-start-screen" class="stage-layer">
                ${renderStartCard(
                  'Poveži kroge v pravilnem zaporedju 1 → A → 2 → B → 3 → C → 4 → D. Vaja za preklapljanje in vidno iskanje.',
                  'trail-start-btn',
                  '▶ Začni labirint',
                  'Barvni Labirint'
                )}
            </div>

            <div id="trail-play-screen" class="stage-layer hidden">
                <div class="trail-stage-container">
                    <div class="trail-topbar">
                        <div class="trail-progress-wrap">
                            <svg class="trail-ring" width="44" height="44" viewBox="0 0 44 44">
                                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-border)" stroke-width="4"/>
                                <circle id="trail-ring-progress" cx="22" cy="22" r="18" fill="none" stroke="var(--color-primary)" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="113" transform="rotate(-90 22 22)"/>
                                <text id="trail-ring-text" x="22" y="26" text-anchor="middle" font-size="11" font-weight="800" fill="var(--color-primary)">0/8</text>
                            </svg>
                            <span class="trail-next-hint">Naslednji: <strong id="trail-next">1</strong></span>
                        </div>
                        <div class="trail-timer" id="trail-timer">00.0s</div>
                    </div>
                    <div id="trail-board" class="trail-board">
                        <svg id="trail-svg" class="trail-svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet"></svg>
                        <div id="trail-nodes" class="trail-nodes"></div>
                    </div>
                    <div id="trail-feedback" class="trail-feedback"></div>
                </div>
            </div>

            <div id="trail-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align: center; max-width: 360px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title result-success" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--color-success);">Labirint rešen! 🎉</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Čas: <strong id="trail-final-time">0.0s</strong></p>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-sm);">Napak: <strong id="trail-final-errors">0</strong></p>
                    <button id="trail-retry-btn" class="btn">Poskusi znova</button>
                    <button id="trail-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 style="margin-bottom: 8px;">O Barvnem Labirintu (Trail Making)</h4>
        <p style="margin-bottom: 12px;">Sodobna različica preizkusa <strong>Trail Making Test (TMT)</strong> za <strong>preklapljanje pozornosti in vidno iskanje</strong> (Reitan, 1958) – kot v Peak in Lumosity.</p>
        <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.6;">
            <li>Poveži 1 → A → 2 → B … do konca zaporedja.</li>
            <li>Napačen klik strese krog in zabeleži napako, pravilna pot se izriše z gradient črto.</li>
            <li>Progress obroček in čas spodbujata hitrost ob natančnosti.</li>
        </ul>
    `;

  return renderGameShell({
    title: 'Barvni Labirint',
    subtitle: 'Sodoben Trail Making – preklapljanje in iskanje.',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initTrail() {
  let difficulty = 'medium';
  let assist = 'on';
  let currentIndex = 0;
  let errors = 0;
  let startTime = 0;
  let timerId = null;
  let sequence = [...SEQUENCE];

  const startScreen = document.getElementById('trail-start-screen');
  const playScreen = document.getElementById('trail-play-screen');
  const endScreen = document.getElementById('trail-end-screen');
  const board = document.getElementById('trail-board');
  const nodesContainer = document.getElementById('trail-nodes');
  const svg = document.getElementById('trail-svg');
  const nextEl = document.getElementById('trail-next');
  const timerEl = document.getElementById('trail-timer');
  const ringProgress = document.getElementById('trail-ring-progress');
  const ringText = document.getElementById('trail-ring-text');
  const feedbackEl = document.getElementById('trail-feedback');
  const startBtn = document.getElementById('trail-start-btn');
  const retryBtn = document.getElementById('trail-retry-btn');

  function readSettingsFromUI() {
    const diffEl = document.getElementById('trail-difficulty');
    const assistEl = document.getElementById('trail-assist');
    if (diffEl) difficulty = diffEl.value || 'medium';
    if (assistEl) assist = assistEl.value || 'on';
    if (difficulty === 'easy') sequence = ['1', 'A', '2', 'B', '3'];
    else if (difficulty === 'hard') sequence = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', 'E', '5'];
    else sequence = [...SEQUENCE];
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

  function randomPositions(count) {
    const positions = [];
    const margin = 60;
    const w = 600,
      h = 400;
    for (let i = 0; i < count; i++) {
      let x,
        y,
        tries = 0;
      do {
        x = margin + Math.random() * (w - margin * 2);
        y = margin + Math.random() * (h - margin * 2);
        tries++;
      } while (positions.some(p => Math.hypot(p.x - x, p.y - y) < 70) && tries < 50);
      positions.push({ x, y });
    }
    return positions;
  }

  function updateProgress() {
    const total = sequence.length;
    const done = currentIndex;
    const pct = total ? done / total : 0;
    const circ = 2 * Math.PI * 18;
    const offset = circ - circ * pct;
    if (ringProgress) {
      ringProgress.style.strokeDasharray = String(circ);
      ringProgress.style.strokeDashoffset = String(offset);
    }
    if (ringText) ringText.textContent = `${done}/${total}`;
    if (nextEl) nextEl.textContent = sequence[currentIndex] || '✓';
  }

  function startTimer() {
    startTime = performance.now();
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (timerEl) timerEl.textContent = `${elapsed.toFixed(1)}s`;
    }, 100);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function drawLine(from, to) {
    if (assist !== 'on') return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(from.x));
    line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(to.x));
    line.setAttribute('y2', String(to.y));
    line.setAttribute('stroke', 'var(--color-primary)');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('opacity', '0.85');
    svg.appendChild(line);
  }

  function renderBoard() {
    nodesContainer.innerHTML = '';
    svg.innerHTML = '';
    const positions = randomPositions(sequence.length);
    // Shrani pozicije za kasnejše črte
    renderBoard.positions = positions;

    sequence.forEach((label, idx) => {
      const pos = positions[idx];
      const node = document.createElement('button');
      node.className = 'trail-node';
      node.dataset.label = label;
      node.dataset.index = String(idx);
      node.textContent = label;
      node.style.left = `${pos.x - 28}px`;
      node.style.top = `${pos.y - 28}px`;
      node.addEventListener('click', () => handleNodeClick(idx, node, pos));
      nodesContainer.appendChild(node);
    });
    updateProgress();
    if (feedbackEl) feedbackEl.textContent = '';
  }

  function handleNodeClick(idx, nodeEl, pos) {
    if (idx !== currentIndex) {
      errors++;
      nodeEl.classList.add('shake');
      sounds.play('error');
      if (feedbackEl) {
        feedbackEl.textContent = `Napačno – pričakovan je ${sequence[currentIndex]}.`;
        feedbackEl.className = 'trail-feedback error';
      }
      setTimeout(() => nodeEl.classList.remove('shake'), 400);
      setTimeout(() => {
        if (feedbackEl) feedbackEl.textContent = '';
      }, 1200);
      return;
    }
    // Pravilno
    nodeEl.classList.add('done');
    nodeEl.disabled = true;
    sounds.play('correct');
    if (currentIndex > 0 && assist === 'on') {
      const prevPos = renderBoard.positions[currentIndex - 1];
      drawLine(prevPos, pos);
    }
    currentIndex++;
    updateProgress();
    if (currentIndex >= sequence.length) {
      // Konec
      stopTimer();
      const elapsed = (performance.now() - startTime) / 1000;
      const finalTimeEl = document.getElementById('trail-final-time');
      const finalErrEl = document.getElementById('trail-final-errors');
      if (finalTimeEl) finalTimeEl.textContent = `${elapsed.toFixed(1)}s`;
      if (finalErrEl) finalErrEl.textContent = String(errors);
      const xp = Math.max(10, Math.round(40 - elapsed * 0.5 - errors * 5));
      statsManager.addXp(xp);
      statsManager.saveRecord('trail', {
        time: Number(elapsed.toFixed(1)),
        errors,
        difficulty,
        score: xp,
      });
      // Confetti za dober čas
      if (errors === 0 && elapsed < 25) {
        import('../feedback.js').then(m => m.showConfetti && m.showConfetti({ count: 30 }));
      }
      showLayer(endScreen);
      return;
    }
    if (feedbackEl) {
      feedbackEl.textContent = 'Pravilno ✓';
      feedbackEl.className = 'trail-feedback success';
      setTimeout(() => {
        feedbackEl.textContent = '';
      }, 600);
    }
  }

  function startNewGame() {
    readSettingsFromUI();
    currentIndex = 0;
    errors = 0;
    showLayer(playScreen);
    renderBoard();
    startTimer();
  }

  if (startBtn) startBtn.addEventListener('click', startNewGame);
  if (retryBtn) retryBtn.addEventListener('click', startNewGame);
  document.getElementById('trail-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  const keyHandler = e => {
    if (e.key === 'Enter') {
      if (!startScreen.classList.contains('hidden')) startNewGame();
      else if (!endScreen.classList.contains('hidden')) startNewGame();
    }
  };
  document.addEventListener('keydown', keyHandler);

  return () => {
    stopTimer();
    document.removeEventListener('keydown', keyHandler);
  };
}
