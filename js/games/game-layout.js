// js/games/game-layout.js — skupna ogrodja iger
import { escapeHtml } from '../ui.js';
import { sounds } from '../sounds.js';
import { showToast, showConfetti } from '../feedback.js';
import { statsManager } from '../stats.js';
import { updateAdaptiveDifficulty } from '../adaptive-difficulty.js';

const INFO_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;
const SETTINGS_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.5 1z"></path></svg>`;

/**
 * Skupni preklop plasti/zaslonov igre (DRY — prej kopirano v 11 igrah).
 * Skrije vse podane plasti in prikaže ciljno.
 * @param {Array<HTMLElement|null|undefined>} layers vse plasti igre
 * @param {HTMLElement|null} [target] plast za prikaz (null/undefined = vse skrite)
 */
export function showGameLayer(layers, target) {
  layers.forEach(el => {
    if (el) el.classList.add('hidden');
  });
  if (target) target.classList.remove('hidden');
}

const _msgTimers = new WeakMap();

/**
 * Skupni prikaz sporočila na igralni plošči (DRY — prej kopirano v 5 igrah).
 * dveh stilov: z razredom (`cls`) ali z barvo besedila (`type`).
 * @param {HTMLElement|null} msgEl element za sporočila
 * @param {string} text besedilo ('' = počisti)
 * @param {{type?: 'info'|'error'|'success', cls?: string, timeout?: number}} [opts]
 */
export function showStageMessage(msgEl, text, opts = {}) {
  if (!msgEl) return;
  const { type = 'info', cls = '', timeout = 1800 } = opts;
  if (cls) {
    msgEl.className = `${cls} ${type}`.trim();
  } else {
    msgEl.style.color =
      type === 'error' ? '#ef4444' : type === 'success' ? '#16a34a' : 'var(--color-primary)';
  }
  const prev = _msgTimers.get(msgEl);
  if (prev) clearTimeout(prev);
  if (text) {
    _msgTimers.set(
      msgEl,
      setTimeout(() => {
        msgEl.textContent = '';
        if (cls) msgEl.className = cls;
      }, timeout)
    );
  }
}

/**
 * Skupni izris zgodovine odgovorov (DRY — prej znak-znak kopirano v major/kvadriranje).
 * @param {HTMLElement} historyList seznam <li>
 * @param {Array<{challenge: string|number, userAns: string, expected: string|number, isCorrect: boolean}>} history
 * @param {{suffix?: string, limit?: number}} [opts] `suffix` npr. '²' za kvadriranje
 */
export function renderAnswerHistory(historyList, history, opts = {}) {
  const { suffix = '', limit = 20 } = opts;
  if (history.length > limit) history.length = limit;
  historyList.innerHTML = history
    .map(item => {
      const ansClass = item.isCorrect ? 'hist-correct' : 'hist-incorrect';
      const expHtml = !item.isCorrect
        ? ` <span style="font-size:0.8rem;">(Pričakovano: <span class="hist-expected">${escapeHtml(String(item.expected))}</span>)</span>`
        : '';
      return `<li>
              <span class="hist-q">${escapeHtml(String(item.challenge))}${suffix} &rarr;</span>
              <div>
                  <span class="${ansClass} hist-a">${escapeHtml(item.userAns || '(prazno)')}</span>
                  ${expHtml}
              </div>
          </li>`;
    })
    .join('');
}

/**
 * Ustvari enotno štoparico ali odštevalnik (DRY — prej samostojno implementirano v 8 igrah).
 * Samodejno skrbi za intervale, preprečuje prekrivanja in omogoča čiščenje.
 *
 * @param {(elapsed: number) => void} onTick funkcija, ki se pokliče ob vsakem ticku
 * @param {{interval?: number, initialSeconds?: number, precision?: boolean}} [opts]
 * @returns {{start: () => void, stop: () => void, reset: (newSeconds?: number) => void, getElapsed: () => number}}
 */
export function createGameTimer(onTick, opts = {}) {
  const { interval = 1000, initialSeconds = 0, precision = false } = opts;
  let elapsed = initialSeconds;
  let timerId = null;
  let startTime = 0;

  return {
    start() {
      if (timerId !== null) clearInterval(timerId);
      if (precision) {
        startTime = performance.now() - elapsed * 1000;
        timerId = setInterval(() => {
          elapsed = (performance.now() - startTime) / 1000;
          if (onTick) onTick(elapsed);
        }, interval);
      } else {
        timerId = setInterval(() => {
          elapsed++;
          if (onTick) onTick(elapsed);
        }, interval);
      }
    },
    stop() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    },
    reset(newSeconds = 0) {
      this.stop();
      elapsed = newSeconds;
    },
    getElapsed() {
      return elapsed;
    },
  };
}

