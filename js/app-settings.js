// js/app-settings.js — Upravljanje nastavitev aplikacije in teme
import { Settings, exportData, importData } from './store.js';
import { showToast } from './feedback.js';
import { DEFAULT_SETTINGS, THEME_PRESETS, applyCustomSettings } from './theme.js';

/**
 * Poveže dogodke na strani z nastavitvami (videz, teme, uvoz/izvoz).
 * @param {Function} [onNavigate] funkcija za navigacijo (privzeto window.navigateTo)
 */
export async function bindSettingsEvents(onNavigate = window.navigateTo) {
  const ids = ['bgColor', 'textColor', 'headingColor', 'mutedColor', 'primaryColor'];
  for (const id of ids) {
    const el = document.getElementById(`opt-${id}`);
    if (!el) continue;
    el.value = await Settings.get(id, el.dataset.default);
    el.addEventListener('change', async e => {
      await Settings.set(id, e.target.value);
      await applyCustomSettings();
    });
  }

  const btnReset = document.getElementById('btn-reset');
  btnReset?.addEventListener('click', async () => {
    await Settings.set('bgColor', DEFAULT_SETTINGS.bgColor);
    await Settings.set('surfaceColor', DEFAULT_SETTINGS.surfaceColor);
    await Settings.set('borderColor', DEFAULT_SETTINGS.borderColor);
    await Settings.set('textColor', DEFAULT_SETTINGS.textColor);
    await Settings.set('headingColor', DEFAULT_SETTINGS.headingColor);
    await Settings.set('mutedColor', DEFAULT_SETTINGS.mutedColor);
    await Settings.set('primaryColor', DEFAULT_SETTINGS.primaryColor);
    await Settings.set('primaryText', DEFAULT_SETTINGS.primaryText);
    await applyCustomSettings();
    showToast('Videz je ponastavljen.', { type: 'success' });
    if (typeof onNavigate === 'function') {
      onNavigate('settings', null, { replace: true });
    }
  });

  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', async e => {
      const theme = THEME_PRESETS[e.currentTarget.dataset.preset];
      if (!theme) return;

      await Settings.set('bgColor', theme.bg);
      await Settings.set('surfaceColor', theme.surface);
      await Settings.set('borderColor', theme.border);
      await Settings.set('textColor', theme.text);
      await Settings.set('headingColor', theme.heading);
      await Settings.set('mutedColor', theme.muted);
      await Settings.set('primaryColor', theme.primary);
      await Settings.set('primaryText', theme.ptext);
      await applyCustomSettings();

      const colorFields = {
        bgColor: theme.bg,
        textColor: theme.text,
        headingColor: theme.heading,
        mutedColor: theme.muted,
        primaryColor: theme.primary,
      };
      Object.entries(colorFields).forEach(([id, value]) => {
        const input = document.getElementById(`opt-${id}`);
        if (input) input.value = value;
      });

      presetBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });

  document.getElementById('btn-export')?.addEventListener('click', async () => {
    try {
      await exportData();
      showToast('Izvoz je pripravljen.', { type: 'success' });
    } catch (error) {
      console.error('Napaka pri izvozu podatkov:', error);
      showToast('Izvoz ni uspel.', { type: 'error' });
    }
  });

  const btnImport = document.getElementById('btn-import');
  if (btnImport) {
    btnImport.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async evt => {
        const rez = await importData(evt.target.result);
        if (rez?.success) {
          showToast(`Uspešno uvoženih ${rez.count} zapisov!`, { type: 'success' });
          e.target.value = '';
          // Uvoženi rekordi/nastavitve se preberejo ob zagonu — ponovno naloži stran.
          setTimeout(() => window.location.reload(), 1200);
        } else {
          showToast('Uvoz podatkov ni uspel.', { type: 'error' });
        }
      };
      reader.readAsText(file);
    });
  }
}
