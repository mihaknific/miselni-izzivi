import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { renderStartCard } from './game-start.js';
import { statsManager } from '../stats.js';
import { escapeHtml } from '../ui.js';
import { sounds } from '../sounds.js';

const vsaStevilaDvo = Array.from({ length: 90 }, (_, i) => i + 10);
const vsaStevilaTri = Array.from({ length: 900 }, (_, i) => i + 100);

export function renderKvadriranje() {
  const settingsHtml = `
        <select id="kv-mode" class="form-select">
            <option value="dvo" selected>Dvomestna števila (10-99)</option>
            <option value="five">Števila na 5 (15, 25, 35 ... 95)</option>
            <option value="tri">Trimestna števila (100-999)</option>
        </select>
    `;

  const statusHtml = `
        <div class="status-item">Pravilno: <span id="kv-correct">0</span></div>
        <div class="status-item">Napačno: <span id="kv-incorrect">0</span></div>
    `;

  const infoHtml = `
        <p style="margin-bottom: 12px;">Tehnika kvadriranja dvomestnih in trimestnih števil ti omogoča hitro računanje na pamet in služi kot osnova za bolj napredno matematiko v glavi.</p>
        <h4 style="margin-top: 20px;">Kako deluje?</h4>
        <ol style="margin-left: 20px; margin-bottom: 16px;">
            <li style="margin-bottom: 8px;">Uporabi formulo <code>n² = (n - d) × (n + d) + d²</code>, kjer je <code>d</code> razlika do najbližje desetice ali stotice.</li>
            <li style="margin-bottom: 8px;">Za števila, ki se končajo na 5 (npr. 35): pomnoži prvo števko z naslednjo (3 × 4 = 12) in na konec dodaš 25 (1225).</li>
        </ol>
        <p style="margin-top: 16px; font-size: 0.9em; color: var(--color-text-muted);">Če nalogo rešiš napačno, se bo za ta izračun samodejno prikazala matematična razlaga pod vnosnim poljem.</p>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="kv-start-screen" class="stage-layer">
                ${renderStartCard('Cilj te igre je izuriti računanje kvadratov dvomestnih in trimestnih števil na pamet s pomočjo algebrske tehnike (n-d)(n+d) + d². To zelo poveča matematično fluidnost in samozavest.', 'kv-start', '▶ Začni', 'Hitro Kvadriranje')}
            </div>

            <div id="kv-play-layer" class="stage-layer hidden">
                <div class="kv-container">
                <div style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 4px;">Izračunaj kvadrat števila:</div>
                <div id="kv-challenge" class="kv-challenge-display">-</div>
                
                <div class="kv-input-group">
                    <input type="number" id="kv-input" class="form-input" placeholder="Vnesi rezultat" autocomplete="off">
                    <button id="kv-btn-check" class="btn">Preveri</button>
                    <button id="kv-btn-skip" class="btn btn-outline">Preskoči</button>
                </div>

                <div id="kv-feedback" class="kv-feedback"></div>
                <div id="kv-explanation" class="kv-explanation hidden"></div>
                <div id="kv-help-content-div" class="kv-explanation" style="margin-top: 8px;"></div>

                <div class="kv-history-container">
                    <h4>Zgodovina odgovorov</h4>
                    <ul id="kv-history-list" class="kv-history-list">
                        <li style="color:var(--color-text-muted); justify-content:center;">(Zgodovina bo prikazana tukaj)</li>
                    </ul>
                </div>
            </div>
            </div>
        </div>
    `;

  return renderGameShell({
    title: 'Hitro kvadriranje',
    subtitle: 'Kvadriranje dvomestnih in trimestnih števil na pamet.',
    statusHtml,
    settingsHtml,
    infoHtml,
    stageHtml,
  });
}