/**
 * Enoten kontroler za 3-stopenjske namige (DRY — prej podvojeno med uganke in vzorci).
 *
 * @param {{
 *   hintBtn: HTMLElement|null,
 *   hintArea: HTMLElement|null,
 *   getHints: () => string[]|null|undefined,
 *   onRevealSolution?: () => void,
 *   isSolutionRevealed?: () => boolean,
 *   formatItem?: (h: string, idx: number, badge: string) => string
 * }} opts
 */
export function createHintController(opts) {
  const {
    hintBtn,
    hintArea,
    getHints,
    onRevealSolution,
    isSolutionRevealed = () => false,
    formatItem,
  } = opts;

  let currentIndex = 0;
  const badges = ['1. Smernica 🔍', '2. Usmeritev 💡', '3. Ključni podatek 🎯'];

  function renderHints() {
    const hints = getHints();
    if (!hints || !hintArea) return;
    const revealed = hints.slice(0, currentIndex);
    if (revealed.length === 0) {
      hintArea.classList.add('hidden');
      return;
    }

    hintArea.innerHTML = revealed
      .map((h, idx) => {
        if (formatItem) return formatItem(h, idx, badges[idx] || `${idx + 1}. Namig`);
        return `
            <div class="uganke-hint-item">
                <span class="uganke-hint-badge">${badges[idx] || idx + 1 + '. Namig'}</span>
                <div class="uganke-hint-text">${escapeHtml(h)}</div>
            </div>
        `;
      })
      .join('');
    hintArea.classList.remove('hidden');
  }

  function updateButton() {
    const hints = getHints();
    if (!hints || !hintBtn) return;

    if (currentIndex === 0) {
      hintBtn.disabled = false;
      hintBtn.textContent = '💡 1. Namig (Smernica)';
      hintBtn.style.borderColor = '';
      hintBtn.style.color = '';
      hintBtn.style.background = '';
    } else if (currentIndex === 1) {
      hintBtn.disabled = false;
      hintBtn.textContent = '💡 2. Namig (Usmeritev)';
      hintBtn.style.borderColor = '';
      hintBtn.style.color = '';
      hintBtn.style.background = '';
    } else if (currentIndex === 2 && !isSolutionRevealed()) {
      hintBtn.disabled = false;
      hintBtn.textContent = '🔓 3. Namig (Razkrij rešitev)';
      hintBtn.style.borderColor = '#f59e0b';
      hintBtn.style.color = '#b45309';
      hintBtn.style.background = '#fffbeb';
    } else {
      hintBtn.disabled = true;
      hintBtn.textContent = '✅ Vsi namigi razkriti';
      hintBtn.style.borderColor = '';
      hintBtn.style.color = '';
      hintBtn.style.background = '';
    }
  }

  function handleHint() {
    const hints = getHints();
    if (!hints) return;
    sounds.play('click');

    if (currentIndex < 2) {
      currentIndex++;
      renderHints();
      updateButton();
    } else if (currentIndex === 2) {
      currentIndex = 3;
      renderHints();
      if (onRevealSolution) onRevealSolution();
      updateButton();
    } else if (!isSolutionRevealed()) {
      if (onRevealSolution) onRevealSolution();
      updateButton();
    } else {
      showToast('Rešitev in vsi namigi so že prikazani!', { type: 'info' });
    }
  }

  function reset() {
    currentIndex = 0;
    if (hintArea) {
      hintArea.classList.add('hidden');
      hintArea.innerHTML = '';
    }
    updateButton();
  }

  return {
    handleHint,
    renderHints,
    updateButton,
    reset,
    getIndex: () => currentIndex,
    setIndex: i => {
      currentIndex = i;
    },
  };
}

