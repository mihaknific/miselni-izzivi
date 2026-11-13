import { renderDailyThemesSection, playDaily } from './daily-themes.js';
import { statsManager } from './stats.js';
import { GAMES } from './game-registry.js';

// Rekordi kartic živijo v game-registry.js (polje `card`) — en vir resnice.
const CARD_BEST = Object.fromEntries(GAMES.filter(g => g.card).map(g => [g.id, g.card]));

// Expose playDaily globally for onclick handlers
if (typeof window !== 'undefined') window.playDaily = playDaily;

/* Rekordne metrike kartic živijo v game-registry.js (polje `card`). */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderGameList(tasks) {
  if (!tasks || tasks.length === 0) {
    return `<div class="card"><p class="subtitle">Ni na voljo iger.</p></div>`;
  }

  const tagColor = tag => {
    const t = String(tag || '').toLowerCase();
    if (t.includes('besed') || t.includes('besede')) return 'bg-brutal-orange';
    if (t.includes('pomn') || t.includes('spomin')) return 'bg-brutal-pink';
    if (t.includes('logik') || t.includes('ugank')) return 'bg-brutal-cyan';
    if (t.includes('aritm') || t.includes('račun') || t.includes('vzorc')) return 'bg-brutal-green';
    if (t.includes('pozorn') || t.includes('odziv')) return 'bg-brutal-purple text-white';
    return 'bg-brutal-yellow';
  };
  const tagEmoji = tag => {
    const t = String(tag || '').toLowerCase();
    if (t.includes('besed')) return '✍️';
    if (t.includes('pomn') || t.includes('spomin')) {
      return '<img src="./icons/brain-symbol.png" alt="" aria-hidden="true" class="h-7 w-7 object-contain" width="28" height="28" />';
    }
    if (t.includes('logik') || t.includes('ugank')) return '🧩';
    if (t.includes('aritm') || t.includes('račun')) return '🔢';
    if (t.includes('vzorc')) return '⚡';
    if (t.includes('pozorn') || t.includes('odziv')) return '👁️';
    return '🎯';
  };

  return `
    <div class="home-shell stack stack--xl">
      <!-- HERO -->
      <section id="hero" class="relative pt-1 px-0 max-w-7xl mx-auto w-full">
      <!-- Lebdeče nalepke -->
      <div class="only-lg-block absolute top-6 right-10 bg-brutal-green text-black border-3 border-black font-heading font-extrabold text-sm px-4 py-2 rotate-6 shadow-brutal z-10 flex items-center gap-1.5 pointer-events-none"><i class="fa-solid fa-bolt" aria-hidden="true"></i> 100% MOŽGANSKA ZABAVA</div>
      <div class="bg-white border-4 border-black p-6 md:p-10 lg:pb-24 shadow-brutal-xl relative flex flex-col gap-12">
        <div class="max-w-3xl mx-auto text-center stack stack--lg">
          <div class="inline-block self-center bg-brutal-orange text-black font-heading font-black border-3 border-black px-4 py-1.5 uppercase shadow-brutal hero-badge-pill">
            🚀 LOGIKA • SPOMIN • MATEMATIKA • BESEDE
          </div>
          <h1 class="text-3xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight text-black hero-main-title">
            RAZGIBAJ MOŽGANE Z <br/>
            <span class="bg-brutal-yellow px-3 py-1 inline-block border-3 border-black shadow-brutal transform -rotate-1 mt-3">
              IGRO IN LOGIKO!
            </span>
          </h1>
          <p class="text-base md:text-lg font-medium text-slate-900 leading-relaxed max-w-2xl mx-auto">
            Brez dolgočasne teorije. Samo hitri in vizualno zabavni miselni izzivi za vsakodnevni mentalni trening.
          </p>
          <div class="hero-cta-cluster pt-2">
            <a href="#game-list" class="brutal-btn hero-cta-btn px-6 py-3 bg-brutal-pink text-black font-heading font-black text-base border-3 border-black shadow-brutal flex items-center gap-2">
              <i class="fa-solid fa-play"></i> SKOČI NA IGRE
            </a>
            <a href="#dnevni-izziv" class="brutal-btn hero-cta-btn px-6 py-3 bg-brutal-cyan text-black font-heading font-black text-base border-3 border-black shadow-brutal flex items-center gap-2">
              <i class="fa-solid fa-bolt"></i> DNEVNI IZZIV
            </a>
          </div>
        </div>
        <div class="hero-stat-grid pt-6 border-t-4 border-black" role="group" aria-label="Statistika aplikacije">
          <div class="bg-brutal-bg p-3 border-3 border-black text-center shadow-brutal-sm stack stack--sm relative">
            <span class="block font-heading font-black text-xl sm:text-2xl text-brutal-purple">${tasks.length}+</span>
            <span class="hero-stat-label text-xs font-bold uppercase">iger</span>
            <div class="only-lg-block absolute -bottom-10 -left-2 bg-brutal-pink text-black border-3 border-black font-heading font-extrabold text-sm px-4 py-2 rotate-3 shadow-brutal z-20 flex items-center gap-1.5 whitespace-nowrap"><i class="fa-solid fa-bullseye" aria-hidden="true"></i> MOŽGANSKI TRENER v2.0</div>
          </div>
          <div class="bg-brutal-bg p-3 border-3 border-black text-center shadow-brutal-sm stack stack--sm">
            <span class="block font-heading font-black text-xl sm:text-2xl text-brutal-orange">100%</span>
            <span class="hero-stat-label text-xs font-bold uppercase">Brezplačno</span>
          </div>
          <div class="bg-brutal-bg p-3 border-3 border-black text-center shadow-brutal-sm stack stack--sm">
            <span class="block font-heading font-black text-xl sm:text-2xl text-brutal-green">5 MIN</span>
            <span class="hero-stat-label text-xs font-bold uppercase">na izziv</span>
          </div>
          <div class="bg-brutal-bg p-3 border-3 border-black text-center shadow-brutal-sm stack stack--sm">
            <span class="block font-heading font-black text-lg sm:text-xl md:text-2xl text-brutal-pink tracking-tight truncate">LOKALNO</span>
            <span class="hero-stat-label text-xs font-bold uppercase">shranjevanje</span>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA: PODPRI PROJEKT -->
    <section class="px-0 max-w-7xl mx-auto w-full stack stack--sm" aria-label="Podpri projekt">
      <a
        href="https://mihaknific.github.io/podpora"
        target="_blank"
        rel="noopener"
        class="brutal-btn flex items-center justify-center gap-2 px-6 py-3.5 bg-brutal-pink text-black font-heading font-black text-base md:text-lg border-4 border-black shadow-brutal-xl hover:bg-brutal-orange w-full max-w-2xl mx-auto"
      >
        <i class="fa-solid fa-heart" aria-hidden="true"></i> PODPRI PROJEKT <span aria-hidden="true">→</span>
      </a>
    </section>

    <!-- DNEVNI IZZIV SPOTLIGHT -->
    <section id="dnevni-izziv" class="px-0 max-w-7xl mx-auto w-full stack stack--lg">
      <div class="daily-challenge-banner bg-brutal-orange border-4 border-black p-6 md:p-8 shadow-brutal-lg">
        <div class="text-left stack items-start">
          <span class="px-3 py-1 bg-black text-white font-heading font-black text-xs uppercase shadow-brutal-sm inline-block">
            🔥 DNEVNI IZZIV (${new Date().toLocaleDateString('sl-SI', { day: 'numeric', month: 'long' }).toUpperCase()})
          </span>
          <h2 class="text-2xl md:text-4xl font-heading font-black text-black">
            DNEVNI KOGNITIVNI PAKET
          </h2>
          <p class="text-sm md:text-base font-medium text-black max-w-xl">
            Sklop 3–4 iger za celovito kognitivno vadbo današnjega dne. Reši celoten paket, zbiraj točke in ohrani svoj dnevni niz (streak)!
          </p>
        </div>
        <a href="#game/daily" class="daily-challenge-btn brutal-btn px-5 py-3 sm:px-8 sm:py-4 bg-white text-black font-heading font-black text-base sm:text-lg border-3 border-black shadow-brutal md:whitespace-nowrap flex items-center justify-center gap-2">
          REŠUJ DNEVNI PAKET →
        </a>
      </div>

      ${renderDailyThemesSection()}
    </section>

    <!-- SEZNAM IGER -->
    <section id="game-list" class="pb-10 px-0 max-w-7xl mx-auto w-full stack stack--lg">
      <div class="text-center md:text-left stack items-start md:items-start">
        <span class="px-3 py-1 bg-brutal-purple text-white border-3 border-black font-heading font-black text-xs uppercase shadow-brutal-sm">
          🎮 ZBIRKA IGER
        </span>
        <h2 class="text-3xl sm:text-5xl font-heading font-black text-black">VSI MISELNI IZZIVI</h2>
        <p class="text-slate-800 font-medium text-base">Izberi igro glede na kategorijo ali težavnost ter preizkusi svoje možganske vijuge!</p>
      </div>

      <!-- FILTER BANNER -->
      <div class="bg-white border-4 border-black p-4 shadow-brutal-lg stack stack--sm">
        <div class="cluster items-stretch lg:items-center justify-between gap-3">
          <div class="relative flex-1">
            <input
              type="search"
              id="catalog-search-input"
              class="catalog-search-input w-full pl-10 pr-4 py-2.5 bg-brutal-bg border-3 border-black font-bold text-sm text-black placeholder-slate-600 focus:outline-none focus:bg-white shadow-brutal-sm"
              placeholder="Išči igro po imenu ali opisu…"
              aria-label="Išči med igrami"
            />
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-black"></i>
          </div>
          <div class="cluster" id="catalog-filter-tags">
            <button class="filter-pill active px-3 py-2 bg-brutal-yellow text-black border-3 border-black font-heading font-black text-xs shadow-brutal-sm" data-filter="all">VSE (${tasks.length})</button>
            <button class="filter-pill px-3 py-2 bg-white text-black border-3 border-black font-heading font-bold text-xs shadow-brutal-sm hover:bg-brutal-cyan" data-filter="številke">ŠTEVILKE</button>
            <button class="filter-pill px-3 py-2 bg-white text-black border-3 border-black font-heading font-bold text-xs shadow-brutal-sm hover:bg-brutal-orange" data-filter="besede">BESEDE</button>
            <button class="filter-pill px-3 py-2 bg-white text-black border-3 border-black font-heading font-bold text-xs shadow-brutal-sm hover:bg-brutal-pink" data-filter="spomin">SPOMIN</button>
            <button class="filter-pill px-3 py-2 bg-white text-black border-3 border-black font-heading font-bold text-xs shadow-brutal-sm hover:bg-brutal-purple hover:text-white" data-filter="pozornost">POZORNOST</button>
            <button class="filter-pill px-3 py-2 bg-white text-black border-3 border-black font-heading font-bold text-xs shadow-brutal-sm hover:bg-brutal-cyan" data-filter="logika">LOGIKA</button>
          </div>
        </div>
      </div>

      <!-- GAMES GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="games-container" role="list">
        ${(() => {
      const allRecs = statsManager.getAllRecords();
      return tasks
        .map(t => {
          const played = (allRecs[t.id] || []).length;
          const meta = CARD_BEST[t.id];
          let bestHtml = '';
          if (played > 0 && meta) {
            const rec = statsManager.getBest(t.id, meta.metric, meta.max);
            if (rec && rec[meta.metric] != null) {
              bestHtml = `<span>🏆 Rekord: <strong class="text-brutal-purple">${meta.fmt(rec[meta.metric])}</strong></span>`;
            }
          }
          return `
            <article class="game-card brutal-card bg-white border-4 border-black p-6 shadow-brutal relative flex flex-col justify-between cursor-pointer" data-tid="${escapeHtml(t.id)}" data-category="${escapeHtml((t.tag || '').toLowerCase())}" data-title="${escapeHtml((t.title || '').toLowerCase())}" role="listitem" aria-label="${escapeHtml(t.title || 'Izziv')}">
              <div class="stack">
                <div class="cluster">
                  <span class="px-3 py-1 ${tagColor(t.tag)} border-2 border-black font-heading font-black text-xs">${escapeHtml((t.tag || '').toUpperCase())}</span>
                </div>
                <div class="w-14 h-14 ${tagColor(t.tag)} border-3 border-black flex items-center justify-center text-2xl font-black shadow-brutal-sm">
                  ${tagEmoji(t.tag)}
                </div>
                <h3 class="gc-title text-2xl font-heading font-black text-black">${escapeHtml(t.title || 'Izziv')}</h3>
                <p class="gc-desc text-sm font-medium text-slate-700 leading-relaxed">
                  ${escapeHtml(t.description || t.opis || '')}
                </p>
              </div>
              <div class="stack stack--md">
                <div class="cluster justify-between gap-2 border-t-3 border-black pt-4 text-xs font-bold">
                  <span>${played > 0 ? `Odigrano: <strong class="text-brutal-purple">${played}×</strong>` : 'Še nisi igral'}</span>
                  ${bestHtml}
                </div>
                <button class="brutal-btn w-full py-3 bg-brutal-green text-black font-heading font-black text-center border-3 border-black shadow-brutal-sm block" aria-label="Igraj ${escapeHtml(t.title || 'izziv')}">
                  IGRAJ ZDAJ →
                </button>
              </div>
              <div class="gc-badge hidden">${escapeHtml(t.tag || t.kategorija || '')}</div>
            </article>
            `;
        })
        .join('');
    })()}
      </div>

      <div id="no-results" class="hidden text-center py-10 bg-white border-4 border-black p-6 shadow-brutal stack items-center">
        <span class="text-4xl">🔍</span>
        <h3 class="text-2xl font-heading font-black text-black">Ni najdenih iger!</h3>
        <p class="text-slate-700 font-medium text-sm">Poskusi z drugim iskalnim nizom ali spremeni izbrano kategorijo.</p>
      </div>
    </section>
    </div>
  `;
}