export function initKvadriranje() {
  const state = new Proxy(
    {
      correct: 0,
      incorrect: 0,
      mode: 'dvo',
      currentNum: 0,
      correctAnswer: 0,
    },
    {
      set(target, prop, value) {
        target[prop] = value;
        if (prop === 'correct') document.getElementById('kv-correct').textContent = value;
        if (prop === 'incorrect') document.getElementById('kv-incorrect').textContent = value;
        if (prop === 'currentNum') {
          document.getElementById('kv-challenge').innerHTML = `${value}<sup>2</sup>`;
          updateHelpContent(value);
        }
        return true;
      },
    }
  );

  const inputEl = document.getElementById('kv-input');
  const checkBtn = document.getElementById('kv-btn-check');
  const skipBtn = document.getElementById('kv-btn-skip');
  const feedbackEl = document.getElementById('kv-feedback');
  const explanationEl = document.getElementById('kv-explanation');
  const historyList = document.getElementById('kv-history-list');
  const helpContentDiv = document.getElementById('kv-help-content-div');

  const modeSel = document.getElementById('kv-mode');
  const startBtn = document.getElementById('kv-start');
  const startLayer = document.getElementById('kv-start-screen');
  const playLayer = document.getElementById('kv-play-layer');

  let history = [];
  let availableDvo = [];
  let availableTri = [];

  // --- Pools ---
  function refillDvo() {
    availableDvo = [...vsaStevilaDvo].sort(() => Math.random() - 0.5);
  }
  function refillTri() {
    availableTri = [...vsaStevilaTri].sort(() => Math.random() - 0.5);
  }

  // --- Help and Explanations ---
  function updateHelpContent(n) {
    if (!n || !helpContentDiv) return;
    let html = `<p>Uporabimo formulo: <code>n² = (n - d) * (n + d) + d²</code>, kjer je <code>d</code> razlika do najbližje desetice ali stotice.</p>`;

    const isTri = n >= 100;
    const base = isTri ? 100 : 10;
    const rem = n % base;

    let diff, nearest;
    if (rem <= base / 2) {
      diff = rem;
      nearest = n - diff;
    } else {
      diff = base - rem;
      nearest = n + diff;
    }

    const t1 = n - diff;
    const t2 = n + diff;
    const dSq = diff * diff;

    html += `<p>Najbližja ${isTri ? 'stotica' : 'desetica'} je <b>${nearest}</b>. Razlika (d) = |${n} - ${nearest}| = <b>${diff}</b>.</p>`;
    html += `<p>Izračun: (${n} - ${diff}) * (${n} + ${diff}) + ${diff}²</p>`;
    html += `<p>&rarr; ${t1} * ${t2} + ${dSq}</p>`;
    html += `<p>&rarr; ${t1 * t2} + ${dSq} = ?</p>`;

    helpContentDiv.innerHTML = html;
  }

  function getExplanation(n, correctAns) {
    const isTri = n >= 100;
    const base = isTri ? 100 : 10;
    const rem = n % base;

    let diff, nearest;
    if (rem <= base / 2) {
      diff = rem;
      nearest = n - diff;
    } else {
      diff = base - rem;
      nearest = n + diff;
    }
    const t1 = n - diff;
    const t2 = n + diff;

    return `<b>Razlaga za ${n}²:</b><br>Najbližja ${isTri ? 'stotica' : 'desetica'}: ${nearest}. Razlika (d) = ${diff}.<br>Formula: (${t1})*(${t2}) + ${diff}² = ${t1 * t2} + ${diff * diff} = <b>${correctAns}</b>`;
  }

  // --- Game Logic ---
  const vsaStevilaFive = [15, 25, 35, 45, 55, 65, 75, 85, 95];
  let availableFive = [];

  function refillFive() {
    availableFive = [...vsaStevilaFive].sort(() => Math.random() - 0.5);
  }

  function generateChallenge() {
    inputEl.value = '';
    inputEl.focus();
    feedbackEl.textContent = '';
    explanationEl.innerHTML = '';
    explanationEl.classList.add('hidden');

    let num;
    if (state.mode === 'five') {
      if (availableFive.length === 0) refillFive();
      num = availableFive.pop();
    } else if (state.mode === 'dvo') {
      if (availableDvo.length === 0) refillDvo();
      num = availableDvo.pop();
    } else {
      if (availableTri.length === 0) refillTri();
      num = availableTri.pop();
    }
    state.correctAnswer = num * num;
    state.currentNum = num;
  }

  function checkAnswer() {
    const raw = inputEl.value.trim();
    if (!raw) return;
    const userAns = parseInt(raw);

    const isCorrect = userAns === state.correctAnswer;

    if (isCorrect) {
      state.correct++;
      statsManager.addXp(10);
      feedbackEl.innerHTML = `Pravilno! ${state.currentNum}² = <b>${state.correctAnswer}</b>.`;
      feedbackEl.className = 'kv-feedback correct flash-success';
      explanationEl.classList.add('hidden'); // Skrij razlago, če je pravilno
      logHistory(state.currentNum, raw, state.correctAnswer, true);
      sounds.playSuccess();

      setTimeout(() => {
        feedbackEl.className = 'kv-feedback';
        generateChallenge();
      }, 150);
    } else {
      state.incorrect++;
      feedbackEl.innerHTML = `Napačno! ${state.currentNum}² = <b>${state.correctAnswer}</b>.<br><small>Tvoj odgovor: ${escapeHtml(raw || '?')}</small>`;
      feedbackEl.className = 'kv-feedback wrong shake';
      logHistory(state.currentNum, raw, state.correctAnswer, false);
      sounds.playError();

      const inputWrap = inputEl.parentElement;
      if (inputWrap) {
        inputWrap.classList.add('shake');
        setTimeout(() => inputWrap.classList.remove('shake'), 400);
      }

      // Prikaži matematično razlago
      explanationEl.innerHTML = getExplanation(state.currentNum, state.correctAnswer);
      explanationEl.classList.remove('hidden');

      inputEl.value = '';
      inputEl.focus();
    }
  }

  function logHistory(n, userAns, expected, isCorrect) {
    history.unshift({ challenge: n, userAns, expected, isCorrect });
    if (history.length > 20) history.pop();

    historyList.innerHTML = history
      .map(item => {
        const ansClass = item.isCorrect ? 'hist-correct' : 'hist-incorrect';
        const expHtml = !item.isCorrect
          ? ` <span style="font-size:0.8rem;">(Pričakovano: <span class="hist-expected">${item.expected}</span>)</span>`
          : '';
        return `<li>
                <span class="hist-q">${item.challenge}² &rarr;</span> 
                <div>
                    <span class="${ansClass} hist-a">${escapeHtml(item.userAns || '(prazno)')}</span>
                    ${expHtml}
                </div>
            </li>`;
      })
      .join('');
  }

  // --- Event Listeners ---
  function handleKeyPress(e) {
    if (e.key === 'Enter') checkAnswer();
  }
  inputEl.addEventListener('keydown', handleKeyPress);

  checkBtn.addEventListener('click', checkAnswer);
  skipBtn.addEventListener('click', () => {
    logHistory(state.currentNum, '(preskočeno)', state.correctAnswer, false);
    generateChallenge();
  });

  startBtn.addEventListener('click', () => {
    startLayer.classList.add('hidden');
    playLayer.classList.remove('hidden');
    inputEl.focus();
  });

  // Handle Settings changes from the Game Settings panel
  setGameSettingsApplyHandler(() => {
    state.mode = modeSel.value;
    state.correct = 0;
    state.incorrect = 0;
    history = [];
    historyList.innerHTML = `<li style="color:var(--color-text-muted); justify-content:center;">(Zgodovina bo prikazana tukaj)</li>`;
    explanationEl.classList.add('hidden');

    refillFive();
    refillDvo();
    refillTri();
    generateChallenge();
    startLayer.classList.add('hidden');
    playLayer.classList.remove('hidden');
  });

  // Init
  refillFive();
  refillDvo();
  refillTri();
  state.mode = 'dvo';
  generateChallenge();

  return function cleanup() {
    inputEl.removeEventListener('keypress', handleKeyPress);
  };
}
