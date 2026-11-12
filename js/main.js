// js/main.js
import { Settings, saveProgress } from './store.js';
import { fetchTasks } from './data.js';
import { renderGameList, renderSingleGame, renderSettings, escapeHtml } from './ui.js';
import { checkDailyCompletionOnReturn, playDaily } from './daily-themes.js';
import { showToast } from './feedback.js';
import { sounds } from './sounds.js';

import { renderStats, statsManager } from './stats.js';
import { initGameSettingsPanel } from './games/game-settings-panel.js';
import { initAchievementWatcher, renderAchievementsPanel } from './achievements.js';
import { applyCustomSettings } from './theme.js';
import { getGameEntry, getGameLoader } from './game-registry.js';
import { parseHash, formatHash } from './router.js';
import { applyCatalogFilter } from './game-catalog.js';
import { bindSettingsEvents } from './app-settings.js';

const loadedModules = {};

let appTasks = [];
let currentRoute = 'game-list';

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

async function initApp() {
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
      headerBtn.setAttribute('aria-checked', String(isEnabled));
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

  // Pod 320px se akcije igre (Navodila / Nastavitve igre / per-game gumbi)
  // premestijo v meni (gumb Meni desno zgoraj), da ne preplavijo headerja.
  const mqNarrow = window.matchMedia('(max-width: 320px)');
  const navGameSlot = document.getElementById('nav-game-actions');

  function relocateGameActions() {
    const headerSlot = document.getElementById('header-game-actions');
    if (!headerSlot || !navGameSlot) return;
    if (mqNarrow.matches) {
      const kids = [...headerSlot.children];
      if (kids.length) {
        navGameSlot.append(...kids);
        navGameSlot.hidden = false;
      }
    } else if (navGameSlot.children.length) {
      headerSlot.append(...navGameSlot.children);
      navGameSlot.hidden = true;
    }
  }

  if (typeof mqNarrow.addEventListener === 'function') {
    mqNarrow.addEventListener('change', relocateGameActions);
  }

  // `menu-open` vpliva samo na header z-index (header je nad overlayjem menija).
  // Pri zapiranju ga zadržimo še čez odjavno animacijo menija (0.3–0.35s),
  // sicer header pade na z=50, meni (z=100) pa se še ta čas riše ČEZ navbar.
  let menuCloseTimer = null;

  function setMenuOpen(open) {
    if (!mainNav || !btnMenu) return;
    mainNav.classList.toggle('open', open);
    btnMenu.setAttribute('aria-expanded', String(open));
    clearTimeout(menuCloseTimer);
    if (open) {
      document.body.classList.add('menu-open');
      // Zaklene scroll strani, ko je meni odprt
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      updateSoundUI();
    } else {
      menuCloseTimer = setTimeout(() => {
        document.body.classList.remove('menu-open');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }, 300);
    }
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

  function renderUnknownGameCard(unknownId) {
    return `
      <section class="max-w-2xl mx-auto w-full flex justify-center py-10">
        <div class="bg-white border-4 border-black p-8 shadow-brutal-xl w-full flex flex-col gap-4 items-center text-center">
          <span class="text-5xl" aria-hidden="true">🕳️</span>
          <h1 class="text-3xl font-heading font-black text-black">Igra ne obstaja</h1>
          <p class="text-slate-700 font-medium">Naslov „${escapeHtml(unknownId)}“ ne ustreza nobeni igri v zbirki.</p>
          <a href="#game-list" class="brutal-btn px-6 py-3 bg-brutal-yellow text-black font-heading font-black border-3 border-black shadow-brutal-sm hover:bg-brutal-green transition-colors">← NAZAJ NA SEZNAM IGER</a>
        </div>
      </section>`;
  }

  const routes = {
    'game-list': () => renderGameList(appTasks),
    settings: () => renderSettings(),
    stats: () => renderStats(),
    achievements: () => renderAchievementsPanel(),
    daily: () => renderDailyChallenge(),
    game: async id => {
      const loader = getGameLoader(id);
      if (loader) {
        let mod = loadedModules[id];
        if (!mod) {
          mod = await loader();
          loadedModules[id] = mod;
        }
        const entry = getGameEntry(id);
        if (entry) {
          return entry.render(mod);
        }
        // Nepričakovano: loader obstaja, vnos registra pa ne
        return renderUnknownGameCard(id);
      }
      const task = appTasks.find(t => t.id === id);
      if (task && Array.isArray(task.opcije) && task.opcije.length > 0) {
        return renderSingleGame(task);
      }
      return renderUnknownGameCard(id);
    },
  };

  let activeGameCleanup = null;

  function cleanupActiveGame() {
    const headerGameActions = document.getElementById('header-game-actions');
    if (headerGameActions) headerGameActions.innerHTML = '';
    const navGameSlot = document.getElementById('nav-game-actions');
    if (navGameSlot) {
      navGameSlot.replaceChildren();
      navGameSlot.hidden = true;
    }
    if (typeof activeGameCleanup === 'function') {
      try {
        activeGameCleanup();
      } catch (err) {
        console.error('Napaka pri zapiranju igre:', err);
      }
      activeGameCleanup = null;
    }
  }

  async function navigateTo(
    target,
    params,
    { replace = false, subParam = null, skipHashUpdate = false } = {}
  ) {
    // Preveri completion tematskih dnevnih izzivov ob vrnitvi s igre
    if (window.__dailyTheme && target !== 'game') {
      try {
        checkDailyCompletionOnReturn();
      } catch {
        /* noop */
      }
    }
    if (!routes[target] || !appContainer) return;

    cleanupActiveGame();

    setMenuOpen(false);
    currentRoute = target;

    if (btnBack) {
      const isHidden = target === 'game-list';
      btnBack.style.visibility = isHidden ? 'hidden' : 'visible';
      btnBack.style.display = isHidden ? 'none' : 'flex';
    }

    document.body.classList.toggle('game-active', target === 'game');

    const state = { target, params, subParam };
    const hashUrl = formatHash(target, params, subParam);

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
      if (target === 'game' && getGameLoader(params) && !loadedModules[params]) {
        appContainer.innerHTML = `<div class="card" style="padding:2rem; text-align:center;"><p class="subtitle">Nalagam igro ${escapeHtml(params)}…</p></div>`;
      }
      let html;
      let renderError = false;
      try {
        const route = routes[target];
        if (!route) throw new Error(`Neznana ruta "${target}"`);
        html = await route(params);
      } catch (error) {
        console.error(`Napaka pri prikazovanju vsebine "${target}":`, error);
        renderError = true;
        html = `
          <section class="max-w-2xl mx-auto w-full flex justify-center py-10">
            <div class="bg-white border-4 border-black p-8 shadow-brutal-xl w-full flex flex-col gap-3 items-center text-center">
              <span class="text-4xl" aria-hidden="true">⚠️</span>
              <h1 class="text-2xl font-heading font-black text-black">Prišlo je do napake</h1>
              <p class="text-slate-700 font-medium text-sm">Vsebine ni bilo mogoče prikazati. Poskusi osvežiti stran ali se vrniti na seznam iger.</p>
              <div class="flex flex-wrap items-center justify-center gap-3">
                <button type="button" id="btn-error-reload" class="brutal-btn px-5 py-2.5 bg-brutal-yellow text-black font-heading font-black border-3 border-black shadow-brutal-sm hover:bg-brutal-green transition-colors">↻ OSVEŽI STRAN</button>
                <a href="#game-list" class="brutal-btn px-5 py-2.5 bg-white text-black font-heading font-black border-3 border-black shadow-brutal-sm hover:bg-brutal-cyan transition-colors">← IGRE</a>
              </div>
            </div>
          </section>`;
      }
      appContainer.innerHTML = html;

      if (renderError) {
        document
          .getElementById('btn-error-reload')
          ?.addEventListener('click', () => location.reload());
        return;
      }

      if (headerCenter) {
        const teleport = document.getElementById('game-header-teleport');
        headerCenter.innerHTML = teleport && target === 'game' ? teleport.innerHTML : '';
      }

      const headerGameActions = document.getElementById('header-game-actions');
      if (headerGameActions) {
        const actionsTeleport = document.getElementById('game-actions-teleport');
        headerGameActions.innerHTML =
          actionsTeleport && target === 'game' ? actionsTeleport.innerHTML : '';
        relocateGameActions();
      }

      async function safeInitGame(gameId, initFn, ...args) {
        try {
          return initFn(...args);
        } catch (err) {
          console.error(`Napaka pri inicializaciji igre ${gameId}:`, err);
          showToast(`Igre ni bilo mogoče zagnati: ${err.message}`, {
            type: 'error',
            timeout: 5000,
          });
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

      if (target === 'game' && !renderError) {
        let mod = loadedModules[params];
        if (!mod && getGameLoader(params)) {
          try {
            mod = await getGameLoader(params)();
            loadedModules[params] = mod;
          } catch (e) {
            console.error('Nalaganje igre ni uspelo:', e);
            appContainer.innerHTML = `<div class="card"><p class="subtitle">Igre ni bilo mogoče naložiti.</p></div>`;
            return;
          }
        }
        if (mod) {
          const entry = getGameEntry(params);
          if (entry?.init) {
            activeGameCleanup = await safeInitGame(params, () => entry.init(mod, subParam));
          }
        }
        window.setTimeout(() => initGameSettingsPanel(), 0);
      } else if (target === 'settings') {
        bindSettingsEvents(navigateTo);
      }
    };

    await updateDOM();
  }

  // Expose za daily-themes in druge module
  window.navigateTo = navigateTo;
  window.playDaily = playDaily;

  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      setMenuOpen(!mainNav?.classList.contains('open'));
    });
  }

  if (btnNavClose) {
    btnNavClose.addEventListener('click', () => setMenuOpen(false));
  }

  // Klik na ozadje full-screen menija ga zapre
  if (mainNav) {
    mainNav.addEventListener('click', e => {
      if (e.target === mainNav) setMenuOpen(false);
    });
  }

  // Esc zapre meni
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setMenuOpen(false);
  });

  document.addEventListener('click', async e => {
    const btnNav = e.target.closest('.btn-nav');
    if (btnNav) {
      const target = btnNav.dataset.target;
      document.querySelectorAll('.btn-nav').forEach(b => b.removeAttribute('aria-current'));
      btnNav.setAttribute('aria-current', 'page');
      setMenuOpen(false);
      if (target)
        navigateTo(target, null, { replace: target === 'stats' || target === 'settings' });
      return;
    }

    const homeButton = e.target.closest('[data-target="home"]');
    if (homeButton) {
      if (currentRoute !== 'game-list') {
        navigateTo('game-list', null, { replace: true });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const filterPill = e.target.closest('.filter-pill');
    if (filterPill) {
      document.querySelectorAll('.filter-pill').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      filterPill.classList.add('active');
      filterPill.setAttribute('aria-current', 'true');
      applyCatalogFilter();
      return;
    }

    const insightAction = e.target.closest('.insight-action');
    if (insightAction) {
      const gameId = insightAction.dataset.game;
      if (gameId) navigateTo('game', gameId);
      return;
    }

    const dailyThemeBtn = e.target.closest('.daily-theme-btn');
    if (dailyThemeBtn) {
      playDaily(dailyThemeBtn.dataset.cat);
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

  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'catalog-search-input') {
      applyCatalogFilter();
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

  // Delegiran poslušalec za gumbe nazaj na seznam iger v vseh igrah (DRY)
  document.addEventListener('click', e => {
    const backBtn = e.target.closest('[data-action="back-to-list"], .btn-back-to-list');
    if (backBtn) {
      e.preventDefault();
      if (window.customGameBackHandler && typeof window.customGameBackHandler === 'function') {
        const handled = window.customGameBackHandler();
        if (handled) return;
      }
      if (currentRoute !== 'game-list') {
        navigateTo('game-list', null, { replace: true });
      }
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

      // Univerzalna podpora za primarno dejanje (data-primary-action="true")
      const primaryBtn = document.querySelector(
        '[data-primary-action="true"]:not(.hidden):not(:disabled), .btn-primary-action:not(.hidden):not(:disabled), .start-card .btn:not(.hidden):not(:disabled)'
      );
      if (primaryBtn && primaryBtn.offsetParent !== null) {
        e.preventDefault();
        primaryBtn.click();
      }
    }
  });

  const initialRoute = parseHash(window.location.hash);
  await navigateTo(initialRoute.target, initialRoute.params, {
    replace: true,
    subParam: initialRoute.subParam,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