export function renderSingleGame(task) {
  if (!task) return `Igra ne obstaja.`;
  return `
      <div class="card game-card-shell">
        <div class="flex-between-start">
          <h2 class="title text-xl mb-0">${escapeHtml(task.title || 'Miselni Izziv')}</h2>
          <button class="icon-btn" id="btn-game-settings" title="Nastavitve igre">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
        </div>
        <span class="badge mt-sm mb-md">${escapeHtml(task.kategorija)}</span>
        <p class="text-lg mb-lg">${escapeHtml(task.vprasanje)}</p>
        <div class="flex-col gap-sm">
          ${task.opcije
      .map(
        (opt, i) => `
            <button class="btn btn-outline answer-btn" data-tid="${escapeHtml(task.id)}" data-idx="${i}">${escapeHtml(opt)}</button>
          `
      )
      .join('')}
        </div>
      </div>
    `;
}

export function renderSettings() {
  return `
    <div class="settings-page">
      <section class="settings-panel">
        <h2 class="title">Nastavitve aplikacije</h2>
        <p class="subtitle mb-lg">Prilagodi izgled in upravljaj s podatki.</p>

        <div class="stack stack--md">
          <label class="cluster justify-between">
            Barva glavnega besedila:
            <input type="color" id="opt-textColor" data-default="#000000">
          </label>

          <label class="cluster justify-between">
            Barva naslovov:
            <input type="color" id="opt-headingColor" data-default="#000000">
          </label>

          <label class="cluster justify-between">
            Barva pomožnega besedila:
            <input type="color" id="opt-mutedColor" data-default="#475569">
          </label>

          <label class="cluster justify-between">
            Barva primarnega gumba:
            <input type="color" id="opt-primaryColor" data-default="#FACC15">
          </label>

          <label class="cluster justify-between">
            Barva ozadja:
            <input type="color" id="opt-bgColor" data-default="#FEFCE8">
          </label>

          <hr>

          <h3 class="text-md text-primary m-0">Barvne teme (prednastavitve)</h3>
          <p class="text-sm text-muted mb-sm">Pripravljene teme. Klikni in takoj vidiš učinek.</p>
          <div class="cluster mb-md">
            <button class="btn btn-outline preset-btn" data-preset="default">Privzeta</button>
            <button class="btn btn-outline preset-btn" data-preset="zinc">Čista (Zinc)</button>
            <button class="btn btn-outline preset-btn" data-preset="stone">Topla (Stone)</button>
            <button class="btn btn-outline preset-btn" data-preset="blue">Modra</button>
            <button class="btn btn-outline preset-btn" data-preset="green">Zelena</button>
            <button class="btn btn-outline preset-btn" data-preset="rose">Rožnata</button>
            <button class="btn btn-outline preset-btn" data-preset="dark">Temni način</button>
            <button class="btn btn-outline preset-btn" data-preset="neobrutalism">Neo-Brutalism</button>
          </div>

          <hr>

          <h3 class="text-md text-primary m-0">Upravljanje podatkov</h3>
          <p class="text-sm text-muted mb-sm">Izvozi ali uvozi svoj napredek in nastavitve.</p>

          <div class="cluster">
              <button id="btn-export" class="btn btn-outline">📤 Izvozi podatke</button>
              <label for="btn-import" class="btn btn-outline">
                  📥 Uvozi podatke
                  <input type="file" id="btn-import" class="hidden-input" accept=".json">
              </label>
          </div>

          <hr>

          <h3 class="text-md text-primary m-0">Podpri projekt</h3>
          <p class="text-sm text-muted mb-sm">Aplikacija je brezplačna — podpora je prostovoljna.</p>
          <a
            href="https://mihaknific.github.io/podpora"
            target="_blank"
            rel="noopener"
            class="brutal-btn inline-flex items-center gap-2 px-6 py-3 bg-brutal-pink text-black font-heading font-black border-3 border-black shadow-brutal hover:bg-brutal-orange"
          >
            <i class="fa-solid fa-heart" aria-hidden="true"></i> Podpri
          </a>

          <hr>

          <button id="btn-reset" class="btn btn-danger">Ponastavi videz na privzeto</button>
        </div>
      </section>
    </div>
  `;
}
