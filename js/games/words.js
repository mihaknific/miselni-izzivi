// js/games/words.js — Anagrami / Besedna fluentnost (ES6 modul)
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { showToast } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';

const WORD_SETS = [
  {
    target: 'KARTICA',
    letters: ['K', 'A', 'R', 'T', 'I', 'C', 'A'],
    valid: ['KARTICA', 'KARTA', 'TRAK', 'RACA', 'TIR', 'RAK', 'TAK', 'KAT', 'RIT', 'AKT'],
  },
  {
    target: 'SPOMIN',
    letters: ['S', 'P', 'O', 'M', 'I', 'N'],
    valid: ['SPOMIN', 'OPIS', 'NOS', 'SIM', 'NIP', 'SON', 'PIN', 'MON'],
  },
  {
    target: 'MOŽGANI',
    letters: ['M', 'O', 'Ž', 'G', 'A', 'N', 'I'],
    valid: ['MOŽGANI', 'ŽIGA', 'NIMA', 'GANI', 'GIN', 'NAŽ', 'IMA', 'ONA'],
  },
  {
    target: 'BESEDA',
    letters: ['B', 'E', 'S', 'E', 'D', 'A'],
    valid: ['BESEDA', 'SEDA', 'BES', 'DAS', 'SAD'],
  },
  {
    target: 'RAČUNALNIK',
    letters: ['R', 'A', 'Č', 'U', 'N', 'A', 'L', 'N', 'I', 'K'],
    valid: ['RAČUNALNIK', 'LUNA', 'RUNA', 'KLAN', 'KLIN', 'NUJNA', 'LUKA', 'NUK', 'LAK', 'LAN'],
  },
  {
    target: 'MISLEC',
    letters: ['M', 'I', 'S', 'L', 'E', 'C'],
    valid: ['MISLEC', 'SLIM', 'CELI', 'MIS', 'CEL', 'LES', 'SIM'],
  },
  {
    target: 'ZNANOST',
    letters: ['Z', 'N', 'A', 'N', 'O', 'S', 'T'],
    valid: ['ZNANOST', 'STAN', 'TONA', 'NAST', 'SON', 'NOS', 'TAS', 'TON'],
  },
  {
    target: 'POLITIKA',
    letters: ['P', 'O', 'L', 'I', 'T', 'I', 'K', 'A'],
    valid: ['POLITIKA', 'PLOT', 'PILOT', 'KILAT', 'PIKA', 'KOLI', 'POKIT', 'PAL', 'KOT', 'POL'],
  },
  {
    target: 'STEKLENICA',
    letters: ['S', 'T', 'E', 'K', 'L', 'E', 'N', 'I', 'C', 'A'],
    valid: ['STEKLENICA', 'SENCE', 'STENA', 'KLETI', 'NAKIT', 'LESK', 'SKIT', 'LES', 'TEN'],
  },
  {
    target: 'KREPOST',
    letters: ['K', 'R', 'E', 'P', 'O', 'S', 'T'],
    valid: ['KREPOST', 'STROP', 'SPORT', 'PRESTO', 'RPOST', 'SEPT', 'POTEK', 'REP', 'ROK', 'POT'],
  },
];

