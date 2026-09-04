// js/main.js
import { Settings, exportData, importData, saveProgress } from './store.js';
import { fetchTasks } from './data.js';
import { renderGameList, renderSingleGame, renderSettings } from './ui.js';
import { showToast } from './feedback.js';
import { sounds } from './sounds.js';

import { renderStats, statsManager } from './stats.js';
import { initGameSettingsPanel } from './games/game-settings-panel.js';
import { renderDailyChallenge, initDailyChallenge } from './games/daily-challenge.js';
import { initAchievementWatcher, renderAchievementsPanel } from './achievements.js';

const gameLoaders = {
  spomin: () => import('./games/spomin.js'),
  racunanje: () => import('./games/racunanje.js'),
  stroop: () => import('./games/stroop.js'),
  reakcija: () => import('./games/reakcija.js'),
  gonogo: () => import('./games/reakcija.js'),
  zaporedje: () => import('./games/zaporedje.js'),
  abeceda: () => import('./games/abeceda.js'),
  kvadriranje: () => import('./games/kvadriranje.js'),
  major: () => import('./games/major.js'),
  corsi: () => import('./games/corsi.js'),
  search: () => import('./games/search.js'),
  switch: () => import('./games/switch.js'),
  dualnback: () => import('./games/dualnback.js'),
  words: () => import('./games/words.js'),
  uganke: () => import('./games/uganke.js'),
  vzorci: () => import('./games/vzorci.js'),
  trail: () => import('./games/trail.js'),
  2048: () => import('./games/2048.js'),
  besedle: () => import('./games/besedle.js'),
  povezave: () => import('./games/povezave.js'),
  besedolov: () => import('./games/besedolov.js'),
  sudoku: () => import('./games/sudoku.js'),
  minolovec: () => import('./games/minolovec.js'),
  nonogram: () => import('./games/nonogram.js'),
  daily: () => import('./games/daily-challenge.js'),
};
const loadedModules = {};

let appTasks = [];
let currentRoute = 'game-list';
let currentAbortController = new AbortController();

const DEFAULT_HEADER_HTML =
  '<h1 class="logo">Miselni <span class="text-primary">Izzivi</span></h1>';
const DEFAULT_SETTINGS = {
  fontSize: '16px',
  bgColor: '#f5f3ff',
  surfaceColor: '#ffffff',
  borderColor: '#e2e8f0',
  textColor: '#1a1a2e',
  headingColor: '#1a1a2e',
  mutedColor: '#64748b',
  primaryColor: '#6366f1',
  primaryText: '#ffffff',
};
const THEME_PRESETS = {
  default: {
    bg: '#f5f3ff',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#1a1a2e',
    heading: '#1a1a2e',
    muted: '#64748b',
    primary: '#6366f1',
    ptext: '#ffffff',
  },
  zinc: {
    bg: '#ffffff',
    surface: '#fafafa',
    border: '#e4e4e7',
    text: '#09090b',
    heading: '#09090b',
    muted: '#71717a',
    primary: '#18181b',
    ptext: '#fafafa',
  },
  stone: {
    bg: '#fafaf9',
    surface: '#f5f5f4',
    border: '#d6d3d1',
    text: '#0c0a09',
    heading: '#0c0a09',
    muted: '#78716c',
    primary: '#44403c',
    ptext: '#fafaf9',
  },
  blue: {
    bg: '#eff6ff',
    surface: '#ffffff',
    border: '#bfdbfe',
    text: '#1e3a5f',
    heading: '#1e3a5f',
    muted: '#64748b',
    primary: '#2563eb',
    ptext: '#ffffff',
  },
  green: {
    bg: '#f0fdf4',
    surface: '#ffffff',
    border: '#bbf7d0',
    text: '#14532d',
    heading: '#14532d',
    muted: '#4b5563',
    primary: '#16a34a',
    ptext: '#ffffff',
  },
  rose: {
    bg: '#fff1f2',
    surface: '#ffffff',
    border: '#fecdd3',
    text: '#4c0519',
    heading: '#4c0519',
    muted: '#71717a',
    primary: '#e11d48',
    ptext: '#ffffff',
  },
  dark: {
    bg: '#0f0f1a',
    surface: '#1a1a2e',
    border: '#2d2d44',
    text: '#e2e8f0',
    heading: '#f1f5f9',
    muted: '#94a3b8',
    primary: '#818cf8',
    ptext: '#0f0f1a',
  },
};