export function renderGameShell({
  _title,
  _subtitle = '',
  statusHtml = '',
  settingsHtml = '',
  stageHtml = '',
  footerHtml = '',
  infoHtml = '',
  actionsHtml = '',
}) {
  return `
    <template id="game-header-teleport">
      ${statusHtml ? `<div class="game-status header-status">${statusHtml}</div>` : ''}
    </template>

    <template id="game-actions-teleport">
      ${actionsHtml}
      ${
        infoHtml
          ? `<button id="btn-game-info" type="button" class="icon-btn header-action-btn" title="Navodila igre" aria-label="Navodila igre" aria-expanded="false" aria-controls="game-info-modal" data-label-open="Navodila igre" data-label-close="Zapri navodila">
        <span class="game-shell-icon game-shell-icon-open" aria-hidden="true">${INFO_ICON}</span>
        <span class="game-shell-icon game-shell-icon-close" aria-hidden="true">&times;</span>
      </button>`
          : ''
      }
      ${
        settingsHtml
          ? `<button id="btn-game-settings" type="button" class="icon-btn header-action-btn" title="Nastavitve igre" aria-label="Nastavitve igre" aria-expanded="false" aria-controls="game-settings-modal" data-label-open="Nastavitve igre" data-label-close="Zapri nastavitve">
        <span class="game-shell-icon game-shell-icon-open" aria-hidden="true">${SETTINGS_ICON}</span>
        <span class="game-shell-icon game-shell-icon-close" aria-hidden="true">&times;</span>
      </button>`
          : ''
      }
    </template>

    <div class="card game-card-shell">
      <div class="game-shell-body">
        <div id="game-stage-content" class="game-stage-content">
          ${stageHtml}
          ${footerHtml ? `<div class="game-footer">${footerHtml}</div>` : ''}
        </div>

        ${
          infoHtml
            ? `<section id="game-info-modal" class="game-aux-panel panel-hidden" aria-hidden="true">
          <div class="modal-content">
            <div class="modal-header-row">
              <h3>Navodila</h3>
              <button class="icon-btn" id="btn-close-info" type="button" aria-label="Zapri navodila">&times;</button>
            </div>
            <div class="info-body">${infoHtml}</div>
          </div>
        </section>`
            : ''
        }

        ${
          settingsHtml
            ? `<section id="game-settings-modal" class="game-aux-panel panel-hidden" aria-hidden="true">
          <div class="modal-content">
            <div class="modal-header-row">
              <h3>Nastavitve igre</h3>
              <button class="icon-btn" id="btn-close-settings" type="button" aria-label="Zapri nastavitve">&times;</button>
            </div>
            <p class="text-muted modal-note">Prilagodi možnosti. Ob shranjevanju se bo igra ponastavila.</p>
            <div class="info-body">
              <div id="game-settings-row" class="game-settings-row">${settingsHtml}</div>
              <div class="settings-actions">
                  <button class="btn btn-outline" id="btn-cancel-settings" type="button">Prekliči</button>
                  <button class="btn" id="btn-save-settings" type="button">Shrani in ponastavi</button>
              </div>
            </div>
          </div>
        </section>`
            : ''
        }
      </div>
    </div>
  `;
}

/**
 * Skupni zaključek igre (DRY — prej samostojno v ~20 igrah).
 * Poskrbi za shranjevanje statistike, dodajanje XP, posodobitev adaptivne težavnosti,
 * predvajanje zvoka in opcijske konfete.
 *
 * @param {string} gameId identifikator igre (npr. 'spomin', 'nonogram')
 * @param {{
 *   record?: Object,
 *   xp?: number,
 *   adaptive?: { success: boolean, score?: number, metric?: string },
 *   sound?: 'victory'|'success'|'fanfare'|'error'|null,
 *   confetti?: boolean|{ count?: number }
 * }} [opts]
 */
export function finishGameEpilogue(gameId, opts = {}) {
  const { record, xp, adaptive, sound = null, confetti = false } = opts;

  if (typeof xp === 'number' && xp !== 0) {
    statsManager.addXp(xp);
  }
  if (record) {
    statsManager.saveRecord(gameId, record);
  }
  if (adaptive) {
    try {
      updateAdaptiveDifficulty(gameId, adaptive);
    } catch {}
  }
  if (sound) {
    if (sound === 'victory') {
      if (typeof sounds.playVictory === 'function') sounds.playVictory();
      else sounds.play('victory');
    } else if (typeof sounds.play === 'function') {
      sounds.play(sound);
    }
  }
  if (confetti) {
    const confettiOpts = typeof confetti === 'object' ? confetti : { count: 30 };
    showConfetti(confettiOpts);
  }
}
