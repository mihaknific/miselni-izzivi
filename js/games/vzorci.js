// js/games/vzorci.js — Modul Matematični vzorci in algebrski izzivi (ES6 modul)

import { renderGameShell } from './game-layout.js';
import { statsManager } from '../stats.js';
import { sounds } from '../sounds.js';
import { showToast, showConfetti } from '../feedback.js';
import { generatePattern, generatePatternBatch } from './pattern-generators.js';
import { escapeHtml } from '../ui.js';

let patternsData = [];
const PREDEFINED_LEVELS = 50; // Število nivojev iz patterns.json

export function renderVzorci() {
  const settingsHtml = `
        <div class="card" style="margin-bottom: var(--spacing-md);">
            <h3>Nastavitve modula Matematični vzorci</h3>
            <p style="color: var(--color-text-muted); font-size: 0.9rem;">
                Modul vključuje vseh 50 nivojev vizualnih in algebrskih vzorcev z avtomatskim shranjevanjem vašega napredka.
            </p>
        </div>
    `;

  const stageHtml = `
        <div id="vzorci-game-shell">
            <div id="vzorci-start-screen" class="card text-center stage-layer">
                <div class="start-card" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: var(--spacing-xl) var(--spacing-md); gap: var(--spacing-md);">
                    <div style="width:72px; height:72px; border-radius:20px; background:rgba(var(--color-primary-rgb), 0.1); display:flex; align-items:center; justify-content:center; color:var(--color-primary); margin-bottom:var(--spacing-xs);">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <h2 class="title" style="margin:0;">Matematični vzorci in uganke</h2>
                    <p class="subtitle" style="max-width:540px; margin:0; color:var(--color-text-muted);">
                        Prepoznaj matematične vzorce, dešifriraj algebrske sisteme ter reši vizualne geometrijske uganke.
                    </p>
                    <button id="vzorci-start-btn" class="btn start-btn" style="margin-top:var(--spacing-sm); min-width:200px;">Začni z reševanjem ➔</button>
                </div>
            </div>

            <div id="vzorci-play-screen" class="stage-layer hidden">
                <div class="vzorci-container">
                    <div class="vzorci-level-bar">
                        <button id="vzorci-prev-lvl-btn" class="btn btn-outline vzorci-nav-btn" aria-label="Prejšnji nivo">◀ Prejšnji</button>
                        <div class="vzorci-level-title">
                            <span id="vzorci-level-label" class="vzorci-level-label">Nivo 1 / 50</span>
                            <span id="vzorci-cat-badge" class="vzorci-level-badge">Algebra</span>
                        </div>
                        <button id="vzorci-next-lvl-btn" class="btn btn-outline vzorci-nav-btn" aria-label="Naslednji nivo">Naslednji ▶</button>
                    </div>

                    <div id="vzorci-visual-card" class="vzorci-visual-card">
                        <div id="vzorci-graphic-area"></div>
                    </div>

                    <div class="vzorci-numpad-area">
                        <div id="vzorci-display-box" class="vzorci-display-box" tabindex="0" role="textbox" aria-label="Polje za vnos odgovora">
                            <span id="vzorci-display-val" class="vzorci-display-val"></span><span id="vzorci-cursor" class="vzorci-cursor"></span>
                            <span id="vzorci-display-placeholder" class="vzorci-display-placeholder">Vnesi odgovor...</span>
                        </div>

                        <div class="vzorci-numpad-grid">
                            <button class="vzorci-num-btn" data-key="1">1</button>
                            <button class="vzorci-num-btn" data-key="2">2</button>
                            <button class="vzorci-num-btn" data-key="3">3</button>
                            <button class="vzorci-num-btn" data-key="4">4</button>
                            <button class="vzorci-num-btn" data-key="5">5</button>

                            <button class="vzorci-num-btn" data-key="6">6</button>
                            <button class="vzorci-num-btn" data-key="7">7</button>
                            <button class="vzorci-num-btn" data-key="8">8</button>
                            <button class="vzorci-num-btn" data-key="9">9</button>
                            <button class="vzorci-num-btn" data-key="0">0</button>

                            <button class="vzorci-num-btn btn-action" data-key="clear">C</button>
                            <button class="vzorci-num-btn btn-action" data-key="backspace">⌫</button>
                            <button id="vzorci-submit-btn" class="vzorci-num-btn btn-enter">Potrdi odgovor ➔</button>
                        </div>
                    </div>

                    <div id="vzorci-hint-area" class="vzorci-hint-box hidden"></div>
                    <div id="vzorci-explanation-area" class="vzorci-explanation-box hidden"></div>

                    <div class="flex-between flex-wrap gap-sm mt-xs" style="width:100%; max-width:540px; margin:0 auto;">
                        <button id="vzorci-hint-btn" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.85rem;">💡 1. Namig (Smernica)</button>
                        <button id="vzorci-grid-toggle-btn" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.85rem;">≡ Seznam nivojev</button>
                        <button id="vzorci-generate-btn" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.85rem; display:none;">🔄 Nov generiran nivo</button>
                    </div>

                    <div id="vzorci-grid-view" class="vzorci-levels-grid hidden"></div>
                </div>
            </div>

            <div id="vzorci-end-screen" class="card text-center stage-layer hidden">
                <div class="end-card" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: var(--spacing-xl) var(--spacing-md); gap: var(--spacing-sm);">
                    <div style="font-size: 3.5rem; margin-bottom: var(--spacing-xs);">🏆</div>
                    <h3 class="result-title result-success" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--color-success);">Čestitke! Vsi nivoji zaključeni! 🎉</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Rešenih nalog: <strong id="vzorci-final-count">0/0</strong></p>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-sm);">Pridobljene XP točke: <strong id="vzorci-final-xp">0</strong> XP</p>
                    <button id="vzorci-retry-btn" class="btn">Ponovno od začetka ↺</button>
                    <button id="vzorci-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 style="margin-bottom: 8px;">O modulu Matematični vzorci</h4>
        <p style="margin-bottom: 12px;">Modul prinaša <strong>50 vizualno-matematičnih nalog</strong> v 10 grafičnih kategorijah, zasnovanih po vzoru vrhunskih mobilnih aplikacij (kot sta Math Riddles in Math Puzzles):</p>
        <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.6;">
            <li><strong>Algebrski sistemi:</strong> Reševanje linearnih enačb z neznankami.</li>
            <li><strong>Sadne in simbolne enačbe:</strong> Emoji in ikone (🍎, 🍕, 💎) namesto spremenljivk.</li>
            <li><strong>Številske piramide:</strong> Seštevanje ali množenje sosednjih blazinj za vrh.</li>
            <li><strong>Domino zaporedja:</strong> Logika vrtenja in sprememb zgornjih/spodnjih vrednosti.</li>
            <li><strong>Ure in koti:</strong> Prepoznavanje urnih zamikov in kotnih premikov.</li>
        </ul>
    `;

  return renderGameShell({
    title: 'Matematični vzorci',
    subtitle: 'Vizualni algebrski in geometrijski izzivi.',
    stageHtml,
    infoHtml,
  });
}

