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
    return `<div class="card"><p class="subtitle">Ni na voljo nalog.</p></div>`;
  }

  return `
    <div class="hero-card card" style="background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%); color: #fff; padding: var(--spacing-lg); margin: var(--spacing-md) auto; max-width: 1200px; width: calc(100% - 2*var(--spacing-md)); border: none; box-shadow: 0 10px 30px rgba(99,102,241,0.3);">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap: var(--spacing-md);">
            <div>
                <h2 style="margin:0 0 6px 0; font-size:1.4rem; font-weight:800; color:#fff;">Dnevni miselni izziv 🧠</h2>
                <p style="margin:0; opacity:0.9; font-size:0.95rem;">5 minut dnevno za ostrejši um – izberi igro in ohrani niz!</p>
            </div>
            <button class="btn daily-start-btn" style="background:#fff; color:var(--color-primary); font-weight:700; white-space:nowrap;" data-target="game/vzorci/1">▶ Začni z vzorci</button>
        </div>
    </div>
    <div class="container-grid">
      ${tasks
        .map(
          t => `
          <div class="card game-card cursor-pointer" data-tid="${escapeHtml(t.id)}">
            <h3 class="gc-title">${escapeHtml(t.title || 'Izziv')}</h3>
            <span class="badge gc-badge">${escapeHtml(t.tag || t.kategorija || '')}</span>
            <p class="gc-desc">${escapeHtml(t.description || t.opis || '')}</p>
          </div>
      `
        )
        .join('')}
    </div>
  `;
}

export function renderSingleGame(task) {
  if (!task) return `Napaka.`;
  return `
      <div class="card" style="position: relative;">
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
        <h2 class="title">Nastavitve Aplikacije</h2>
        <p class="subtitle mb-lg">Prilagodite izgled in upravljajte s podatki.</p>
        
        <div class="flex-col gap-md">
          <label class="flex-between">
            Velikost pisave:
            <select id="opt-fontSize" class="form-select" data-default="16px">
              <option value="14px">Majhna</option>
              <option value="16px">Srednja (Privzeta)</option>
              <option value="20px">Velika</option>
              <option value="24px">Zelo velika</option>
            </select>
          </label>
          
          <label class="flex-between">
            Barva glavnega besedila:
            <input type="color" id="opt-textColor" data-default="#0f172a">
          </label>

          <label class="flex-between">
            Barva naslovov:
            <input type="color" id="opt-headingColor" data-default="#0f172a">
          </label>

          <label class="flex-between">
            Barva pomožnega besedila:
            <input type="color" id="opt-mutedColor" data-default="#64748b">
          </label>
          
          <label class="flex-between">
            Barva primarnega gumba:
            <input type="color" id="opt-primaryColor" data-default="#1e293b">
          </label>

          <label class="flex-between">
            Barva ozadja:
            <input type="color" id="opt-bgColor" data-default="#f8fafc">
          </label>
          
          <hr>

          <h3 class="text-md text-primary m-0">Barvne teme (Prednastavitve)</h3>
          <p class="text-sm text-muted mb-sm">Profesionalne teme. Izberi in takoj vidiš učinek.</p>
          <div class="flex-row gap-sm mb-md flex-wrap">
            <button class="btn btn-outline preset-btn" data-preset="default">Privzeta</button>
            <button class="btn btn-outline preset-btn" data-preset="zinc">Čista (Zinc)</button>
            <button class="btn btn-outline preset-btn" data-preset="stone">Topla (Stone)</button>
            <button class="btn btn-outline preset-btn" data-preset="blue">Modra</button>
            <button class="btn btn-outline preset-btn" data-preset="green">Zelena</button>
            <button class="btn btn-outline preset-btn" data-preset="rose">Rožnata</button>
            <button class="btn btn-outline preset-btn" data-preset="dark">Temni način</button>
          </div>

          <hr>

          <h3 class="text-md text-primary m-0">Upravljanje podatkov</h3>
          <p class="text-sm text-muted mb-sm">Izvozite ali uvozite napredek in nastavitve.</p>
          
          <div class="flex-row gap-md flex-wrap">
              <button id="btn-export" class="btn btn-outline">📤 Shrani / Izvozi</button>
              <label for="btn-import" class="btn btn-outline">
                  📥 Naloži / Uvozi
                  <input type="file" id="btn-import" class="hidden-input" accept=".json">
              </label>
          </div>

          <hr>
          
          <button id="btn-reset" class="btn btn-danger">Ponastavi videz na privzeto</button>
        </div>
      </section>
    </div>
  `;
}