function hexToRgb(hex) {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '');
  if (cleaned.length === 3) {
    const r = cleaned[0];
    const g = cleaned[1];
    const b = cleaned[2];
    return [r, g, b].map(part => parseInt(part + part, 16)).join(', ');
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b].join(', ');
  }
  return '23, 23, 23';
}

function adjustHexColor(hex, amount) {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '');
  if (!/^[0-9a-fA-F]{3}$/.test(cleaned) && !/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return '#404040';
  }

  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map(part => part + part)
          .join('')
      : cleaned;

  const num = parseInt(expanded, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${[r, g, b].map(part => part.toString(16).padStart(2, '0')).join('')}`;
}

async function applyCustomSettings() {
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const [
    fontSize,
    bgColor,
    surfaceColor,
    borderColor,
    textColor,
    headingColor,
    mutedColor,
    primaryColor,
    primaryText,
  ] = await Promise.all([
    Settings.get('fontSize', DEFAULT_SETTINGS.fontSize),
    Settings.get('bgColor', DEFAULT_SETTINGS.bgColor),
    Settings.get('surfaceColor', DEFAULT_SETTINGS.surfaceColor),
    Settings.get('borderColor', DEFAULT_SETTINGS.borderColor),
    Settings.get('textColor', DEFAULT_SETTINGS.textColor),
    Settings.get('headingColor', DEFAULT_SETTINGS.headingColor),
    Settings.get('mutedColor', DEFAULT_SETTINGS.mutedColor),
    Settings.get('primaryColor', DEFAULT_SETTINGS.primaryColor),
    Settings.get('primaryText', DEFAULT_SETTINGS.primaryText),
  ]);

  root.style.setProperty('--custom-font-size', fontSize);
  root.style.setProperty('--custom-bg', bgColor);
  root.style.setProperty('--color-bg', bgColor);
  root.style.setProperty('--color-bg-rgb', hexToRgb(bgColor));
  root.style.setProperty('--color-surface', surfaceColor);
  root.style.setProperty('--color-border', borderColor);
  root.style.setProperty('--custom-text', textColor);
  root.style.setProperty('--color-text', textColor);
  root.style.setProperty('--color-text-main', textColor);
  root.style.setProperty('--custom-heading', headingColor);
  root.style.setProperty('--custom-muted', mutedColor);
  root.style.setProperty('--color-text-muted', mutedColor);
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-primary-hover', adjustHexColor(primaryColor, -18));
  const primaryRgb = hexToRgb(primaryColor);
  root.style.setProperty('--color-primary-rgb', primaryRgb);
  root.style.setProperty('--custom-primary-text', primaryText);

  root.style.setProperty('--color-scrollbar-thumb', `rgba(${primaryRgb}, 0.38)`);
  root.style.setProperty('--color-scrollbar-thumb-hover', primaryColor);

  if (themeMeta) {
    themeMeta.setAttribute('content', bgColor);
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const register = () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('Na voljo je nova različica. Osveži stran.', { type: 'info' });
            }
          });
        });
      })
      .catch(error => {
        console.warn('Service worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const appContainer = document.getElementById('app-container');
  const btnBack = document.getElementById('btn-back');
  const btnMenu = document.getElementById('btn-menu');
  const mainNav = document.getElementById('main-nav');
  const headerCenter = document.getElementById('header-center');

  await applyCustomSettings();
  registerServiceWorker();

  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const btnSoundToggleNav = document.getElementById('btn-sound-toggle-nav');
  const navSoundRow = document.getElementById('nav-sound-row');
  const btnNavClose = document.getElementById('btn-nav-close');

  async function updateSoundUI() {
    const isEnabled = (await Settings.get('soundEnabled', false)) !== false;

    // Header gumb
    const headerBtn = document.getElementById('btn-sound-toggle');
    if (headerBtn) {
      headerBtn.classList.toggle('sound-muted', !isEnabled);
      headerBtn.title = isEnabled
        ? 'Zvok: Vklopljen (Klikni za izklop)'
        : 'Zvok: Izklopljen (Klikni za vklop)';
    }

    // Nav menu toggle
    if (btnSoundToggleNav) {
      btnSoundToggleNav.setAttribute('aria-checked', String(isEnabled));
    }
    if (navSoundRow) {
      navSoundRow.classList.toggle('sound-off', !isEnabled);
    }

    const navText = document.getElementById('nav-sound-text');
    if (navText) {
      navText.textContent = isEnabled ? 'Zvočni učinki' : 'Zvok izklopljen';
    }
  }

  function setMenuOpen(open) {
    if (!mainNav || !btnMenu) return;
    mainNav.classList.toggle('open', open);
    btnMenu.setAttribute('aria-expanded', String(open));
    if (open) updateSoundUI();
  }

  async function handleSoundToggle() {
    const current = (await Settings.get('soundEnabled', false)) !== false;
    const nextState = !current;
    await sounds.setEnabled(nextState);
    await updateSoundUI();
    showToast(nextState ? 'Zvočni učinki so vklopljeni 🔊' : 'Zvočni učinki so izklopljeni 🔇', {
      type: 'info',
    });
  }

  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', handleSoundToggle);
  }
  if (btnSoundToggleNav) {
    btnSoundToggleNav.addEventListener('click', handleSoundToggle);
  }

  updateSoundUI();

  function updateGamificationWidget(stats) {
    const streakEl = document.getElementById('g-streak');
    const levelEl = document.getElementById('g-level');
    if (streakEl) streakEl.textContent = stats.streak;
    if (levelEl) levelEl.textContent = stats.level;
  }

  updateGamificationWidget(statsManager.getGamificationStats());
  window.addEventListener('xp-updated', e => updateGamificationWidget(e.detail));

  // Zaženi achievement watcher
  initAchievementWatcher();

  appTasks = await fetchTasks();

  const routes = {
    'game-list': () => renderGameList(appTasks),
    settings: () => renderSettings(),
    stats: () => renderStats(),
    achievements: () => renderAchievementsPanel(),
    daily: () => renderDailyChallenge(),
    game: async id => {
      const loader = gameLoaders[id];
      if (loader) {
        let mod = loadedModules[id];
        if (!mod) {
          mod = await loader();
          loadedModules[id] = mod;
        }
        switch (id) {
          case 'spomin':
            return mod.renderSpomin();
          case 'racunanje':
            return mod.renderRacunanje();
          case 'stroop':
            return mod.renderStroop();
          case 'reakcija':
            return mod.renderReakcija('classic');
          case 'gonogo':
            return mod.renderReakcija('gonogo');
          case 'zaporedje':
            return mod.renderZaporedje();
          case 'abeceda':
            return mod.renderAbeceda();
          case 'kvadriranje':
            return mod.renderKvadriranje();
          case 'major':
            return mod.renderMajor();
          case 'corsi':
            return mod.renderCorsi();
          case 'search':
            return mod.renderSearch();
          case 'switch':
            return mod.renderSwitch();
          case 'dualnback':
            return mod.renderDualNBack();
          case 'words':
            return mod.renderWords();
          case 'uganke':
            return mod.renderUganke();
          case 'vzorci':
            return mod.renderVzorci();
          case 'trail':
            return mod.renderTrail();
          case '2048':
            return mod.render2048();
          case 'besedle':
            return mod.renderBesedle();
          case 'povezave':
            return mod.renderPovezave();
          case 'besedolov':
            return mod.renderBesedolov();
          case 'sudoku':
            return mod.renderSudoku();
          case 'minolovec':
            return mod.renderMinolovec();
          case 'nonogram':
            return mod.renderNonogram();
          case 'daily':
            return mod.renderDailyChallenge();
          default:
            return renderSingleGame(appTasks.find(t => t.id === id) || appTasks[0]);
        }
      }
      return renderSingleGame(appTasks.find(t => t.id === id) || appTasks[0]);
    },
  };

  let activeGameCleanup = null;

  function abortCurrentController() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
  }

  function cleanupActiveGame() {
    abortCurrentController();
    if (typeof activeGameCleanup === 'function') {
      try {
        activeGameCleanup();
      } catch (err) {
        console.error('Napaka pri čiščenju igre:', err);
      }
      activeGameCleanup = null;
    }
  }

  function parseHash(hashStr) {
    const raw = String(hashStr || window.location.hash || '')
      .replace('#', '')
      .trim();
    if (!raw) return { target: 'game-list', params: null, subParam: null };

    const parts = raw.split('/');
    const main = parts[0];
    if (main === 'game') {
      const gameId = parts[1] || 'uganke';
      const subParam = parts.slice(2).join('/');
      return { target: 'game', params: gameId, subParam: subParam || null };
    }
    if (main === 'game-list' || main === 'settings' || main === 'stats') {
      return { target: main, params: null, subParam: null };
    }
    return { target: 'game', params: main, subParam: parts.slice(1).join('/') || null };
  }

  async function navigateTo(
    target,
    params,
    { replace = false, subParam = null, skipHashUpdate = false } = {}
  ) {
    if (!routes[target] || !appContainer) return;

    cleanupActiveGame();

    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    setMenuOpen(false);
    currentRoute = target;

    if (btnBack) {
      const isHidden = target === 'game-list';
      btnBack.style.visibility = isHidden ? 'hidden' : 'visible';
      btnBack.style.display = isHidden ? 'none' : 'flex';
    }

    document.body.classList.toggle('game-active', target === 'game');

    const state = { target, params, subParam };
    let hashUrl = `#${target}`;
    if (target === 'game' && params) {
      hashUrl = `#game/${params}${subParam ? `/${subParam}` : ''}`;
    }

    if (!skipHashUpdate) {
      const shouldReplace = replace || target === 'stats' || target === 'settings';
      if (shouldReplace) {
        history.replaceState(state, '', hashUrl);
      } else {
        history.pushState(state, '', hashUrl);
      }
    }

    const updateDOM = async () => {
      // Prikaz nalaganja za lazy-module (vzorci 42KB, racunanje 30KB)
      if (target === 'game' && gameLoaders[params] && !loadedModules[params]) {
        appContainer.innerHTML = `<div class="card" style="padding:2rem; text-align:center;"><p class="subtitle">Nalagam igro ${params}…</p></div>`;
      }
      const html = await routes[target](params);
      appContainer.innerHTML = html;

      if (headerCenter) {
        const teleport = document.getElementById('game-header-teleport');
        headerCenter.innerHTML =
          teleport && target === 'game' ? teleport.innerHTML : DEFAULT_HEADER_HTML;
      }

      async function safeInitGame(gameId, initFn, ...args) {
        try {
          return initFn(...args);
        } catch (err) {
          console.error(`Napaka pri inicializaciji igre ${gameId}:`, err);
          showToast(`Napaka pri zagonu igre: ${err.message}`, { type: 'error', timeout: 5000 });
          appContainer.innerHTML = `
            <div class="card" style="text-align:center; padding:2rem;">
              <p class="subtitle" style="margin-bottom:1rem;">🚫 Igra se ni mogla zagnati.</p>
              <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:1.5rem;">${err.message}</p>
              <button class="btn" data-target="game-list">← Nazaj na seznam iger</button>
            </div>
          `;
          return null;
        }
      }

      if (target === 'game') {
        let mod = loadedModules[params];
        if (!mod && gameLoaders[params]) {
          try {
            mod = await gameLoaders[params]();
            loadedModules[params] = mod;
          } catch (e) {
            console.error('Nalaganje igre ni uspelo:', e);
            appContainer.innerHTML = `<div class="card"><p class="subtitle">Napaka pri nalaganju igre.</p></div>`;
            return;
          }
        }
        if (mod) {
          const initMap = {
            spomin: () => mod.initSpomin(),
            racunanje: () => mod.initRacunanje(),
            stroop: () => mod.initStroop(),
            reakcija: () => mod.initReakcija('classic'),
            gonogo: () => mod.initReakcija('gonogo'),
            zaporedje: () => mod.initZaporedje(),
            abeceda: () => mod.initAbeceda(),
            kvadriranje: () => mod.initKvadriranje(),
            major: () => mod.initMajor(),
            corsi: () => mod.initCorsi(),
            search: () => mod.initSearch(),
            switch: () => mod.initSwitch(),
            dualnback: () => mod.initDualNBack(),
            words: () => mod.initWords(),
            uganke: () => mod.initUganke(subParam),
            vzorci: () => mod.initVzorci(subParam),
            trail: () => mod.initTrail(),
            2048: () => mod.init2048(),
            besedle: () => mod.initBesedle(),
            povezave: () => mod.initPovezave(),
            besedolov: () => mod.initBesedolov(),
            sudoku: () => mod.initSudoku(),
            minolovec: () => mod.initMinolovec(),
            nonogram: () => mod.initNonogram(),
            daily: () => mod.initDailyChallenge(),
          };
          const initFn = initMap[params];
          if (initFn) {
            activeGameCleanup = await safeInitGame(params, initFn);
          }
        }
        window.setTimeout(() => initGameSettingsPanel(), 0);
      } else if (target === 'settings') {
        bindSettingsEvents();
      }
    };

    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => updateDOM());
      try {
        await transition.finished;
      } catch {
        await updateDOM();
      }
    } else {
      await updateDOM();
    }
  }

  async function bindSettingsEvents() {
    const ids = ['fontSize', 'bgColor', 'textColor', 'headingColor', 'mutedColor', 'primaryColor'];
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
      await Settings.set('fontSize', DEFAULT_SETTINGS.fontSize);
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
      navigateTo('settings', null, { replace: true });
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
        console.error('Napaka pri izvozu:', error);
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
          } else {
            showToast('Napaka pri uvozu podatkov.', { type: 'error' });
          }
        };
        reader.readAsText(file);
      });
    }
  }

  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      setMenuOpen(!mainNav?.classList.contains('open'));
    });
  }

  if (btnNavClose) {
    btnNavClose.addEventListener('click', () => setMenuOpen(false));
  }

  document.addEventListener('click', async e => {
    const btnNav = e.target.closest('.btn-nav');
    if (btnNav) {
      const target = btnNav.dataset.target;
      setMenuOpen(false);
      if (target)
        navigateTo(target, null, { replace: target === 'stats' || target === 'settings' });
      return;
    }

    const targetButton = e.target.closest('[data-target="game-list"]');
    if (targetButton) {
      navigateTo('game-list', null, { replace: true });
      return;
    }

    const dailyStartButton = e.target.closest('.daily-start-btn');
    if (dailyStartButton) {
      navigateTo('game', 'vzorci', { subParam: '1' });
      return;
    }

    const gameCard = e.target.closest('.game-card');
    if (gameCard) {
      navigateTo('game', gameCard.dataset.tid);
      return;
    }

    const answerBtn = e.target.closest('.answer-btn');
    if (answerBtn) {
      answerBtn.classList.add('active');
      const taskId = answerBtn.dataset.tid;
      const idx = answerBtn.dataset.idx;
      await saveProgress({ id: taskId, answer: idx, time: Date.now() });
      window.setTimeout(() => navigateTo('game-list', null, { replace: true }), 1000);
      return;
    }

    if (mainNav && btnMenu && !e.target.closest('#main-nav') && !e.target.closest('#btn-menu')) {
      setMenuOpen(false);
    }
  });

  btnBack?.addEventListener('click', () => {
    if (window.customGameBackHandler && typeof window.customGameBackHandler === 'function') {
      const handled = window.customGameBackHandler();
      if (handled) return;
    }
    if (currentRoute !== 'game-list') {
      navigateTo('game-list', null, { replace: true });
    }
  });

  window.addEventListener('popstate', () => {
    const route = parseHash(window.location.hash);
    navigateTo(route.target, route.params, {
      replace: true,
      subParam: route.subParam,
      skipHashUpdate: true,
    });
  });

  // Globalna podpora za tipko Enter za potrjevanje in naslednje ravni
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'TEXTAREA') return;

      if (activeTag === 'INPUT' || activeTag === 'SELECT') {
        const modal = document.querySelector(
          '#game-settings-modal:not(.panel-hidden), .stage-settings-layer:not(.hidden)'
        );
        if (modal) {
          const saveBtn = modal.querySelector('#btn-save-settings, .btn-primary, .btn');
          if (saveBtn) {
            e.preventDefault();
            saveBtn.click();
            return;
          }
        }
      }

      if (activeTag === 'BUTTON') return;

      const candidateIds = [
        '#zp-next-btn',
        '#zp-retry-btn',
        '#zp-start-btn',
        '#sp-play-again',
        '#sp-restart',
        '#sp-start',
        '#rac-next-btn',
        '#rac-start-btn',
        '#str-start-btn',
        '#str-restart-btn',
        '#ab-next-btn',
        '#ab-start-btn',
        '#kv-next-btn',
        '#kv-start-btn',
        '#mj-next-btn',
        '#mj-start-btn',
        '#btn-save-settings',
        '.start-card .btn',
      ];

      for (const selector of candidateIds) {
        const btn = document.querySelector(selector);
        if (
          btn &&
          !btn.classList.contains('hidden') &&
          btn.offsetParent !== null &&
          !btn.disabled
        ) {
          e.preventDefault();
          btn.click();
          break;
        }
      }
    }
  });

  const initialRoute = parseHash(window.location.hash);
  await navigateTo(initialRoute.target, initialRoute.params, {
    replace: true,
    subParam: initialRoute.subParam,
  });
});
