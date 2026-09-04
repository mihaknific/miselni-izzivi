// js/games/stroop.js - Stroopov test, ES6 modul
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { Settings } from '../store.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { showToast } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { shuffle } from '../utils/rng.js';

const colors = [
  { name: 'Rdeča', hex: '#ef4444' },
  { name: 'Modra', hex: '#3b82f6' },
  { name: 'Zelena', hex: '#22c55e' },
  { name: 'Rumena', hex: '#eab308' },
  { name: 'Vijolična', hex: '#a855f7' },
  { name: 'Oranžna', hex: '#f97316' },
];

export function renderStroop() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Število prikazanih besed
                <select id="st-rounds" class="form-select">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20" selected>20</option>
                    <option value="30">30</option>
                </select>
            </label>
            <label class="form-label">Zahtevnost (barv na izbiro)
                <select id="st-color-count" class="form-select">
                    <option value="3">3</option>
                    <option value="4" selected>4</option>
                    <option value="6">6</option>
                </select>
            </label>
        </div>
        <div class="settings-row">
            <label class="form-label">Časovna omejitev na besedo (sekunde)
                <input id="st-timeout" class="form-input" type="number" min="0" max="10" step="1" value="0" placeholder="0 = brez omejitve">
            </label>
        </div>
        <div id="st-validate" class="validation-msg hidden"></div>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="st-start-screen" class="stage-layer">
                ${renderStartCard('V tej igri izberi barvo besede, ne napisane vsebine. Klikni barvo črnila, ki se ujema s prikazano besedo.', 'st-start', '▶ Začni', 'Stroopov test')}
            </div>

            <div id="st-play-layer" class="stage-layer hidden">
                <div class="st-play-column">
                    <div id="st-word" class="st-word">Pritisni Začni</div>
                    <div id="st-buttons" class="st-buttons"></div>
                    <p id="st-feedback" class="st-feedback"></p>
                </div>
            </div>

            <div id="st-end" class="stage-layer hidden">
                <div class="st-victory-content" style="text-align: center; max-width: 340px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--custom-heading, var(--color-primary));">Konec igre!</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Rezultat: <strong id="st-final-score"></strong> / <strong id="st-final-total"></strong></p>
                    <p id="st-accuracy" class="muted-xs" style="margin-bottom: var(--spacing-sm);"></p>
                    <div id="st-analytics" style="text-align: left; background: var(--color-background); padding: var(--spacing-sm); border-radius: var(--border-radius); margin-bottom: var(--spacing-md); font-size: 0.85rem; line-height: 1.4;"></div>
                    <button id="st-retry" class="btn">Igraj znova</button>
                    <button id="st-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <p style="margin-bottom: 12px;">Stroop test meri tvojo sposobnost inhibicije in pozornosti (Stroopov učinek).</p>
        <p style="margin-bottom: 12px;">Na zaslonu se bo prikazala beseda barve, vendar je lahko beseda obarvana z drugo barvo. Tvoja naloga je prepoznati <b>PRAVO BARVO BESEDILA</b>, ne tisto, kar piše.</p>
        <div style="background: rgba(var(--color-primary-rgb), 0.1); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <strong>Primer:</strong> Če piše <span style="color:red; font-weight:bold;">MODRA</span> (obarvano rdeče), je pravilen odgovor <strong>Rdeča</strong>.
        </div>
        <p style="color: var(--color-text-muted); font-size: 0.9em;">Bodi pozoren/na in hiter/a!</p>
    `;

  return renderGameShell({
    title: 'Stroopov test',
    subtitle: 'Določi barvo pisave, ne preberi napisane besede.',
    statusHtml:
      '<span>Runda: <strong id="st-round">0</strong> / <strong id="st-total">20</strong></span><span>Točke: <strong id="st-score">0</strong></span>',
    settingsHtml,
    infoHtml,
    stageHtml,
  });
}

export function initStroop() {
  let totalRounds = 20;
  let colorCount = 4;
  let timeoutMs = 0;
  let canAnswer = true;
  let currentCorrectName = null;
  let currentTrialType = null;
  let roundStartTime = 0;
  let roundTimeout = null;
  const roundDelay = 700;

  const wordEl = document.getElementById('st-word');
  const buttonsEl = document.getElementById('st-buttons');
  const feedbackEl = document.getElementById('st-feedback');
  const roundEl = document.getElementById('st-round');
  const totalEl = document.getElementById('st-total');
  const scoreEl = document.getElementById('st-score');
  const endEl = document.getElementById('st-end');
  const startScreen = document.getElementById('st-start-screen');
  const playLayer = document.getElementById('st-play-layer');
  const startBtn = document.getElementById('st-start');
  const retryBtn = document.getElementById('st-retry');
  const roundsEl = document.getElementById('st-rounds');
  const ccEl = document.getElementById('st-color-count');
  const timeoutEl = document.getElementById('st-timeout');
  const msgEl = document.getElementById('st-validate');

  const state = new Proxy(
    { score: 0, currentRound: 0 },
    {
      set(target, prop, value) {
        target[prop] = value;
        if (prop === 'score' && scoreEl) scoreEl.textContent = value;
        if (prop === 'currentRound' && roundEl) roundEl.textContent = value;
        return true;
      },
    }
  );

  function clearRoundTimeout() {
    if (roundTimeout) {
      clearTimeout(roundTimeout);
      roundTimeout = null;
    }
  }

  function persistSettings() {
    const rounds = parseInt(roundsEl?.value || '20', 10) || 20;
    const cc = parseInt(ccEl?.value || '4', 10) || 4;
    const to = parseInt(timeoutEl?.value || '0', 10) || 0;
    Settings.set('game.stroop', { rounds, timeout: to, colorCount: cc });
  }

  async function loadSettings() {
    const saved = await Settings.get('game.stroop', null);
    if (!saved) return;
    if (roundsEl && saved.rounds) roundsEl.value = String(saved.rounds);
    if (ccEl && saved.colorCount) ccEl.value = String(saved.colorCount);
    if (timeoutEl && typeof saved.timeout !== 'undefined') {
      let to = saved.timeout;
      if (to > 20) to = Math.round(to / 1000); // migrate old ms format
      timeoutEl.value = String(to);
    }
  }

  function showStartScreen() {
    startScreen?.classList.remove('hidden');
    playLayer?.classList.add('hidden');
    endEl?.classList.add('hidden');
  }

  function showPlayScreen() {
    startScreen?.classList.add('hidden');
    playLayer?.classList.remove('hidden');
    endEl?.classList.add('hidden');
  }

  function validateSettings() {
    const rounds = parseInt(roundsEl?.value || '0', 10);
    const cc = parseInt(ccEl?.value || '0', 10);
    const to = parseInt(timeoutEl?.value || '0', 10) || 0;
    let err = '';

    if (isNaN(rounds) || rounds < 1 || rounds > 200) {
      err = 'Število nalog mora biti med 1 in 200.';
    } else if (isNaN(cc) || cc < 2 || cc > colors.length) {
      err = `Število barv mora biti med 2 in ${colors.length}.`;
    } else if (to < 0 || to > 10) {
      err = 'Časovna omejitev mora biti med 0 in 10 sekund.';
    }

    if (msgEl) {
      msgEl.textContent = err;
      msgEl.classList.toggle('hidden', !err);
    }
    if (startBtn) startBtn.toggleAttribute('disabled', !!err);

    if (err) {
      return false;
    }
    return true;
  }

  function applySettingsToGame() {
    totalRounds = parseInt(roundsEl?.value || '20', 10) || 20;
    colorCount = parseInt(ccEl?.value || '4', 10) || 4;
    const toSecs = parseInt(timeoutEl?.value || '0', 10) || 0;
    timeoutMs = toSecs * 1000;
    totalEl.textContent = String(totalRounds);
    persistSettings();
  }

  function resetGameState() {
    clearRoundTimeout();
    state.score = 0;
    state.currentRound = 0;
    state.stats = {
      congruent: { count: 0, hits: 0, rtSum: 0 },
      incongruent: { count: 0, hits: 0, rtSum: 0 },
    };
    canAnswer = true;
    currentCorrectName = null;
    feedbackEl.textContent = '';
    feedbackEl.className = 'st-feedback';
    buttonsEl.innerHTML = '';
    wordEl.classList.remove('hidden');
    buttonsEl.classList.remove('hidden');
    endEl?.classList.add('hidden');
    totalEl.textContent = String(totalRounds);
    roundEl.textContent = '0';
    scoreEl.textContent = '0';
  }

  function revealCorrectButton(correctName) {
    Array.from(buttonsEl.children).forEach(btn => {
      const nameEl = btn.querySelector('span');
      if (nameEl && nameEl.textContent.trim() === correctName) {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-correct');
      }
    });
  }

  function scheduleRoundTimeout() {
    clearRoundTimeout();
    if (!timeoutMs) return;

    roundTimeout = window.setTimeout(() => {
      if (!canAnswer) return;
      canAnswer = false;
      feedbackEl.textContent = 'Čas je potekel.';
      feedbackEl.className = 'st-feedback result-error';
      revealCorrectButton(currentCorrectName);
      sounds.playError();
      window.setTimeout(nextRound, roundDelay);
    }, timeoutMs);
  }

  function nextRound() {
    clearRoundTimeout();
    state.currentRound++;
    if (state.currentRound > totalRounds) {
      endGame();
      return;
    }

    feedbackEl.textContent = '';
    feedbackEl.className = 'st-feedback';
    canAnswer = true;

    const availableColors = colors.slice(0, Math.min(colorCount, colors.length));
    const shuffled = shuffle(availableColors);

    // 50% chance for congruent vs incongruent
    currentTrialType = Math.random() < 0.5 ? 'congruent' : 'incongruent';

    const wordColor = shuffled[0];
    let inkColor = wordColor;

    if (currentTrialType === 'incongruent') {
      inkColor = shuffled[1] || shuffled[0];
      if (wordColor.name === inkColor.name) inkColor = shuffled[2] || shuffled[0];
    }

    currentCorrectName = inkColor.name;
    wordEl.textContent = wordColor.name.toUpperCase();
    wordEl.style.color = inkColor.hex;

    const options = new Set([inkColor.name]);
    const others = shuffle(availableColors.filter(c => c.name !== inkColor.name));
    const targetSize = Math.min(4, availableColors.length);
    for (let i = 0; options.size < targetSize && i < others.length; i++) {
      options.add(others[i].name);
    }

    buttonsEl.innerHTML = '';
    const opArr = shuffle([...options]);
    opArr.forEach((name, idx) => {
      const keyNum = idx + 1;
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline p-md text-md';
      btn.innerHTML = `<span>${name}</span> <small style="display:block; opacity:0.6; font-size:0.7em; margin-top:4px;">[Tipka ${keyNum}]</small>`;
      btn.addEventListener('click', () => handleAnswer(name, btn, inkColor.name));
      buttonsEl.appendChild(btn);
    });

    roundStartTime = performance.now();
    scheduleRoundTimeout();
  }

  function handleAnswer(name, btn, correct) {
    if (!canAnswer) return;
    const rt = performance.now() - roundStartTime;
    clearRoundTimeout();
    canAnswer = false;

    const statGrp = state.stats[currentTrialType];
    statGrp.count++;

    if (name === correct) {
      state.score++;
      statGrp.hits++;
      statGrp.rtSum += rt;
      statsManager.addXp(5);
      btn.classList.add('active');
      feedbackEl.textContent = 'Pravilno! ✓';
      feedbackEl.className = 'st-feedback result-success';
      sounds.playSuccess();
    } else {
      btn.classList.add('btn-incorrect');
      revealCorrectButton(correct);
      feedbackEl.textContent = 'Napačno ✗';
      feedbackEl.className = 'st-feedback result-error';
      sounds.playError();
    }

    window.setTimeout(nextRound, roundDelay);
  }

  function startGame() {
    if (!validateSettings()) return;
    applySettingsToGame();
    resetGameState();
    showPlayScreen();
    nextRound();
  }

  function endGame() {
    clearRoundTimeout();
    wordEl.classList.add('hidden');
    buttonsEl.classList.add('hidden');
    document.getElementById('st-final-score').textContent = state.score;
    document.getElementById('st-final-total').textContent = totalRounds;
    document.getElementById('st-accuracy').textContent =
      totalRounds > 0 ? `Natančnost: ${Math.round((state.score / totalRounds) * 100)}%` : '';

    const congRT =
      state.stats.congruent.hits > 0
        ? Math.round(state.stats.congruent.rtSum / state.stats.congruent.hits)
        : 0;
    const incongRT =
      state.stats.incongruent.hits > 0
        ? Math.round(state.stats.incongruent.rtSum / state.stats.incongruent.hits)
        : 0;
    const interference = incongRT && congRT ? incongRT - congRT : 0;

    const analyticsEl = document.getElementById('st-analytics');
    if (analyticsEl) {
      analyticsEl.innerHTML = `
                <div><strong>Stroopov učinek (zaostanek):</strong> <span style="color:var(--color-primary)">${interference > 0 ? '+' : ''}${interference} ms</span></div>
                <div style="margin-top: 6px; font-size:0.8em; color:var(--color-text-muted);">
                    <div>Skladno (Congruent) RT: ${congRT || '-'} ms</div>
                    <div>Neskladno (Incongruent) RT: ${incongRT || '-'} ms</div>
                </div>
            `;
    }

    statsManager.saveRecord('stroop', {
      score: state.score,
      rounds: totalRounds,
      colorCount,
      timeout: timeoutMs,
      interference,
    });
    sounds.playVictory();

    playLayer?.classList.add('hidden');
    endEl?.classList.remove('hidden');
  }

  if (roundsEl) roundsEl.addEventListener('input', validateSettings);
  if (ccEl) ccEl.addEventListener('change', validateSettings);
  if (timeoutEl) timeoutEl.addEventListener('input', validateSettings);

  startBtn?.addEventListener('click', startGame);
  retryBtn?.addEventListener('click', startGame);
  document.getElementById('st-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  setGameSettingsApplyHandler(() => {
    if (!validateSettings()) return false;
    applySettingsToGame();
    resetGameState();
    showStartScreen();
    return true;
  });

  const keyHandler = e => {
    if (!canAnswer || playLayer.classList.contains('hidden')) return;
    if (e.key >= '1' && e.key <= '4') {
      const idx = parseInt(e.key, 10) - 1;
      const btns = buttonsEl.querySelectorAll('button');
      if (btns[idx]) {
        e.preventDefault();
        btns[idx].click();
      }
    }
  };

  if (window.__stroopKeyHandler) {
    document.removeEventListener('keydown', window.__stroopKeyHandler);
  }
  window.__stroopKeyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler);

  loadSettings();
  applySettingsToGame();
  resetGameState();
  validateSettings();
  showStartScreen();

  return function cleanup() {
    clearRoundTimeout();
    if (window.__stroopKeyHandler) {
      document.removeEventListener('keydown', window.__stroopKeyHandler);
      window.__stroopKeyHandler = null;
    }
  };
}
