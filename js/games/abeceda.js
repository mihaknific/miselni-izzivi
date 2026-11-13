import { renderGameShell, renderAnswerHistory, createGameTimer } from './game-layout.js';
import { bindGameSettings } from './game-settings-panel.js';
import { renderStartCard } from './game-start.js';
import { statsManager } from '../stats.js';
import { saveJson } from '../store.js';
import { escapeHtml } from '../ui.js';
import { showToast } from '../feedback.js';
import { shuffle } from '../utils/rng.js';

const slovenskaAbeceda = [
  'A',
  'B',
  'C',
  'Č',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'R',
  'S',
  'Š',
  'T',
  'U',
  'V',
  'Z',
  'Ž',
];
const angleskaAbeceda = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];
const vsaStevilaAbcSLO = Array.from({ length: 25 }, (_, i) => i + 1);
const vsaStevilaAbcEN = Array.from({ length: 26 }, (_, i) => i + 1);

export function renderAbeceda() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Abeceda
                <select id="abc-lang" class="form-select">
                    <option value="sl" selected>Slovenska abeceda (25 črk)</option>
                    <option value="en">Angleška abeceda (26 črk)</option>
                </select>
            </label>
        </div>
        <div class="settings-row">
            <label class="form-label">Način
                <select id="abc-mode" class="form-select">
                    <option value="charToNum" selected>Črka → Številka</option>
                    <option value="numToChar">Številka → Črka</option>
                    <option value="sequence">Zaporedje</option>
                </select>
            </label>
        </div>
        <div class="settings-row" id="abc-seq-options" class="hidden">
            <label class="form-label">Vrsta zaporedja
                <select id="abc-seq-type" class="form-select">
                    <option value="charToNum" selected>Črke → Številke</option>
                    <option value="numToChar">Številke → Črke</option>
                </select>
            </label>
            <label class="form-label">Dolžina zaporedja
                <input type="number" id="abc-seq-length" class="form-input" value="3" min="2" max="10" placeholder="Dolžina">
            </label>
        </div>
        <div class="settings-row">
            <label class="form-label">Omejitev
                <select id="abc-limit-type" class="form-select">
                    <option value="unlimited" selected>Brez omejitve (celo abecedo)</option>
                    <option value="time">Časovna omejitev</option>
                    <option value="count">Določeno število nalog</option>
                </select>
            </label>
        </div>
        <div class="settings-row" id="abc-time-wrap" class="hidden">
            <label class="form-label">Časovno omejitev (s)
                <input type="number" id="abc-time-limit" class="form-input" value="60" min="10" max="300">
            </label>
        </div>
        <div class="settings-row" id="abc-count-wrap" class="hidden">
            <label class="form-label">Število nalog
                <input type="number" id="abc-target-count" class="form-input" value="25" min="5" max="100">
            </label>
        </div>
        <div class="settings-row">
            <label class="form-label" style="flex-direction:row; align-items:center; gap:8px;">
                <input type="checkbox" id="abc-track-stats" checked>
                <span>Spremljaj statistiko (pravilno/napačno, čas, povprečje)</span>
            </label>
        </div>
    `;

  const infoHtml = `
        <p class="mb-md">Cilj te naloge je popolna avtomatizacija poznavanja vrstnega reda črk v abecedi. Ko zagledaš črko (npr. K), moraš iz glave čim hitreje vedeti, katera številka po vrsti je (12).</p>
        <p style="margin-bottom: 16px;">V načinu "Zaporedja" uriš preslikavo več črk/številk hkrati za izboljšanje delovnega spomina.</p>
        <h4 style="margin-top: 24px; margin-bottom: 8px;">Preslikava abecede</h4>
        <dl class="abc-help-content" id="abc-help-content-dl"></dl>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="abc-start-screen" class="stage-layer">
                ${renderStartCard('V tej igri je tvoj cilj čim hitreje povezati črke abecede z njihovimi zaporednimi številkami (ali obratno). Vadba teh preslikav pomaga pri izboljšanju hitrosti razmišljanja in pomnjenja.', 'abc-start', '▶ Začni', 'Abeceda ↔ Številke')}
            </div>

            <div id="abc-play-layer" class="stage-layer hidden">
                <div class="abc-container">
                <div class="game-status-bar">
                    <div class="game-status-pill">
                        <span class="game-status-label">Pravilno</span>
                        <strong class="game-status-val" id="abc-correct">0</strong>
                    </div>
                    <div class="game-status-pill">
                        <span class="game-status-label">Napačno</span>
                        <strong class="game-status-val" id="abc-incorrect">0</strong>
                    </div>
                    <div class="game-status-pill" id="abc-time-wrap" style="display:none;">
                        <span class="game-status-label">Čas</span>
                        <strong class="game-status-val" id="abc-timer">00:00</strong>
                    </div>
                    <div class="game-status-pill" id="abc-count-wrap" style="display:none;">
                        <span class="game-status-label">Naloge</span>
                        <strong class="game-status-val"><span id="abc-count">0</span> / <span id="abc-total-count">0</span></strong>
                    </div>
                </div>
                <div id="abc-challenge" class="abc-challenge-display">-</div>

                <div class="abc-input-group">
                    <input type="text" id="abc-input" class="form-input" placeholder="Vnesi številko (1-25)" autocomplete="off">
                    <button id="abc-btn-check" class="btn" data-primary-action="true">Preveri</button>
                    <button id="abc-btn-skip" class="btn btn-outline">Preskoči</button>
                </div>

                <div id="abc-feedback" class="abc-feedback" aria-live="polite" aria-atomic="true"></div>

                <div class="abc-history-container">
                    <h4>Zgodovina odgovorov</h4>
                    <ul id="abc-history-list" class="abc-history-list">
                        <li style="color:var(--color-text-muted); justify-content:center;">(Zgodovina bo prikazana tukaj)</li>
                    </ul>
                </div>
            </div>
            </div>
        </div>
    `;

  return renderGameShell({
    title: 'Abeceda ↔ Številke',
    subtitle: 'Povezovanje črk in številk',
    settingsHtml,
    infoHtml,
    stageHtml,
  });
}

export function initAbeceda() {
  const state = new Proxy(
    {
      correct: 0,
      incorrect: 0,
      totalTime: 0,
      avgTime: 0,
      lang: 'sl',
      mode: 'charToNum',
      seqType: 'charToNum',
      seqLength: 3,
      limitType: 'unlimited',
      timeLimit: 60,
      targetCount: 25,
      trackStats: true,
      currentChallenge: '',
      correctAnswer: '',
    },
    {
      set(target, prop, value) {
        target[prop] = value;
        if (prop === 'correct') document.getElementById('abc-correct').textContent = value;
        if (prop === 'incorrect') document.getElementById('abc-incorrect').textContent = value;
        if (prop === 'currentChallenge')
          document.getElementById('abc-challenge').textContent = value;
        if (prop === 'mode') updateInputsBasedOnMode();
        return true;
      },
    }
  );

  const inputEl = document.getElementById('abc-input');
  const checkBtn = document.getElementById('abc-btn-check');
  const skipBtn = document.getElementById('abc-btn-skip');
  const feedbackEl = document.getElementById('abc-feedback');
  const historyList = document.getElementById('abc-history-list');

  const modeSel = document.getElementById('abc-mode');
  const langSel = document.getElementById('abc-lang');
  const seqTypeSel = document.getElementById('abc-seq-type');
  const seqLenInput = document.getElementById('abc-seq-length');
  const limitTypeSel = document.getElementById('abc-limit-type');
  const timeWrap = document.getElementById('abc-time-wrap');
  const countWrap = document.getElementById('abc-count-wrap');
  const timeLimitInput = document.getElementById('abc-time-limit');
  const targetCountInput = document.getElementById('abc-target-count');
  const trackStatsCheckbox = document.getElementById('abc-track-stats');

  const startBtn = document.getElementById('abc-start');
  const startLayer = document.getElementById('abc-start-screen');
  const playLayer = document.getElementById('abc-play-layer');

  let history = [];
  let startTime = 0;
  let questionsAnswered = 0;
  const gameTimer = createGameTimer(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, state.timeLimit - elapsed);
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    const timerDisplay = document.getElementById('abc-timer');
    if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
    if (remaining <= 0) {
      gameTimer.stop();
      endGame('time');
    }
  });

  function startTimer() {
    if (state.limitType !== 'time') return;
    startTime = Date.now();
    gameTimer.reset();
    gameTimer.start();
  }

  let availableChars = [];
  let availableNums = [];

  function stopTimer() {
    gameTimer.stop();
  }

  function getCurrentAbc() {
    return state.lang === 'en' ? angleskaAbeceda : slovenskaAbeceda;
  }
  function getCurrentNums() {
    return state.lang === 'en' ? vsaStevilaAbcEN : vsaStevilaAbcSLO;
  }

  // --- Pools ---
  function refillChars() {
    availableChars = shuffle(getCurrentAbc());
  }
  function refillNums() {
    availableNums = shuffle(getCurrentNums());
  }

  // --- UI Updates ---
  function updateInputsBasedOnMode() {
    if (state.mode === 'sequence') {
      seqTypeSel.classList.remove('hidden');
      seqLenInput.classList.remove('hidden');
      if (state.seqType === 'charToNum') {
        inputEl.placeholder = `Vnesi ${state.seqLength}-mestno zaporedje številk`;
        inputEl.inputMode = 'numeric';
      } else {
        inputEl.placeholder = `Vnesi ${state.seqLength}-črkovno zaporedje`;
        inputEl.inputMode = 'text';
      }
    } else {
      seqTypeSel.classList.add('hidden');
      seqLenInput.classList.add('hidden');
      if (state.mode === 'charToNum') {
        const max = state.lang === 'en' ? 26 : 25;
        inputEl.placeholder = `Vnesi številko (1-${max})`;
        inputEl.inputMode = 'numeric';
      } else {
        const end = state.lang === 'en' ? 'Z' : 'Ž';
        inputEl.placeholder = `Vnesi črko (A-${end})`;
        inputEl.inputMode = 'text';
      }
    }
  }

  function generateHelpContent() {
    const dl = document.getElementById('abc-help-content-dl');
    if (!dl) return;
    const abeceda = getCurrentAbc();
    dl.innerHTML = abeceda
      .map(
        (char, index) => `<div class="abc-help-item"><dt>${index + 1}</dt><dd>${char}</dd></div>`
      )
      .join('');
  }

  // --- Game Logic ---
  function generateChallenge() {
    inputEl.value = '';
    inputEl.focus();
    feedbackEl.textContent = '';
    feedbackEl.className = 'abc-feedback';

    // Update time/count display
    if (state.limitType === 'time') {
      document.getElementById('abc-time-wrap').classList.remove('hidden');
      document.getElementById('abc-count-wrap').classList.add('hidden');
      const m = String(Math.floor(state.timeLimit / 60)).padStart(2, '0');
      const s = String(state.timeLimit % 60).padStart(2, '0');
      document.getElementById('abc-timer').textContent = `${m}:${s}`;
      startTimer();
    } else if (state.limitType === 'count') {
      document.getElementById('abc-count-wrap').classList.remove('hidden');
      document.getElementById('abc-time-wrap').classList.add('hidden');
      document.getElementById('abc-total-count').textContent = state.targetCount;
      document.getElementById('abc-count').textContent = '0';
    } else {
      document.getElementById('abc-time-wrap').classList.add('hidden');
      document.getElementById('abc-count-wrap').classList.add('hidden');
    }

    const abeceda = getCurrentAbc();

    if (state.mode === 'charToNum') {
      if (availableChars.length === 0) refillChars();
      const char = availableChars.pop();
      state.correctAnswer = (abeceda.indexOf(char) + 1).toString();
      state.currentChallenge = char;
    } else if (state.mode === 'numToChar') {
      if (availableNums.length === 0) refillNums();
      const num = availableNums.pop();
      state.correctAnswer = abeceda[num - 1];
      state.currentChallenge = num.toString();
    } else if (state.mode === 'sequence') {
      let challenge = '';
      let answer = '';
      const len = Math.max(2, Math.min(10, parseInt(state.seqLength) || 3));

      if (state.seqType === 'charToNum') {
        for (let i = 0; i < len; i++) {
          if (availableChars.length === 0) refillChars();
          const c = availableChars.pop();
          challenge += c;
          answer += (abeceda.indexOf(c) + 1).toString();
        }
      } else {
        for (let i = 0; i < len; i++) {
          if (availableNums.length === 0) refillNums();
          const n = availableNums.pop();
          challenge += n.toString() + (i < len - 1 ? ' ' : '');
          answer += abeceda[n - 1];
        }
      }
      state.correctAnswer = answer;
      state.currentChallenge = challenge;
    }
  }

  function checkAnswer() {
    const raw = inputEl.value.trim();
    if (!raw) return;

    let userAns = raw;
    if (
      state.mode === 'numToChar' ||
      (state.mode === 'sequence' && state.seqType === 'numToChar')
    ) {
      userAns = raw.toUpperCase();
    }

    const isCorrect = userAns === state.correctAnswer;

    if (isCorrect) {
      state.correct++;
      statsManager.addXp(10);
      feedbackEl.innerHTML = `Odlično! "${escapeHtml(state.currentChallenge)}" = <b>${escapeHtml(state.correctAnswer)}</b>`;
      feedbackEl.className = 'abc-feedback correct';
      logHistory(state.currentChallenge, raw, state.correctAnswer, true);

      questionsAnswered++;

      // Update count display
      if (state.limitType === 'count') {
        document.getElementById('abc-count').textContent = questionsAnswered;
      }

      // Check if count limit reached
      if (state.limitType === 'count' && questionsAnswered >= state.targetCount) {
        setTimeout(() => endGame('count'), 150);
      } else {
        setTimeout(() => generateChallenge(), 150);
      }
    } else {
      state.incorrect++;
      feedbackEl.innerHTML = `Napačno. Pravilen odgovor za "${escapeHtml(state.currentChallenge)}" je: <b>${escapeHtml(state.correctAnswer)}</b>`;
      feedbackEl.className = 'abc-feedback incorrect shake';
      logHistory(state.currentChallenge, raw, state.correctAnswer, false);
      inputEl.focus();
      inputEl.select();
    }
  }

  function logHistory(challenge, userAns, expected, isCorrect) {
    history.unshift({ challenge, userAns, expected, isCorrect });
    renderAnswerHistory(historyList, history);
  }

  // --- Event Listeners ---
  function handleKeyPress(e) {
    if (e.key === 'Enter') checkAnswer();
  }
  inputEl.addEventListener('keydown', handleKeyPress);

  checkBtn.addEventListener('click', checkAnswer);
  skipBtn.addEventListener('click', () => {
    logHistory(state.currentChallenge, '(preskočeno)', state.correctAnswer, false);
    generateChallenge();
  });

  startBtn.addEventListener('click', () => {
    startLayer.classList.add('hidden');
    playLayer.classList.remove('hidden');
    inputEl.focus();
  });

  // Handle Settings changes from the Game Settings panel
  bindGameSettings('abeceda', {
    defaults: {
      lang: 'sl',
      mode: 'charToNum',
      seqType: 'charToNum',
      seqLength: 3,
      limitType: 'time',
      timeLimit: 60,
      targetCount: 25,
      trackStats: true,
    },
    apply: saved => {
      state.lang = saved.lang || 'sl';
      state.mode = saved.mode || 'charToNum';
      state.seqType = saved.seqType || 'charToNum';
      state.seqLength = saved.seqLength || 3;
      state.limitType = saved.limitType || 'time';
      state.timeLimit = saved.timeLimit || 60;
      state.targetCount = saved.targetCount || 25;
      state.trackStats = saved.trackStats !== false;
      if (langSel) langSel.value = state.lang;
      if (modeSel) modeSel.value = state.mode;
      if (seqTypeSel) seqTypeSel.value = state.seqType;
      if (seqLenInput) seqLenInput.value = state.seqLength;
      if (limitTypeSel) limitTypeSel.value = state.limitType;
      if (timeLimitInput) timeLimitInput.value = state.timeLimit;
      if (targetCountInput) targetCountInput.value = state.targetCount;
      if (trackStatsCheckbox) trackStatsCheckbox.checked = state.trackStats;
    },
    readFromUI: () => {
      state.lang = langSel.value;
      state.mode = modeSel.value;
      state.seqType = seqTypeSel.value;
      state.seqLength = parseInt(seqLenInput.value) || 3;
      state.limitType = limitTypeSel.value;
      state.timeLimit = parseInt(timeLimitInput.value) || 60;
      state.targetCount = parseInt(targetCountInput.value) || 25;
      state.trackStats = trackStatsCheckbox.checked;
    },
    collect: () => ({
      lang: state.lang,
      mode: state.mode,
      seqType: state.seqType,
      seqLength: state.seqLength,
      limitType: state.limitType,
      timeLimit: state.timeLimit,
      targetCount: state.targetCount,
      trackStats: state.trackStats,
    }),
    afterApply: () => {
      state.correct = 0;
      state.incorrect = 0;
      state.totalTime = 0;
      state.avgTime = 0;
      history = [];
      historyList.innerHTML = `<li style="color:var(--color-text-muted); justify-content:center;">(Zgodovina bo prikazana tukaj)</li>`;

      generateHelpContent();
      refillChars();
      refillNums();
      generateChallenge();

      // Hide start screen if it was open
      startLayer.classList.add('hidden');
      playLayer.classList.remove('hidden');
    },
  });

  // Limit type toggle
  limitTypeSel.addEventListener('change', () => {
    timeWrap.classList.toggle('hidden', limitTypeSel.value !== 'time');
    countWrap.classList.toggle('hidden', limitTypeSel.value !== 'count');
  });

  // Mode select quick toggles for displaying secondary options in panel
  modeSel.addEventListener('change', e => {
    if (e.target.value === 'sequence') {
      seqTypeSel.classList.remove('hidden');
      seqLenInput.classList.remove('hidden');
    } else {
      seqTypeSel.classList.add('hidden');
      seqLenInput.classList.add('hidden');
    }
  });

  timeWrap.classList.toggle('hidden', limitTypeSel.value !== 'time');
  countWrap.classList.toggle('hidden', limitTypeSel.value !== 'count');

  generateHelpContent();
  refillChars();
  refillNums();
  generateChallenge();

  // endGame je znotraj initAbeceda, ker bere zaprte spremenljivke (state, playLayer, timerInterval)
  function endGame(reason) {
    stopTimer();
    const totalAnswered = state.correct + state.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((state.correct / totalAnswered) * 100) : 0;

    let message = '';
    if (reason === 'time') {
      message = `Čas je potekel! Pravilno: ${state.correct}, Napačno: ${state.incorrect}, Natančnost: ${accuracy}%`;
    } else if (reason === 'count') {
      message = `Dosegli ste cilj! Pravilno: ${state.correct}, Napačno: ${state.incorrect}, Natančnost: ${accuracy}%`;
    } else {
      message = `Igra končana. Pravilno: ${state.correct}, Napačno: ${state.incorrect}, Natančnost: ${accuracy}%`;
    }

    showToast(message, { type: 'info', timeout: 5000 });

    // Show stats
    if (state.trackStats) {
      // Use statsManager or localStorage instead of console
      const stats = {
        pravilno: state.correct,
        napacno: state.incorrect,
        natancnost: accuracy + '%',
        povprecni_cas: state.avgTime ? (state.avgTime / 1000).toFixed(2) + 's' : 'N/A',
      };
      saveJson('abc_last_stats', stats);
    }

    // Reset for new game
    questionsAnswered = 0;
    stopTimer();
    startLayer.classList.remove('hidden');
    playLayer.classList.add('hidden');
  }

  return function cleanup() {
    inputEl.removeEventListener('keydown', handleKeyPress);
    gameTimer.stop();
  };
}
