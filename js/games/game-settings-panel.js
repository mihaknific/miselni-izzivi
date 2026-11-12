import { Settings } from '../store.js';

let currentApplyHandler = null;
let previousEscapeHandler = null;

export function setGameSettingsApplyHandler(handler) {
  currentApplyHandler = handler;
}

/**
 * Enoten binding per-game nastavitev (DRY — prej enak vzorec v ~20 igrah).
 *
 * - ob init: prebere `game.<id>` iz shrambe in preda shranjene vrednosti
 *   v `apply(saved)` (nastavi stanje + UI elemente);
 * - ob "Uporabi" iz panela: `readFromUI()` → shrani `collect()` pod `game.<id>`
 *   → `afterApply()` (npr. prikaz začetnega zaslona).
 *
 * `readFromUI` sme vrniti `false` (ali Promise<false>) — takrat se shranišče ne
 * posodobi in panel ostane odprt (enako kot `return false` pri ročnem handlerju).
 *
 * @param {string} gameId
 * @param {{
 *   apply?: (saved: Object) => void,
 *   readFromUI?: () => boolean|void|Promise<boolean|void>,
 *   collect?: () => Object|Promise<Object>,
 *   afterApply?: () => void|Promise<void>,
 *   defaults?: Object,
 * }} opts
 * @returns {Promise<Object|null>} shranjene vrednosti (ali `defaults`/null)
 */
export function bindGameSettings(gameId, opts = {}) {
  setGameSettingsApplyHandler(async () => {
    if (opts.readFromUI) {
      const ok = await opts.readFromUI();
      if (ok === false) return false;
    }
    if (opts.collect) await Settings.set(`game.${gameId}`, await opts.collect());
    if (opts.afterApply) await opts.afterApply();
    return true;
  });

  return Settings.get(`game.${gameId}`, opts.defaults ?? null).then(saved => {
    if (saved && opts.apply) opts.apply(saved);
    return saved;
  });
}

export function initGameSettingsPanel() {
  const gsBtn = document.getElementById('btn-game-settings');
  const settingsPanel = document.getElementById('game-settings-modal');
  const stageContent = document.getElementById('game-stage-content');
  const infoBtn = document.getElementById('btn-game-info');
  const infoPanel = document.getElementById('game-info-modal');

  if (!settingsPanel && !infoPanel) return;

  const labelOpenSettings = gsBtn?.dataset.labelOpen || 'Nastavitve igre';
  const labelCloseSettings = gsBtn?.dataset.labelClose || 'Zapri nastavitve';
  const labelOpenInfo = infoBtn?.dataset.labelOpen || 'Navodila igre';
  const labelCloseInfo = infoBtn?.dataset.labelClose || 'Zapri navodila';

  if (gsBtn) gsBtn.setAttribute('aria-expanded', 'false');
  if (infoBtn) infoBtn.setAttribute('aria-expanded', 'false');

  let snapshot = null;

  function captureSnapshot() {
    const settingsRow = document.getElementById('game-settings-row');
    if (!settingsRow) return;

    snapshot = Array.from(settingsRow.querySelectorAll('input, select, textarea')).map(el => ({
      id: el.id,
      type: el.type || el.tagName.toLowerCase(),
      value: el.value,
      checked: !!el.checked,
    }));
  }

  function restoreSnapshot() {
    if (!snapshot) return;

    snapshot.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el) return;
      if (item.type === 'checkbox' || item.type === 'radio') {
        el.checked = item.checked;
      } else {
        el.value = item.value;
      }
    });
  }

  function isOpen(panel) {
    return !!panel && !panel.classList.contains('panel-hidden');
  }

  function syncToggleButton(button, open, labelOpen, labelClose) {
    if (!button) return;
    const label = open ? labelClose : labelOpen;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.classList.toggle('active', open);
  }

  function syncPanels() {
    const infoOpen = isOpen(infoPanel);
    const settingsOpen = isOpen(settingsPanel);
    if (stageContent) {
      stageContent.classList.toggle('hidden', infoOpen || settingsOpen);
    }
    syncToggleButton(infoBtn, infoOpen, labelOpenInfo, labelCloseInfo);
    syncToggleButton(gsBtn, settingsOpen, labelOpenSettings, labelCloseSettings);
  }

  function hidePanel(panel) {
    if (!panel) return;
    panel.classList.add('panel-hidden');
    panel.setAttribute('aria-hidden', 'true');
  }

  function showPanel(panel) {
    if (!panel) return;
    panel.classList.remove('panel-hidden');
    panel.setAttribute('aria-hidden', 'false');
  }

  function closeInfo() {
    if (!infoPanel || !isOpen(infoPanel)) return;
    hidePanel(infoPanel);
    syncPanels();
  }

  function closeSettings({ restore = false } = {}) {
    if (restore) {
      restoreSnapshot();
    }
    if (!isOpen(settingsPanel)) {
      syncPanels();
      return;
    }
    hidePanel(settingsPanel);
    syncPanels();
  }

  function openSettings() {
    if (isOpen(infoPanel)) {
      hidePanel(infoPanel);
    }

    captureSnapshot();
    showPanel(settingsPanel);
    syncPanels();

    const firstFocusable = settingsPanel.querySelector('input, select, textarea, button');
    firstFocusable?.focus();
  }

  function openInfo() {
    if (!infoPanel) return;

    if (isOpen(settingsPanel)) {
      hidePanel(settingsPanel);
    }

    showPanel(infoPanel);
    syncPanels();

    const firstFocusable = infoPanel.querySelector('button, a, input, select, textarea');
    firstFocusable?.focus();
  }

  function toggleSettings() {
    if (isOpen(settingsPanel)) {
      closeSettings({ restore: true });
    } else {
      openSettings();
    }
  }

  function toggleInfo() {
    if (!infoPanel) return;

    if (isOpen(infoPanel)) {
      closeInfo();
    } else {
      openInfo();
    }
  }

  function closeActivePanel() {
    if (isOpen(settingsPanel)) {
      closeSettings({ restore: true });
      return;
    }
    if (isOpen(infoPanel)) {
      closeInfo();
    }
  }

  if (gsBtn) {
    gsBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleSettings();
    });
  }

  const cancelBtn = document.getElementById('btn-cancel-settings');
  const saveBtn = document.getElementById('btn-save-settings');

  if (cancelBtn) cancelBtn.addEventListener('click', () => closeSettings({ restore: true }));
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (typeof currentApplyHandler === 'function') {
        try {
          const result = await currentApplyHandler();
          if (result === false) {
            return;
          }
        } catch (e) {
          console.error('Nastavitev ni bilo mogoče shraniti:', e);
          return;
        }
      }
      closeSettings({ restore: false });
    });
  }

  const closeInfoBtn = document.getElementById('btn-close-info');
  if (closeInfoBtn) closeInfoBtn.addEventListener('click', closeInfo);
  const closeSettingsBtn = document.getElementById('btn-close-settings');
  if (closeSettingsBtn)
    closeSettingsBtn.addEventListener('click', () => closeSettings({ restore: true }));

  if (infoBtn && infoPanel) {
    infoBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleInfo();
    });
  }

  if (previousEscapeHandler) {
    document.removeEventListener('keydown', previousEscapeHandler);
  }
  previousEscapeHandler = e => {
    if (e.key === 'Escape' && (isOpen(infoPanel) || isOpen(settingsPanel))) {
      e.preventDefault();
      closeActivePanel();
    }
  };
  document.addEventListener('keydown', previousEscapeHandler);

  syncPanels();
}