export function renderWords() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Časovno okno (sekunde)
                <select id="words-duration" class="form-select">
                    <option value="45">45 sekund</option>
                    <option value="60" selected>60 sekund</option>
                    <option value="90">90 sekund</option>
                </select>
            </label>
        </div>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="words-start-screen" class="stage-layer">
                ${renderStartCard(
                  'Sestavi čim več različnih slovenskih besed iz ponujenih črk. Vsako črko lahko uporabiš le tolikokrat, kot je prikazana.',
                  'words-start-btn',
                  '▶ Začni preizkus',
                  'Anagrami & Besedna fluentnost'
                )}
            </div>

            <div id="words-play-screen" class="stage-layer hidden">
                <div class="words-stage-container">
                    <div id="words-timer" class="words-timer-bar">Preostali čas: 60s</div>
                    <div id="words-tiles" class="words-scrambled-box"></div>
                    <div id="words-target-info" class="muted-xs" style="text-align:center;">Najdene veljavne besede: <span id="words-target-stats">...</span></div>

                    <form id="words-form" class="words-input-form" onsubmit="return false;">
                        <input id="words-input" type="text" autocomplete="off" class="form-input words-input" placeholder="Vnesi besedo...">
                        <button type="submit" id="words-submit" class="btn">Dodaj</button>
                        <button type="button" id="words-hint-btn" class="btn btn-outline" style="padding: 0.5rem 0.8rem;" title="Namig (razkrij prva črko)">💡 Namig</button>
                    </form>

                    <div id="words-found-container" class="words-found-list"></div>
                </div>
            </div>

            <div id="words-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align: center; max-width: 360px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title result-success" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--color-success);">Čas iztekel! 📝</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Najdenih besed: <strong id="words-final-count">0</strong></p>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-sm);">Dosežene točke: <strong id="words-final-score">0</strong></p>
                    <button id="words-retry-btn" class="btn">Poskusi znova</button>
                    <button id="words-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 style="margin-bottom: 8px;">O preizkusu besedne fluentnosti (Verbal Fluency)</h4>
        <p style="margin-bottom: 12px;">Besedna fluentnost je klasični preizkus za merjenje <strong>leksikalnega dostopa, spominskega priklica in lingvistične prožnosti</strong>.</p>
        <h4 style="margin-bottom: 8px;">Pravila igre:</h4>
        <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.6;">
            <li>Iz ponujenih črk sestavi čim več različnih slovenskih besed.</li>
            <li>Vsako črko lahko v posamezni besedi uporabiš le tolikokrat, kot je prikazana.</li>
            <li>Daljše besede prinašajo večje število točk!</li>
        </ul>
    `;

  return renderGameShell({
    title: 'Besedna fluentnost',
    subtitle: 'Anagrami in hitro priklicovanje besed.',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initWords() {
  let durationSec = 60;
  let timeRemaining = 60;
  let timerInterval = null;

  let currentSet = null;
  let foundWords = new Set();
  let totalScore = 0;

  const startScreen = document.getElementById('words-start-screen');
  const playScreen = document.getElementById('words-play-screen');
  const endScreen = document.getElementById('words-end-screen');

  const timerEl = document.getElementById('words-timer');
  const tilesEl = document.getElementById('words-tiles');
  const inputEl = document.getElementById('words-input');
  const formEl = document.getElementById('words-form');
  const foundContainer = document.getElementById('words-found-container');

  const startBtn = document.getElementById('words-start-btn');
  const retryBtn = document.getElementById('words-retry-btn');

  function readSettingsFromUI() {
    const durEl = document.getElementById('words-duration');
    if (durEl) durationSec = parseInt(durEl.value, 10) || 60;
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

  function renderTiles() {
    if (!tilesEl || !currentSet) return;
    tilesEl.innerHTML = '';
    currentSet.letters.forEach(char => {
      const tile = document.createElement('div');
      tile.className = 'words-letter-tile';
      tile.textContent = char;
      tilesEl.appendChild(tile);
    });
  }

  const targetStatsEl = document.getElementById('words-target-stats');
  const hintBtn = document.getElementById('words-hint-btn');

  function updateTargetStats() {
    if (!targetStatsEl || !currentSet) return;
    const total = currentSet.valid.length;
    const foundCount = Array.from(foundWords).filter(w => currentSet.valid.includes(w)).length;
    targetStatsEl.textContent = `${foundCount} / ${total} najdenih glavnih besed`;
  }

  function giveHint() {
    if (!currentSet) return;
    const missing = currentSet.valid.filter(w => !foundWords.has(w));
    if (missing.length === 0) {
      showToast('Vse glavne besede so že najdene!', { type: 'info' });
      return;
    }
    const hintWord = missing[Math.floor(Math.random() * missing.length)];
    const hintText = `Namig za besedo (${hintWord.length} črk): začne se na "${hintWord[0]}"`;
    showToast(hintText, { type: 'info' });
  }

  function submitWord() {
    if (!inputEl) return;
    const val = inputEl.value.trim().toUpperCase();
    inputEl.value = '';

    if (!val || foundWords.has(val)) {
      sounds.play('error');
      return;
    }

    // Strožje: šteje le beseda iz seznama glavnih besed (prepreči nesmisle kot ZZZ)
    const isValid = currentSet.valid.includes(val) && isConstructible(val, currentSet.letters);

    if (isValid) {
      foundWords.add(val);
      const wordScore = val.length * 10;
      totalScore += wordScore;

      sounds.play('correct');

      const chip = document.createElement('span');
      chip.className = 'words-found-chip';
      chip.textContent = `${val} (+${wordScore})`;
      if (foundContainer) foundContainer.appendChild(chip);
      updateTargetStats();
    } else {
      sounds.play('error');
    }
  }

  function isConstructible(word, availableLetters) {
    const counts = {};
    for (const char of availableLetters) {
      counts[char] = (counts[char] || 0) + 1;
    }
    for (const char of word) {
      if (!counts[char] || counts[char] <= 0) return false;
      counts[char]--;
    }
    return true;
  }

  function tick() {
    timeRemaining--;
    if (timerEl) timerEl.textContent = `Preostali čas: ${timeRemaining}s`;

    if (timeRemaining <= 0) {
      finishGame();
    }
  }

  function finishGame() {
    if (timerInterval) clearInterval(timerInterval);

    statsManager.addXp(totalScore);
    statsManager.saveRecord('words', {
      foundCount: foundWords.size,
      score: totalScore,
      duration: durationSec,
    });

    const countEl = document.getElementById('words-final-count');
    const scoreEl = document.getElementById('words-final-score');

    if (countEl) countEl.textContent = foundWords.size;
    if (scoreEl) scoreEl.textContent = totalScore;

    showLayer(endScreen);
  }

  function startNewGame() {
    readSettingsFromUI();
    timeRemaining = durationSec;
    foundWords.clear();
    totalScore = 0;
    if (foundContainer) foundContainer.innerHTML = '';

    currentSet = WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)];
    renderTiles();
    updateTargetStats();

    if (timerEl) timerEl.textContent = `Preostali čas: ${timeRemaining}s`;
    showLayer(playScreen);

    if (inputEl) inputEl.focus();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(tick, 1000);
  }

  if (startBtn) startBtn.addEventListener('click', startNewGame);
  if (retryBtn) retryBtn.addEventListener('click', startNewGame);
  document.getElementById('words-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });
  if (hintBtn) hintBtn.addEventListener('click', giveHint);
  if (formEl)
    formEl.addEventListener('submit', e => {
      e.preventDefault();
      submitWord();
    });

  const keyHandler = e => {
    if (e.key === 'Enter' && !playScreen.classList.contains('hidden')) {
      submitWord();
    } else if (e.key === 'Enter') {
      if (!startScreen.classList.contains('hidden')) {
        startNewGame();
      } else if (!endScreen.classList.contains('hidden')) {
        startNewGame();
      }
    }
  };

  document.addEventListener('keydown', keyHandler);

  return () => {
    if (timerInterval) clearInterval(timerInterval);
    document.removeEventListener('keydown', keyHandler);
  };
}
