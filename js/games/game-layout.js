const INFO_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;
const SETTINGS_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.5 1z"></path></svg>`;

export function renderGameShell({
  title,
  subtitle = '',
  statusHtml = '',
  settingsHtml = '',
  stageHtml = '',
  footerHtml = '',
  infoHtml = '',
}) {
  return `
    <template id="game-header-teleport">
      ${statusHtml ? `<div class="game-status header-status">${statusHtml}</div>` : ''}
    </template>

    <div class="card game-card-shell">
      ${
        infoHtml || settingsHtml
          ? `
      <div class="game-shell-actions">
          ${
            infoHtml
              ? `<button id="btn-game-info" type="button" class="icon-btn game-info-fab" title="Navodila igre" aria-label="Navodila igre" aria-expanded="false" aria-controls="game-info-modal" data-label-open="Navodila igre" data-label-close="Zapri navodila">
            <span class="game-shell-icon game-shell-icon-open" aria-hidden="true">${INFO_ICON}</span>
            <span class="game-shell-icon game-shell-icon-close" aria-hidden="true">&times;</span>
          </button>`
              : ''
          }
          ${
            settingsHtml
              ? `<button id="btn-game-settings" type="button" class="icon-btn game-settings-fab" title="Nastavitve igre" aria-label="Nastavitve igre" aria-expanded="false" aria-controls="game-settings-modal" data-label-open="Nastavitve igre" data-label-close="Zapri nastavitve">
            <span class="game-shell-icon game-shell-icon-open" aria-hidden="true">${SETTINGS_ICON}</span>
            <span class="game-shell-icon game-shell-icon-close" aria-hidden="true">&times;</span>
          </button>`
              : ''
          }
      </div>`
          : ''
      }

      <div class="game-shell-body">
        <div id="game-stage-content" class="game-stage-content">
          ${stageHtml}
          ${footerHtml ? `<div class="game-footer">${footerHtml}</div>` : ''}
        </div>

        ${
          infoHtml
            ? `<section id="game-info-modal" class="game-aux-panel panel-hidden" aria-hidden="true">
          <div class="modal-content">
            <h3 style="margin-bottom: var(--spacing-sm);">Navodila</h3>
            <div class="info-body">${infoHtml}</div>
          </div>
        </section>`
            : ''
        }

        ${
          settingsHtml
            ? `<section id="game-settings-modal" class="game-aux-panel panel-hidden" aria-hidden="true">
          <div class="modal-content">
            <h3 style="margin-bottom: var(--spacing-sm);">Nastavitve igre</h3>
            <p class="text-muted" style="margin-bottom: var(--spacing-md); font-size: 0.9em;">Prilagodi možnosti. Ob shranjevanju se bo igra ponastavila.</p>
            <div class="info-body">
              <div id="game-settings-row" class="game-settings-row">${settingsHtml}</div>
              <div class="settings-actions" style="margin-top: var(--spacing-md); display: flex; justify-content: flex-end; gap: 10px;">
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
