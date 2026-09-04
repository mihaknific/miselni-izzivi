// js/games/uganke.js — Kognitivne Uganke & Izzivi (ES6 modul)
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { escapeHtml } from '../ui.js';

let puzzlesData = [];

export function renderUganke() {
  const settingsHtml = `
        <div class="settings-row">
            <label class="form-label">Začetni način igre
                <select id="uganke-setting-mode" class="form-select">
                    <option value="kategorije" selected>Raziskovalnik po 5 kategorijah</option>
                    <option value="dnevni">Dnevni izziv ugank (5 nalog)</option>
                    <option value="kampanja">Kampanja napredovanja (stopnje)</option>
                </select>
            </label>
        </div>
    `;

  const stageHtml = `
        <div class="game-stage">
            <div id="uganke-start-screen" class="stage-layer">
                ${renderStartCard(
                  'Rešuj uganke iz 5 glavnih kognitivnih kategorij (logika, fizikalni vzroki, besedna izraznost, detektivske šifre in verjetnost).',
                  'uganke-start-btn',
                  '▶ Začni z ugankami',
                  'Ugankarski Kognitivni Izziv'
                )}
            </div>

            <div id="uganke-play-screen" class="stage-layer hidden">
                <div class="uganke-container">
                    <div class="uganke-mode-nav">
                        <button id="uganke-tab-cat" class="uganke-mode-btn active">Kategorije ugank</button>
                        <button id="uganke-tab-daily" class="uganke-mode-btn">Dnevni izziv</button>
                    </div>

                    <div id="uganke-cat-view" class="uganke-categories-grid"></div>
                    <div id="uganke-subcat-view" class="uganke-subcat-container hidden"></div>

                    <div id="uganke-puzzle-view" class="uganke-puzzle-card hidden">
                        <div class="uganke-header-bar">
                            <span id="uganke-tag" class="uganke-tag-pill">Logika</span>
                            <h3 id="uganke-title" class="uganke-title-text">Naslov uganke</h3>
                        </div>

                        <div id="uganke-prompt" class="uganke-prompt-box">Besedilo uganke...</div>

                        <div id="uganke-input-area"></div>

                        <div id="uganke-hint-area" class="uganke-hint-box hidden"></div>
                        <div id="uganke-explanation-area" class="uganke-explanation-box hidden"></div>

                        <div class="uganke-action-bar">
                            <button id="uganke-hint-btn" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.85rem;">💡 Namig (0/3)</button>
                            <button id="uganke-back-btn" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.85rem;">← Seznam</button>
                            <button id="uganke-next-btn" class="btn hidden" style="padding:0.4rem 0.8rem; font-size:0.85rem;">Naslednja uganka ➔</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="uganke-end-screen" class="stage-layer hidden">
                <div class="rc-victory-content" style="text-align: center; max-width: 380px; width: 90%; background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 class="result-title result-success" style="font-size: 1.25rem; margin-bottom: var(--spacing-xs); color: var(--color-success);">Sklop ugank zaključen! 🧠</h3>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-xs);">Rešenih ugank: <strong id="uganke-final-count">0/0</strong></p>
                    <p class="muted-xs" style="margin-bottom: var(--spacing-sm);">Pridobljene XP točke: <strong id="uganke-final-xp">0</strong> XP</p>
                    <button id="uganke-retry-btn" class="btn">Nazaj na uganke</button>
                    <button id="uganke-back-to-list" class="btn btn-outline" style="margin-left: 8px;">← Seznam iger</button>
                </div>
            </div>
        </div>
    `;

  const infoHtml = `
        <h4 style="margin-bottom: 8px;">O kognitivnem ugankarskem izzivu</h4>
        <p style="margin-bottom: 12px;">Ta modul združuje <strong>13 specifičnih kognitivnih podtipov ugank</strong> v 5 glavnih kategorijah:</p>
        <ul style="margin-bottom: 12px; padding-left: 20px; line-height: 1.6;">
            <li><strong>1. Logika & Analitika:</strong> Deduktivne mrežne uganke, prostorsko zlaganje kock in sistemska pravila.</li>
            <li><strong>2. Vzrok & Posledica:</strong> Fizikalni navori na vzvodu, zaporedna mehanična stikala in merjenje časa.</li>
            <li><strong>3. Izraznost & Perspektiva:</strong> Klasični anagrami, lateralno razbijanje predpostavk in 3D optične sence.</li>
            <li><strong>4. Informacije & Raziskovanje:</strong> Detektivska analiza protislovnih izjav in Cezarjevo šifriranje.</li>
            <li><strong>5. Intuicija & Poskušanje:</strong> Številčni Mastermind, nelinearni labirinti in Monty Hall verjetnost.</li>
        </ul>
        <h4 style="margin-bottom: 8px;">Sistem namigov:</h4>
        <p>Vsaka uganka ponuja 3-stopenjske namige (smernica → usmeritev → ključni podatek), s čimer si lahko pomagate ob zatikanju.</p>
    `;

  return renderGameShell({
    title: 'Ugankarski Izziv',
    subtitle: 'Kognitivni laboratorij 13 podtipov ugank.',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initUganke(initialSubParam = null) {
  let activeMode = 'kategorije';
  let currentPuzzle = null;
  let currentHintIndex = 0;
  let currentPuzzleIndex = 0;
  let currentCategoryObj = null;
  let puzzleList = [];
  let solvedCount = 0;
  let totalXpEarned = 0;

  const startScreen = document.getElementById('uganke-start-screen');
  const playScreen = document.getElementById('uganke-play-screen');
  const endScreen = document.getElementById('uganke-end-screen');

  const startBtn = document.getElementById('uganke-start-btn');
  const retryBtn = document.getElementById('uganke-retry-btn');
  const tabCatBtn = document.getElementById('uganke-tab-cat');
  const tabDailyBtn = document.getElementById('uganke-tab-daily');

  const catView = document.getElementById('uganke-cat-view');
  const subcatView = document.getElementById('uganke-subcat-view');
  const puzzleView = document.getElementById('uganke-puzzle-view');
  const modeNav = document.querySelector('.uganke-mode-nav');

  const tagEl = document.getElementById('uganke-tag');
  const titleEl = document.getElementById('uganke-title');
  const promptEl = document.getElementById('uganke-prompt');
  const inputArea = document.getElementById('uganke-input-area');

  const hintArea = document.getElementById('uganke-hint-area');
  const explanationArea = document.getElementById('uganke-explanation-area');
  const hintBtn = document.getElementById('uganke-hint-btn');
  const backBtn = document.getElementById('uganke-back-btn');

  const nextBtn = document.getElementById('uganke-next-btn');

  const categoriesList = [
    { id: 'logika', title: 'Logika in analitika', badge: 'Logika' },
    { id: 'sistemi', title: 'Vzrok in posledica', badge: 'Fizika' },
    { id: 'izraznost', title: 'Izraznost in perspektiva', badge: 'Perspektiva' },
    { id: 'raziskovanje', title: 'Informacije in raziskovanje', badge: 'Detektiv' },
    { id: 'intuicija', title: 'Intuicija in poskušanje', badge: 'Mastermind' },
  ];

  function updateUrlHash(subParam) {
    const newHash = subParam ? `#game/uganke/${subParam}` : '#game/uganke';
    if (window.location.hash !== newHash) {
      history.pushState({ target: 'game', params: 'uganke', subParam }, '', newHash);
    }
  }

  function getSavedProgress() {
    try {
      const data = localStorage.getItem('uganke_saved_progress');
      return data ? JSON.parse(data) : { solvedIds: [], lastCategory: null };
    } catch (e) {
      return { solvedIds: [], lastCategory: null };
    }
  }

  function markPuzzleSolved(puzzleId, categoryId) {
    const progress = getSavedProgress();
    if (!progress.solvedIds.includes(puzzleId)) {
      progress.solvedIds.push(puzzleId);
    }
    progress.lastCategory = categoryId;
    try {
      localStorage.setItem('uganke_saved_progress', JSON.stringify(progress));
    } catch (e) {
      console.error('Napaka pri shranjevanju uganke_saved_progress', e);
    }
  }

  async function loadPuzzles() {
    if (puzzlesData.length > 0) return;
    try {
      const res = await fetch('./data/puzzles.json');
      if (res.ok) {
        puzzlesData = await res.json();
      }
    } catch (e) {
      console.error('Napaka pri nalaganju puzzles.json', e);
    }
  }

  function showLayer(layer) {
    [startScreen, playScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (layer) layer.classList.remove('hidden');
  }

  function renderCategories(skipUrlUpdate = false) {
    if (!catView) return;
    if (!skipUrlUpdate) updateUrlHash(null);
    catView.innerHTML = '';
    puzzleView.classList.add('hidden');
    if (subcatView) subcatView.classList.add('hidden');
    if (modeNav) modeNav.classList.remove('hidden');
    catView.classList.remove('hidden');

    const savedProgress = getSavedProgress();
    const solvedIds = savedProgress.solvedIds || [];

    categoriesList.forEach(cat => {
      const catPuzzles = puzzlesData.filter(p => p.category === cat.id);
      const totalInCat = catPuzzles.length;
      const solvedInCat = catPuzzles.filter(p => solvedIds.includes(p.id)).length;
      const percent = totalInCat > 0 ? Math.round((solvedInCat / totalInCat) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'uganke-cat-card';
      card.innerHTML = `
                <div class="flex-between">
                    <span class="uganke-cat-badge">${cat.badge}</span>
                    <span class="text-xs ${percent === 100 ? 'text-success' : 'text-muted'}" style="font-weight:700;">
                        ${solvedInCat} / ${totalInCat}
                    </span>
                </div>
                <h4 class="uganke-cat-title">${escapeHtml(cat.title)}</h4>
                <div class="uganke-progress-bar-bg mt-xs">
                    <div class="uganke-progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
            `;
      card.addEventListener('click', () => {
        currentCategoryObj = cat;
        renderCategorySublist(cat);
      });
      catView.appendChild(card);
    });
  }

  function renderCategorySublist(cat, skipUrlUpdate = false) {
    if (!subcatView) return;
    currentCategoryObj = cat;
    if (!skipUrlUpdate) updateUrlHash(cat.id);
    catView.classList.add('hidden');
    puzzleView.classList.add('hidden');
    if (modeNav) modeNav.classList.add('hidden');
    subcatView.classList.remove('hidden');
    subcatView.innerHTML = '';

    const savedProgress = getSavedProgress();
    const solvedIds = savedProgress.solvedIds || [];
    puzzleList = puzzlesData.filter(p => p.category === cat.id);

    const totalInCat = puzzleList.length;
    const solvedInCat = puzzleList.filter(p => solvedIds.includes(p.id)).length;
    const percent = totalInCat > 0 ? Math.round((solvedInCat / totalInCat) * 100) : 0;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'uganke-subcat-header';
    headerDiv.innerHTML = `
            <div class="flex-between flex-wrap gap-sm">
                <div>
                    <h3 class="uganke-title-text" style="margin:0 0 4px 0;">${escapeHtml(cat.title)}</h3>
                    <p class="muted-xs" style="margin:0;">Rešeno: <strong>${solvedInCat} od ${totalInCat} ugank</strong> (${percent}%)</p>
                </div>
                <button id="subcat-back-grid-btn" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.85rem;">← Nazaj</button>
            </div>
            <div class="uganke-progress-bar-bg mt-sm">
                <div class="uganke-progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
        `;
    subcatView.appendChild(headerDiv);

    headerDiv.querySelector('#subcat-back-grid-btn').addEventListener('click', () => {
      currentCategoryObj = null;
      renderCategories();
    });

    const firstUnsolvedIdx = puzzleList.findIndex(p => !solvedIds.includes(p.id));
    const continueIdx = firstUnsolvedIdx !== -1 ? firstUnsolvedIdx : 0;

    const continueBtnDiv = document.createElement('div');
    continueBtnDiv.className = 'mt-xs mb-sm';
    continueBtnDiv.innerHTML = `
            <button id="subcat-continue-btn" class="btn" style="width:100%; justify-content:center; padding:0.65rem 1rem;">
                ▶ ${firstUnsolvedIdx !== -1 ? 'Nadaljuj z igro' : 'Ponovno rešuj prve uganke'}
            </button>
        `;
    subcatView.appendChild(continueBtnDiv);

    continueBtnDiv.querySelector('#subcat-continue-btn').addEventListener('click', () => {
      currentPuzzleIndex = continueIdx;
      loadPuzzle(puzzleList[continueIdx]);
    });

    const listGrid = document.createElement('div');
    listGrid.className = 'uganke-puzzle-select-list';

    puzzleList.forEach((puz, idx) => {
      const isSolved = solvedIds.includes(puz.id);
      const puzCard = document.createElement('div');
      puzCard.className = `uganke-puzzle-row-card ${isSolved ? 'solved' : ''}`;
      puzCard.innerHTML = `
                <div class="uganke-puz-idx-circle ${isSolved ? 'solved' : ''}">${idx + 1}</div>
                <div class="uganke-puz-row-info">
                    <h5 class="uganke-puz-row-title">${escapeHtml(puz.title)}</h5>
                    <span class="uganke-puz-row-sub">${escapeHtml(puz.subtypeTitle)}</span>
                </div>
                <span class="uganke-puz-status-pill ${isSolved ? 'solved' : ''}">
                    ${isSolved ? 'Rešeno' : 'Igraj'}
                </span>
            `;
      puzCard.addEventListener('click', () => {
        currentPuzzleIndex = idx;
        loadPuzzle(puz);
      });
      listGrid.appendChild(puzCard);
    });

    subcatView.appendChild(listGrid);
  }

  function normalizeText(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[čć]/g, 'c')
      .replace(/š/g, 's')
      .replace(/ž/g, 'z')
      .replace(/\s+/g, '');
  }

  function loadPuzzle(puzzle, skipUrlUpdate = false) {
    currentPuzzle = puzzle;
    currentHintIndex = 0;
    if (!skipUrlUpdate) updateUrlHash(puzzle.id);

    catView.classList.add('hidden');
    if (subcatView) subcatView.classList.add('hidden');
    if (modeNav) modeNav.classList.add('hidden');
    puzzleView.classList.remove('hidden');

    tagEl.textContent = `${puzzle.categoryTitle} • ${puzzle.subtypeTitle} (${currentPuzzleIndex + 1}/${puzzleList.length})`;
    titleEl.textContent = puzzle.title;
    promptEl.textContent = puzzle.prompt;

    hintArea.classList.add('hidden');
    hintArea.innerHTML = '';
    explanationArea.classList.add('hidden');
    explanationArea.innerHTML = '';

    if (hintBtn) {
      updateHintButton();
    }

    if (nextBtn) {
      nextBtn.classList.add('hidden');
      const isLast = currentPuzzleIndex === puzzleList.length - 1;
      nextBtn.textContent = isLast ? 'Zaključi sklop 🏁' : 'Naslednja uganka ➔';
      if (isLast) {
        nextBtn.classList.add('btn-primary');
      } else {
        nextBtn.classList.remove('btn-primary');
      }
    }

    renderInputArea(puzzle);
  }

  function renderInputArea(puzzle) {
    inputArea.innerHTML = '';

    if (puzzle.type === 'multiple_choice') {
      const list = document.createElement('div');
      list.className = 'uganke-options-list';
      puzzle.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'uganke-option-btn';
        btn.dataset.option = opt;
        btn.textContent = `${idx + 1}. ${opt}`;
        btn.addEventListener('click', () => verifyChoice(opt, btn, list));
        list.appendChild(btn);
      });
      inputArea.appendChild(list);
    } else {
      const form = document.createElement('form');
      form.className = 'uganke-input-form';
      form.innerHTML = `
                <input id="uganke-text-input" type="text" class="form-input" placeholder="Vnesi svoj odgovor..." autocomplete="off">
                <button type="submit" class="btn">Potrdi</button>
            `;
      form.addEventListener('submit', e => {
        e.preventDefault();
        const inputEl = document.getElementById('uganke-text-input');
        if (inputEl) verifyTextInput(inputEl.value, form);
      });
      inputArea.appendChild(form);
      setTimeout(() => {
        const inputEl = document.getElementById('uganke-text-input');
        if (inputEl) inputEl.focus();
      }, 100);
    }
  }

  function verifyChoice(selectedOpt, btn, container) {
    const buttons = container.querySelectorAll('.uganke-option-btn');

    if (selectedOpt === currentPuzzle.answer) {
      buttons.forEach(b => (b.disabled = true));
      btn.classList.add('correct');
      sounds.play('correct');
      solvedCount++;
      totalXpEarned += 20;
      statsManager.addXp(20);
      markPuzzleSolved(currentPuzzle.id, currentPuzzle.category);
      showToast('Pravilno! (+20 XP) 🎉', { type: 'success' });
      showConfetti({ count: 20 });
      showExplanation();
      if (nextBtn) nextBtn.classList.remove('hidden');
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      sounds.play('error');

      if (explanationArea) {
        explanationArea.innerHTML = `
                    <div style="color: #991b1b; font-weight: 600; background: #fee2e2; border: 1px solid #fca5a5; padding: 0.65rem 0.9rem; border-radius: var(--border-radius);">
                        ❌ Napačen odgovor! Razmisli znova in izberi med preostalimi možnostmi ali uporabi namig 💡.
                    </div>
                `;
        explanationArea.classList.remove('hidden');
      }
      showToast('Napačno. Razmisli in poskusi znova!', { type: 'error' });
    }
  }

  function verifyTextInput(val, form) {
    const normalizedInput = normalizeText(val);
    const isCorrect = currentPuzzle.answers.some(ans => normalizeText(ans) === normalizedInput);
    const submitBtn = form.querySelector('button[type="submit"]');
    const inputEl = form.querySelector('input');

    if (isCorrect) {
      if (submitBtn) submitBtn.disabled = true;
      if (inputEl) {
        inputEl.disabled = true;
        inputEl.style.borderColor = '#10b981';
        inputEl.style.backgroundColor = '#dcfce7';
        inputEl.style.color = '#065f46';
      }
      sounds.play('correct');
      solvedCount++;
      totalXpEarned += 25;
      statsManager.addXp(25);
      markPuzzleSolved(currentPuzzle.id, currentPuzzle.category);
      showToast('Pravilno! Odlično razmišljanje! (+25 XP) 🎉', { type: 'success' });
      showConfetti({ count: 22 });
      showExplanation();
      if (nextBtn) nextBtn.classList.remove('hidden');
    } else {
      sounds.play('error');
      if (inputEl) {
        inputEl.style.borderColor = '#ef4444';
        inputEl.focus();
        inputEl.select();
        setTimeout(() => {
          inputEl.style.borderColor = '';
        }, 1200);
      }
      if (explanationArea) {
        explanationArea.innerHTML = `
                    <div style="color: #991b1b; font-weight: 600; background: #fee2e2; border: 1px solid #fca5a5; padding: 0.65rem 0.9rem; border-radius: var(--border-radius);">
                        ❌ Napačen odgovor! Preveri svoj vnos ali uporabi namig 💡.
                    </div>
                `;
        explanationArea.classList.remove('hidden');
      }
      showToast('Napačen odgovor. Poskusi znova ali uporabi namig.', { type: 'error' });
    }
  }

  function showExplanation() {
    if (!currentPuzzle || !explanationArea) return;
    explanationArea.innerHTML = `<strong>Razlaga rešitve:</strong> ${escapeHtml(currentPuzzle.explanation)}`;
    explanationArea.classList.remove('hidden');
  }

  function renderHints() {
    if (!currentPuzzle || !currentPuzzle.hints) return;
    const revealed = currentPuzzle.hints.slice(0, currentHintIndex);
    if (revealed.length === 0) {
      hintArea.classList.add('hidden');
      return;
    }

    const badges = ['1. Smernica 🔍', '2. Usmeritev 💡', '3. Ključni podatek 🎯'];
    hintArea.innerHTML = revealed
      .map(
        (h, idx) => `
            <div class="uganke-hint-item">
                <span class="uganke-hint-badge">${badges[idx] || idx + 1 + '. Namig'}</span>
                <div class="uganke-hint-text">${escapeHtml(h)}</div>
            </div>
        `
      )
      .join('');
    hintArea.classList.remove('hidden');
  }

  function updateHintButton() {
    if (!currentPuzzle || !currentPuzzle.hints || !hintBtn) return;
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
    if (!currentPuzzle || !currentPuzzle.hints) return;
    sounds.play('click');

    if (currentHintIndex < 2) {
      currentHintIndex++;
      renderHints();
      updateHintButton();
    } else if (currentHintIndex === 2) {
      currentHintIndex = 3;
      renderHints();
      showExplanation();
      if (nextBtn) nextBtn.classList.remove('hidden');
      updateHintButton();
    } else if (explanationArea.classList.contains('hidden')) {
      showExplanation();
      if (nextBtn) nextBtn.classList.remove('hidden');
      updateHintButton();
    } else {
      showToast('Rešitev in vsi namigi so že prikazani!', { type: 'info' });
    }
  }

  function handleNextPuzzle() {
    if (currentPuzzleIndex < puzzleList.length - 1) {
      currentPuzzleIndex++;
      loadPuzzle(puzzleList[currentPuzzleIndex]);
    } else {
      finishSet();
    }
  }

  function finishSet() {
    statsManager.saveSession('uganke', solvedCount, { solved: solvedCount, xp: totalXpEarned });
    const finalCountEl = document.getElementById('uganke-final-count');
    const finalXpEl = document.getElementById('uganke-final-xp');
    if (finalCountEl) finalCountEl.textContent = `${solvedCount}/${puzzleList.length}`;
    if (finalXpEl) finalXpEl.textContent = totalXpEarned;
    showLayer(endScreen);
  }

  async function startNewGame() {
    await loadPuzzles();
    solvedCount = 0;
    totalXpEarned = 0;
    showLayer(playScreen);
    renderCategories();
  }

  const onBackClick = () => {
    if (currentCategoryObj) {
      renderCategorySublist(currentCategoryObj);
    } else {
      renderCategories();
    }
  };

  const onCatClick = () => {
    tabCatBtn?.classList.add('active');
    tabDailyBtn?.classList.remove('active');
    currentCategoryObj = null;
    renderCategories();
  };

  const onDailyClick = () => {
    tabDailyBtn?.classList.add('active');
    tabCatBtn?.classList.remove('active');
    currentCategoryObj = null;
    puzzleList = [...puzzlesData].sort(() => 0.5 - Math.random()).slice(0, 5);
    if (puzzleList.length > 0) {
      currentPuzzleIndex = 0;
      loadPuzzle(puzzleList[0]);
    }
  };

  tabCatBtn?.addEventListener('click', onCatClick);
  tabDailyBtn?.addEventListener('click', onDailyClick);
  hintBtn?.addEventListener('click', handleHint);
  backBtn?.addEventListener('click', onBackClick);
  nextBtn?.addEventListener('click', handleNextPuzzle);
  startBtn?.addEventListener('click', startNewGame);
  retryBtn?.addEventListener('click', startNewGame);
  document.getElementById('uganke-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  window.customGameBackHandler = () => {
    if (puzzleView && !puzzleView.classList.contains('hidden')) {
      onBackClick();
      return true;
    }
    if (subcatView && !subcatView.classList.contains('hidden')) {
      currentCategoryObj = null;
      renderCategories();
      return true;
    }
    return false;
  };

  const onKeyDown = e => {
    if (e.key === 'Enter') {
      if (nextBtn && !nextBtn.classList.contains('hidden') && nextBtn.offsetParent !== null) {
        e.preventDefault();
        handleNextPuzzle();
      } else if (endScreen && !endScreen.classList.contains('hidden')) {
        e.preventDefault();
        startNewGame();
      }
    }
  };
  document.addEventListener('keydown', onKeyDown);

  // Initial SubParam auto-routing (Deep-linking)
  (async () => {
    await loadPuzzles();
    if (initialSubParam) {
      showLayer(playScreen);
      const foundPuzzle = puzzlesData.find(
        p => p.id === initialSubParam || p.title === initialSubParam
      );
      if (foundPuzzle) {
        const foundCat =
          categoriesList.find(c => c.id === foundPuzzle.category) || categoriesList[0];
        currentCategoryObj = foundCat;
        puzzleList = puzzlesData.filter(p => p.category === foundCat.id);
        const foundIdx = puzzleList.findIndex(p => p.id === foundPuzzle.id);
        currentPuzzleIndex = foundIdx !== -1 ? foundIdx : 0;
        loadPuzzle(foundPuzzle, true);
        return;
      }

      const foundCat = categoriesList.find(c => c.id === initialSubParam);
      if (foundCat) {
        renderCategorySublist(foundCat, true);
        return;
      }
    }
  })();

  return () => {
    window.customGameBackHandler = null;
    document.removeEventListener('keydown', onKeyDown);
    tabCatBtn?.removeEventListener('click', onCatClick);
    tabDailyBtn?.removeEventListener('click', onDailyClick);
    hintBtn?.removeEventListener('click', handleHint);
    backBtn?.removeEventListener('click', onBackClick);
    nextBtn?.removeEventListener('click', handleNextPuzzle);
    startBtn?.removeEventListener('click', startNewGame);
    retryBtn?.removeEventListener('click', startNewGame);
  };
}