export function initVzorci(initialSubParam = null) {
  let currentLevelIndex = 0;
  let userInput = '';
  let currentHintIndex = 0;
  let solvedCount = 0;
  let totalXpEarned = 0;
  let isTransitioning = false;
  let transitionTimer = null;

  const startScreen = document.getElementById('vzorci-start-screen');
  const playScreen = document.getElementById('vzorci-play-screen');
  const endScreen = document.getElementById('vzorci-end-screen');

  const startBtn = document.getElementById('vzorci-start-btn');
  const retryBtn = document.getElementById('vzorci-retry-btn');
  const prevLvlBtn = document.getElementById('vzorci-prev-lvl-btn');
  const nextLvlBtn = document.getElementById('vzorci-next-lvl-btn');
  const gridToggleBtn = document.getElementById('vzorci-grid-toggle-btn');
  const gridView = document.getElementById('vzorci-grid-view');

  const levelLabel = document.getElementById('vzorci-level-label');
  const catBadge = document.getElementById('vzorci-cat-badge');
  const graphicArea = document.getElementById('vzorci-graphic-area');
  const displayVal = document.getElementById('vzorci-display-val');
  const displayPlaceholder = document.getElementById('vzorci-display-placeholder');
  const displayBox = document.getElementById('vzorci-display-box');
  const submitBtn = document.getElementById('vzorci-submit-btn');

  const hintArea = document.getElementById('vzorci-hint-area');
  const explanationArea = document.getElementById('vzorci-explanation-area');
  const hintBtn = document.getElementById('vzorci-hint-btn');

  function getSavedProgress() {
    try {
      const data = localStorage.getItem('vzorci_saved_progress');
      return data ? JSON.parse(data) : { solvedIds: [] };
    } catch (e) {
      return { solvedIds: [] };
    }
  }

  function markLevelSolved(levelId) {
    const progress = getSavedProgress();
    if (!progress.solvedIds.includes(levelId)) {
      progress.solvedIds.push(levelId);
    }
    try {
      localStorage.setItem('vzorci_saved_progress', JSON.stringify(progress));
    } catch (e) {
      console.error('Napaka pri shranjevanju vzorci_saved_progress', e);
    }
  }

  async function loadPatterns() {
    if (patternsData.length > 0) return;
    try {
      const res = await fetch('./data/patterns.json');
      if (res.ok) {
        const predefined = await res.json();
        patternsData = [...predefined];

        // Generiraj proceduralne nivoje za neskončen content
        // Tipi, ki podpirajo proceduralno generiranje
        const proceduralTypes = [
          'pyramid_bricks',
          'system_algebra',
          'wheel_spokes',
          'domino_tiles',
        ];
        let procLevel = PREDEFINED_LEVELS + 1;

        for (const type of proceduralTypes) {
          // Generiraj 20 proceduralnih nivojev na tip (skupaj 80+ dodatnih nivojev)
          const batch = generatePatternBatch(type, 20, procLevel * 10000);
          batch.forEach((p, i) => {
            patternsData.push({
              ...p,
              id: `proc-${type}-${i + 1}`,
              level: procLevel++,
              category: type,
              title: `${type === 'pyramid_bricks' ? 'Piramida' : type === 'system_algebra' ? 'Algebra' : type === 'wheel_spokes' ? 'Kolo' : 'Domino'} #${i + 1} (generirano)`,
              procedural: true,
            });
          });
        }

        console.log(
          `Naloženih ${patternsData.length} nivojev (${PREDEFINED_LEVELS} preddefiniranih + ${patternsData.length - PREDEFINED_LEVELS} proceduralnih)`
        );
      }
    } catch (e) {
      console.error('Napaka pri nalaganju patterns.json', e);
    }
  }

  function showLayer(layer) {
    [startScreen, playScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (layer) layer.classList.remove('hidden');
  }

  function updateUrlHash(levelIdx) {
    const newHash = `#game/vzorci/${levelIdx + 1}`;
    if (window.location.hash !== newHash) {
      history.pushState(
        { target: 'game', params: 'vzorci', subParam: String(levelIdx + 1) },
        '',
        newHash
      );
    }
  }

  function renderLevel(idx) {
    if (!patternsData || patternsData.length === 0) return;
    if (transitionTimer) {
      clearTimeout(transitionTimer);
      transitionTimer = null;
    }
    isTransitioning = false;
    currentLevelIndex = Math.max(0, Math.min(idx, patternsData.length - 1));
    const pattern = patternsData[currentLevelIndex];
    userInput = '';
    currentHintIndex = 0;

    updateUrlHash(currentLevelIndex);
    updateDisplay();

    // Pokaži "∞" za proceduralne nivoje
    const isProcedural = pattern.procedural === true;
    const totalLabel = isProcedural ? '∞' : patternsData.length;
    if (levelLabel) levelLabel.textContent = `Nivo ${pattern.level} / ${totalLabel}`;
    if (catBadge) catBadge.textContent = isProcedural ? `${pattern.title} 🔄` : pattern.title;

    // Pokaži/skrij "Nov generiran nivo" gumb za proceduralne nivoje
    const generateBtn = document.getElementById('vzorci-generate-btn');
    if (generateBtn) {
      generateBtn.style.display = isProcedural ? 'inline-flex' : 'none';
    }

    if (hintArea) {
      hintArea.classList.add('hidden');
      hintArea.innerHTML = '';
    }
    if (explanationArea) {
      explanationArea.classList.add('hidden');
      explanationArea.innerHTML = '';
    }

    updateHintButton();
    renderGraphic(pattern);
    renderLevelsGrid();

    // Auto-focus za takojšen vizualni feedback kurzorja
    if (displayBox) displayBox.focus();
  }

  function renderGraphic(pattern) {
    if (!graphicArea) return;
    graphicArea.innerHTML = '';

    if (
      pattern.type === 'system_algebra' ||
      pattern.type === 'operator_rule' ||
      pattern.type === 'fruit_algebra'
    ) {
      const box = document.createElement('div');
      box.className = 'vzorci-algebra-box';
      const lines = pattern.data.lines || [];
      lines.forEach((line, i) => {
        const lineDiv = document.createElement('div');
        const isTarget = line.includes('?');
        lineDiv.className = `vzorci-algebra-line ${isTarget ? 'target' : ''}`;
        if (pattern.type === 'fruit_algebra') {
          lineDiv.style.fontSize = '1.35rem';
        }
        lineDiv.textContent = line;
        box.appendChild(lineDiv);
      });
      graphicArea.appendChild(box);
    } else if (pattern.type === 'pyramid_bricks') {
      const bottom = pattern.data.bottom || [3, 4, 5];
      const middle = pattern.data.middle || null;
      const promptText = pattern.data.prompt || 'Koliko je vrh piramide?';
      const svgBox = document.createElement('div');
      svgBox.className = 'vzorci-svg-container';

      const box = document.createElement('div');
      box.style.display = 'flex';
      box.style.flexDirection = 'column';
      box.style.alignItems = 'center';
      box.style.gap = '12px';
      box.style.width = '100%';

      const titleP = document.createElement('p');
      titleP.style.fontSize = '0.95rem';
      titleP.style.fontWeight = '600';
      titleP.style.textAlign = 'center';
      titleP.style.margin = '0';
      titleP.textContent = promptText;
      box.appendChild(titleP);

      const n = bottom.length;
      const brickW = 70;
      const brickH = 36;
      const svgW = n * brickW + 40;
      const svgH = n * brickH + 20;

      let svgContent = `<svg class="vzorci-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;

      for (let row = 0; row < n; row++) {
        const countInRow = n - row;
        const rowY = svgH - (row + 1) * brickH - 10;
        const startX = (svgW - countInRow * brickW) / 2;

        for (let col = 0; col < countInRow; col++) {
          const bx = startX + col * brickW;
          const isTop = row === n - 1;
          let val = '';
          if (row === 0) val = bottom[col];
          else if (row === 1 && middle && middle[col] != null) val = middle[col];
          else if (isTop) val = '?';

          svgContent += `
                        <rect x="${bx + 2}" y="${rowY + 2}" width="${brickW - 4}" height="${brickH - 4}" 
                              fill="${isTop ? 'rgba(var(--color-primary-rgb), 0.15)' : 'var(--color-bg)'}" 
                              stroke="${isTop ? 'var(--color-primary)' : 'var(--color-border)'}" 
                              stroke-width="2" rx="4" />
                        <text x="${bx + brickW / 2}" y="${rowY + brickH / 2 + 6}" 
                              fill="${isTop ? 'var(--color-primary)' : 'var(--color-text-main)'}" 
                              font-size="18" font-weight="800" text-anchor="middle">${val}</text>
                    `;
        }
      }

      svgContent += `</svg>`;
      svgBox.innerHTML = svgContent;
      box.appendChild(svgBox);
      graphicArea.appendChild(box);
    } else if (pattern.type === 'domino_tiles') {
      const tiles = pattern.data.tiles || [];
      const svgBox = document.createElement('div');
      svgBox.className = 'vzorci-svg-container';

      const count = tiles.length;
      const tileW = 54;
      const tileH = 100;
      const svgW = count * (tileW + 16) + 20;
      const svgH = tileH + 30;

      let svgContent = `<svg class="vzorci-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;

      tiles.forEach((t, i) => {
        const tx = 20 + i * (tileW + 16);
        const ty = 15;
        const isTarget = t.bottom === '?';

        svgContent += `
                    <rect x="${tx}" y="${ty}" width="${tileW}" height="${tileH}" 
                          fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="2.5" rx="8" />
                    <line x1="${tx + 4}" y1="${ty + tileH / 2}" x2="${tx + tileW - 4}" y2="${ty + tileH / 2}" stroke="var(--color-border)" stroke-dasharray="3 3" stroke-width="2" />
                    
                    <text x="${tx + tileW / 2}" y="${ty + tileH / 4 + 7}" fill="var(--color-text-main)" font-size="20" font-weight="800" text-anchor="middle">${t.top}</text>
                    <text x="${tx + tileW / 2}" y="${ty + (3 * tileH) / 4 + 7}" fill="${isTarget ? 'var(--color-primary)' : 'var(--color-text-main)'}" font-size="20" font-weight="800" text-anchor="middle">${t.bottom}</text>
                `;
      });

      svgContent += `</svg>`;
      svgBox.innerHTML = svgContent;
      graphicArea.appendChild(svgBox);
    } else if (pattern.type === 'clock_faces') {
      const clocks = pattern.data.clocks || [1, 3, 5, '?'];
      const svgBox = document.createElement('div');
      svgBox.className = 'vzorci-svg-container';

      const count = clocks.length;
      const r = 36;
      const svgW = count * (r * 2 + 20) + 20;
      const svgH = r * 2 + 40;

      let svgContent = `<svg class="vzorci-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;

      clocks.forEach((hour, i) => {
        const cx = 30 + i * (r * 2 + 20) + r;
        const cy = svgH / 2;
        const isTarget = hour === '?';

        svgContent += `
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--color-bg)" stroke="${isTarget ? 'var(--color-primary)' : 'var(--color-border)'}" stroke-width="2.5" />
                    <circle cx="${cx}" cy="${cy}" r="3" fill="var(--color-text-main)" />
                `;

        if (!isTarget) {
          const angle = ((hour % 12) * 30 - 90) * (Math.PI / 180);
          const hx = cx + Math.cos(angle) * (r * 0.55);
          const hy = cy + Math.sin(angle) * (r * 0.55);
          const mx = cx;
          const my = cy - r * 0.8;

          svgContent += `
                        <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="var(--color-text-main)" stroke-width="3" stroke-linecap="round" />
                        <line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" />
                    `;
        } else {
          svgContent += `
                        <text x="${cx}" y="${cy + 7}" fill="var(--color-primary)" font-size="24" font-weight="800" text-anchor="middle">?</text>
                    `;
        }
      });

      svgContent += `</svg>`;
      svgBox.innerHTML = svgContent;
      graphicArea.appendChild(svgBox);
    } else if (pattern.type === 'hexagon_star') {
      const nodes = pattern.data.nodes || [2, 4, 6, 8, 10, '?'];
      const promptText = pattern.data.prompt || 'Določi neznano vrednost v zvezdi.';

      const box = document.createElement('div');
      box.style.display = 'flex';
      box.style.flexDirection = 'column';
      box.style.alignItems = 'center';
      box.style.gap = '12px';
      box.style.width = '100%';

      const titleP = document.createElement('p');
      titleP.style.fontSize = '0.95rem';
      titleP.style.fontWeight = '600';
      titleP.style.textAlign = 'center';
      titleP.style.margin = '0';
      titleP.textContent = promptText;
      box.appendChild(titleP);

      const svgBox = document.createElement('div');
      svgBox.className = 'vzorci-svg-container';

      const cx = 150;
      const cy = 120;
      const rOut = 80;
      let svgContent = `<svg class="vzorci-svg" viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">`;

      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = i * (Math.PI / 3) - Math.PI / 2;
        const px = cx + Math.cos(angle) * rOut;
        const py = cy + Math.sin(angle) * rOut;
        points.push({ x: px, y: py, val: nodes[i] });
      }

      svgContent += `
                <polygon points="${points[0].x},${points[0].y} ${points[2].x},${points[2].y} ${points[4].x},${points[4].y}" fill="none" stroke="var(--color-border)" stroke-width="2.5" />
                <polygon points="${points[1].x},${points[1].y} ${points[3].x},${points[3].y} ${points[5].x},${points[5].y}" fill="none" stroke="var(--color-border)" stroke-width="2.5" />
                <circle cx="${cx}" cy="${cy}" r="22" fill="var(--color-surface)" stroke="var(--color-primary)" stroke-width="2" />
                <text x="${cx}" y="${cy + 6}" fill="var(--color-primary)" font-size="18" font-weight="800" text-anchor="middle">?</text>
            `;

      points.forEach(pt => {
        const isTarget = pt.val === '?';
        svgContent += `
                    <circle cx="${pt.x}" cy="${pt.y}" r="18" fill="var(--color-bg)" stroke="${isTarget ? 'var(--color-primary)' : 'var(--color-border)'}" stroke-width="2" />
                    <text x="${pt.x}" y="${pt.y + 6}" fill="${isTarget ? 'var(--color-primary)' : 'var(--color-text-main)'}" font-size="16" font-weight="800" text-anchor="middle">${pt.val}</text>
                `;
      });

      svgContent += `</svg>`;
      svgBox.innerHTML = svgContent;
      box.appendChild(svgBox);
      graphicArea.appendChild(box);
    } else if (pattern.type === 'pie_sectors') {
      const sectors = pattern.data.sectors || [];
      const svgBox = document.createElement('div');
      svgBox.className = 'vzorci-svg-container';

      const count = sectors.length;
      const r = 50;
      const svgW = count * (r * 2 + 20) + 20;
      const svgH = r * 2 + 40;

      let svgContent = `<svg class="vzorci-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;

      sectors.forEach((sec, i) => {
        const cx = 30 + i * (r * 2 + 20) + r;
        const cy = svgH / 2;
        const isTarget = sec.right === '?';

        svgContent += `
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--color-bg)" stroke="var(--color-border)" stroke-width="2.5" />
                    <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="var(--color-border)" stroke-width="2" />
                    <text x="${cx - r / 2}" y="${cy + 6}" fill="var(--color-text-main)" font-size="18" font-weight="800" text-anchor="middle">${sec.left}</text>
                    <text x="${cx + r / 2}" y="${cy + 6}" fill="${isTarget ? 'var(--color-primary)' : 'var(--color-text-main)'}" font-size="18" font-weight="800" text-anchor="middle">${sec.right}</text>
                `;
      });

      svgContent += `</svg>`;
      svgBox.innerHTML = svgContent;
      graphicArea.appendChild(svgBox);
    } else if (pattern.type === 'triangle_nodes') {
      const triangles = pattern.data.triangles || [];
      const svgBox = document.createElement('div');
      svgBox.className = 'vzorci-svg-container';

      let svgContent = `<svg class="vzorci-svg" viewBox="0 0 540 220" xmlns="http://www.w3.org/2000/svg">`;
      const count = triangles.length;
      const spacing = 540 / count;

      triangles.forEach((tri, i) => {
        const cx = spacing * i + spacing / 2;
        const topY = 25;
        const bottomY = 165;
        const halfW = 55;

        svgContent += `
                    <polygon points="${cx},${bottomY} ${cx - halfW},${topY} ${cx + halfW},${topY}" 
                             fill="var(--color-bg)" stroke="var(--color-primary)" stroke-width="3" stroke-linejoin="round" />
                    
                    <text x="${cx - halfW - 14}" y="${topY - 4}" fill="var(--color-text-main)" font-size="20" font-weight="700" text-anchor="middle">${tri.left}</text>
                    <text x="${cx + halfW + 14}" y="${topY - 4}" fill="var(--color-text-main)" font-size="20" font-weight="700" text-anchor="middle">${tri.right}</text>
                    <text x="${cx}" y="${bottomY + 28}" fill="${tri.bottom === '?' ? 'var(--color-primary)' : 'var(--color-text-main)'}" font-size="22" font-weight="800" text-anchor="middle">${tri.bottom}</text>
                `;
      });

      svgContent += `</svg>`;
      svgBox.innerHTML = svgContent;
      graphicArea.appendChild(svgBox);
    } else if (pattern.type === 'wheel_spokes') {
      const pairs = pattern.data.pairs || [];
      const svgBox = document.createElement('div');
      svgBox.className = 'vzorci-svg-container';

      const wCx = 160,
        wCy = 130,
        rWheel = 100,
        rLabel = 78,
        rInner = 30;
      const svgW = 320,
        svgH = 270;
      const totalSlots = pairs.length * 2;
      const slotAngle = (Math.PI * 2) / totalSlots;

      let svgContent = `<svg class="vzorci-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;

      // Zunaji krog
      svgContent += `<circle cx="${wCx}" cy="${wCy}" r="${rWheel}" fill="var(--color-bg)" stroke="var(--color-primary)" stroke-width="2.5" />`;
      // Notranji krog
      svgContent += `<circle cx="${wCx}" cy="${wCy}" r="${rInner}" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="2" />`;

      // Vse linije krakov (od centra do zunanjosti)
      for (let s = 0; s < totalSlots; s++) {
        const a = s * slotAngle - Math.PI / 2;
        const lx = wCx + Math.cos(a) * rWheel;
        const ly = wCy + Math.sin(a) * rWheel;
        svgContent += `<line x1="${wCx}" y1="${wCy}" x2="${lx}" y2="${ly}" stroke="var(--color-border)" stroke-width="1.5" />`;
      }

      // Za vsak par: top na slot i*2, bottom na slot i*2+1 (zaporedne reže, ne nasprotne)
      // Povezovalna črta med parom (barvna)
      pairs.forEach((pair, i) => {
        const aTop = i * 2 * slotAngle - Math.PI / 2;
        const aBot = (i * 2 + 1) * slotAngle - Math.PI / 2;

        const topX = wCx + Math.cos(aTop) * rLabel;
        const topY = wCy + Math.sin(aTop) * rLabel;
        const botX = wCx + Math.cos(aBot) * rLabel;
        const botY = wCy + Math.sin(aBot) * rLabel;

        // Ozadnji krog + besedilo za top
        const isTargetTop = pair.top === '?';
        svgContent += `<circle cx="${topX}" cy="${topY}" r="18" fill="var(--color-surface)" stroke="${isTargetTop ? 'var(--color-primary)' : 'var(--color-border)'}" stroke-width="2" />`;
        svgContent += `<text x="${topX}" y="${topY + 5}" fill="${isTargetTop ? 'var(--color-primary)' : 'var(--color-text-main)'}" font-size="16" font-weight="800" text-anchor="middle">${pair.top}</text>`;

        // Ozadnji krog + besedilo za bottom
        const isTargetBot = pair.bottom === '?';
        svgContent += `<circle cx="${botX}" cy="${botY}" r="18" fill="var(--color-surface)" stroke="${isTargetBot ? 'var(--color-primary)' : 'var(--color-border)'}" stroke-width="2" />`;
        svgContent += `<text x="${botX}" y="${botY + 5}" fill="${isTargetBot ? 'var(--color-primary)' : 'var(--color-text-main)'}" font-size="16" font-weight="800" text-anchor="middle">${pair.bottom}</text>`;
      });

      svgContent += `</svg>`;
      svgBox.innerHTML = svgContent;
      graphicArea.appendChild(svgBox);
    } else if (pattern.type === 'spatial_counting') {
      const size = pattern.data.gridSize || 2;
      const promptText = pattern.data.prompt || 'Koliko kvadratov vsebuje ta mreža?';

      const box = document.createElement('div');
      box.style.display = 'flex';
      box.style.flexDirection = 'column';
      box.style.alignItems = 'center';
      box.style.gap = '14px';

      const titleP = document.createElement('p');
      titleP.style.fontSize = '1.05rem';
      titleP.style.fontWeight = '600';
      titleP.style.textAlign = 'center';
      titleP.style.margin = '0';
      titleP.textContent = promptText;
      box.appendChild(titleP);

      if (size > 0) {
        const svgBox = document.createElement('div');
        svgBox.className = 'vzorci-svg-container';
        const cellW = 160 / size;
        let svgContent = `<svg class="vzorci-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">`;
        svgContent += `<rect x="20" y="20" width="160" height="160" fill="var(--color-bg)" stroke="var(--color-primary)" stroke-width="3" rx="6" />`;

        for (let r = 1; r < size; r++) {
          const pos = 20 + r * cellW;
          svgContent += `<line x1="20" y1="${pos}" x2="180" y2="${pos}" stroke="var(--color-border)" stroke-width="2" />`;
          svgContent += `<line x1="${pos}" y1="20" x2="${pos}" y2="180" stroke="var(--color-border)" stroke-width="2" />`;
        }

        svgContent += `</svg>`;
        svgBox.innerHTML = svgContent;
        box.appendChild(svgBox);
      }

      graphicArea.appendChild(box);
    } else if (pattern.type === 'matrix_grid') {
      const rows = pattern.data.rows || [];
      const box = document.createElement('div');
      box.className = 'vzorci-algebra-box';
      box.style.maxWidth = '320px';

      rows.forEach(r => {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = 'space-around';
        rowDiv.style.width = '100%';

        r.forEach(val => {
          const span = document.createElement('span');
          span.style.color = val === '?' ? 'var(--color-primary)' : 'var(--color-text-main)';
          span.style.fontWeight = val === '?' ? '800' : '700';
          span.textContent = val;
          rowDiv.appendChild(span);
        });
        box.appendChild(rowDiv);
      });
      graphicArea.appendChild(box);
    }
  }

  function updateDisplay() {
    if (!displayVal || !displayPlaceholder) return;
    const cursor = document.getElementById('vzorci-cursor');
    if (userInput.length > 0) {
      displayVal.textContent = userInput;
      displayPlaceholder.style.display = 'none';
      if (cursor) cursor.style.display = 'inline-block';
    } else {
      displayVal.textContent = '';
      // Show placeholder only when display-box is not focused
      const isFocused = displayBox && displayBox === document.activeElement;
      displayPlaceholder.style.display = isFocused ? 'none' : 'inline';
      if (cursor) cursor.style.display = isFocused ? 'inline-block' : 'none';
    }
  }

  function handleNumpadKey(key) {
    if (isTransitioning) return;
    sounds.play('click');
    if (key >= '0' && key <= '9') {
      if (userInput.length < 8) {
        userInput += key;
      }
    } else if (key === 'backspace') {
      userInput = userInput.slice(0, -1);
    } else if (key === 'clear') {
      userInput = '';
    }
    updateDisplay();
  }

  function verifyAnswer() {
    if (isTransitioning || !patternsData || patternsData.length === 0) return;
    // Block submission when input is empty (prevents double-Enter skipping)
    if (userInput.trim().length === 0) return;
    const pattern = patternsData[currentLevelIndex];
    const normalizedUser = String(userInput).trim().toLowerCase();

    const isCorrect =
      pattern.answer === normalizedUser ||
      (pattern.answers &&
        pattern.answers.some(a => String(a).trim().toLowerCase() === normalizedUser));

    if (isCorrect) {
      isTransitioning = true;
      sounds.play('correct');
      solvedCount++;
      totalXpEarned += 30;
      statsManager.addXp(30);
      markLevelSolved(pattern.id);
      showToast('Pravilno! Odlično prepoznavanje vzorca! (+30 XP) 🎉', { type: 'success' });
      showConfetti({ count: 24 });
      showExplanation();

      if (transitionTimer) clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        transitionTimer = null;
        if (currentLevelIndex < patternsData.length - 1) {
          renderLevel(currentLevelIndex + 1);
          // Keep isTransitioning true briefly after rendering the new level
          // to absorb any lingering Enter key events
          isTransitioning = true;
          setTimeout(() => {
            isTransitioning = false;
          }, 300);
        } else {
          finishSet();
        }
      }, 1800);
    } else {
      sounds.play('error');
      if (displayBox) {
        displayBox.style.borderColor = '#ef4444';
        setTimeout(() => {
          displayBox.style.borderColor = '';
        }, 1000);
      }
      showToast('Napačen odgovor. Poskusi znova ali uporabi namig 💡', { type: 'error' });
    }
  }

  function renderHints() {
    const pattern = patternsData[currentLevelIndex];
    if (!pattern || !pattern.hints) return;

    const revealed = pattern.hints.slice(0, currentHintIndex);
    if (revealed.length === 0) {
      hintArea.classList.add('hidden');
      return;
    }

    const badges = ['1. Smernica 🔍', '2. Usmeritev 💡', '3. Ključni podatek 🎯'];
    hintArea.innerHTML = revealed
      .map(
        (h, idx) => `
            <div style="margin-bottom: 8px; border-bottom: 1px dashed rgba(180, 83, 9, 0.2); padding-bottom: 6px;">
                <span style="font-size: 0.75rem; font-weight:700; color:#92400e;">${badges[idx]}</span>
                <div style="color: #78350f; font-size:0.92rem; margin-top:2px;">${escapeHtml(h)}</div>
            </div>
        `
      )
      .join('');
    hintArea.classList.remove('hidden');
  }

  function updateHintButton() {
    const pattern = patternsData[currentLevelIndex];
    if (!pattern || !pattern.hints || !hintBtn) return;

    if (currentHintIndex === 0) {
      hintBtn.disabled = false;
      hintBtn.textContent = '💡 1. Namig (Smernica)';
      hintBtn.style.borderColor = '';
      hintBtn.style.color = '';
      hintBtn.style.background = '';
    } else if (currentHintIndex === 1) {
      hintBtn.disabled = false;
      hintBtn.textContent = '💡 2. Namig (Usmeritev)';
      hintBtn.style.borderColor = '';
      hintBtn.style.color = '';
      hintBtn.style.background = '';
    } else if (currentHintIndex === 2 && explanationArea.classList.contains('hidden')) {
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
    const pattern = patternsData[currentLevelIndex];
    if (!pattern || !pattern.hints) return;
    sounds.play('click');

    if (currentHintIndex < 2) {
      currentHintIndex++;
      renderHints();
      updateHintButton();
    } else if (currentHintIndex === 2) {
      currentHintIndex = 3;
      renderHints();
      showExplanation();
      updateHintButton();
    } else {
      showToast('Rešitev in vsi namigi so že prikazani!', { type: 'info' });
    }
  }

  function showExplanation() {
    const pattern = patternsData[currentLevelIndex];
    if (!pattern || !explanationArea) return;
    explanationArea.innerHTML = `<strong>Razlaga vzorca:</strong> ${escapeHtml(pattern.explanation)}`;
    explanationArea.classList.remove('hidden');
  }

  function renderLevelsGrid() {
    if (!gridView || !patternsData) return;
    gridView.innerHTML = '';
    const savedProgress = getSavedProgress();
    const solvedIds = savedProgress.solvedIds || [];

    patternsData.forEach((pat, idx) => {
      const isSolved = solvedIds.includes(pat.id);
      const isCurrent = idx === currentLevelIndex;

      const card = document.createElement('div');
      card.className = `vzorci-level-card ${isSolved ? 'solved' : ''} ${isCurrent ? 'active' : ''}`;
      card.textContent = pat.level;
      card.addEventListener('click', () => {
        gridView.classList.add('hidden');
        renderLevel(idx);
      });
      gridView.appendChild(card);
    });
  }

  function finishSet() {
    statsManager.saveSession('vzorci', solvedCount, { solved: solvedCount, xp: totalXpEarned });
    const finalCountEl = document.getElementById('vzorci-final-count');
    const finalXpEl = document.getElementById('vzorci-final-xp');
    if (finalCountEl) finalCountEl.textContent = `${solvedCount}/${patternsData.length}`;
    if (finalXpEl) finalXpEl.textContent = `${totalXpEarned}`;
    showLayer(endScreen);
  }

  // Tipkovnični vnos (Keyboard listeners)
  function handleKeyDown(e) {
    if (playScreen.classList.contains('hidden')) return;

    if (e.key >= '0' && e.key <= '9') {
      handleNumpadKey(e.key);
    } else if (e.key === 'Backspace') {
      handleNumpadKey('backspace');
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      handleNumpadKey('clear');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      verifyAnswer();
    }
  }

  // Inicializacija dogodkov
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      await loadPatterns();
      showLayer(playScreen);
      let targetIdx = 0;
      if (initialSubParam) {
        const parsed = parseInt(initialSubParam, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= patternsData.length) {
          targetIdx = parsed - 1;
        }
      }
      renderLevel(targetIdx);
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      showLayer(playScreen);
      renderLevel(0);
    });
    document.getElementById('vzorci-back-to-list')?.addEventListener('click', () => {
      window.location.hash = '#game-list';
    });
  }

  if (prevLvlBtn) {
    prevLvlBtn.addEventListener('click', () => {
      if (currentLevelIndex > 0) renderLevel(currentLevelIndex - 1);
    });
  }

  if (nextLvlBtn) {
    nextLvlBtn.addEventListener('click', () => {
      if (currentLevelIndex < patternsData.length - 1) renderLevel(currentLevelIndex + 1);
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => verifyAnswer());
  }

  if (hintBtn) {
    hintBtn.addEventListener('click', () => handleHint());
  }

  if (gridToggleBtn) {
    gridToggleBtn.addEventListener('click', () => {
      if (gridView) gridView.classList.toggle('hidden');
    });
  }

  // Generate new procedural level button
  const generateBtn = document.getElementById('vzorci-generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      // Generiraj nov naklučen proceduralni nivo
      const proceduralTypes = ['pyramid_bricks', 'system_algebra', 'wheel_spokes', 'domino_tiles'];
      const type = proceduralTypes[Math.floor(Math.random() * proceduralTypes.length)];
      const newSeed = Date.now() + Math.floor(Math.random() * 1000000);
      const newPattern = generatePattern(type, newSeed);

      newPattern.id = `proc-${type}-${Date.now()}`;
      newPattern.level = patternsData.length + 1;
      newPattern.category = type;
      newPattern.title = `${type === 'pyramid_bricks' ? 'Piramida' : type === 'system_algebra' ? 'Algebra' : type === 'wheel_spokes' ? 'Kolo' : 'Domino'} (nov)`;
      newPattern.procedural = true;

      patternsData.push(newPattern);
      renderLevel(patternsData.length - 1);
      showToast(
        `🎲 Nov ${type === 'pyramid_bricks' ? 'piramida' : type === 'system_algebra' ? 'algebra' : type === 'wheel_spokes' ? 'kolo' : 'domino'} generiran!`,
        { type: 'info' }
      );
    });
  }

  // Numpad gumbi Event Delegation
  const numpadGrid = document.querySelector('.vzorci-numpad-grid');
  if (numpadGrid) {
    numpadGrid.addEventListener('click', e => {
      const btn = e.target.closest('.vzorci-num-btn');
      if (btn && btn.dataset.key) {
        handleNumpadKey(btn.dataset.key);
      }
    });
  }

  // Focus/blur za display-box (boljši UX s kurzorjem)
  let observer = null;
  if (displayBox) {
    displayBox.addEventListener('focus', () => {
      displayBox.classList.add('active');
      updateDisplay();
    });
    displayBox.addEventListener('blur', () => {
      displayBox.classList.remove('active');
      updateDisplay();
    });
    // Auto-focus display-box ko se prikaže play screen
    observer = new MutationObserver(() => {
      if (!playScreen.classList.contains('hidden')) {
        displayBox.focus();
      }
    });
    observer.observe(playScreen, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('keydown', handleKeyDown);

  // Samodejni zagon če je URL subParam
  if (initialSubParam) {
    loadPatterns().then(() => {
      showLayer(playScreen);
      const parsed = parseInt(initialSubParam, 10);
      const targetIdx =
        !isNaN(parsed) && parsed >= 1 && parsed <= patternsData.length ? parsed - 1 : 0;
      renderLevel(targetIdx);
    });
  }

  // Cleanup funkcija ob zamenjavi strani
  return function cleanup() {
    document.removeEventListener('keydown', handleKeyDown);
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };
}
