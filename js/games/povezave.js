// js/games/povezave.js — Povezave (Connections) – slovenska različica
// Legal: mehanika razvrščanja 16 besed v 4 skupine po 4 je splošna logična uganka;
// ime "Connections" je blagovna znamka NYT, uporabljamo izvirno ime "Povezave" in lastne slovenske uganke.
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { shuffle } from '../utils/rng.js';
import { escapeHtml } from '../ui.js';

// Slovenske uganke Povezave – 16 besed, 4 skupine. Barve: rumena (najlažja) → vijolična (najtežja)
// Vsaka uganka ima 4 skupine z imenom in 4 besedami.
const PUZZLES = [
  {
    id: 1,
    groups: [
      { name: 'VRSTE SADJA', words: ['JABOLKO', 'HRUŠKA', 'SLIVA', 'ČEŠNJA'], color: 'yellow' },
      { name: 'BARVE', words: ['RDEČA', 'MODRA', 'ZELENA', 'RUMENA'], color: 'green' },
      { name: 'ŽIVALI NA KMETIJI', words: ['KRAVA', 'PRAŠIČ', 'KOKOŠ', 'OVCA'], color: 'blue' },
      { name: 'GLASBILA', words: ['KITARA', 'KLAVIR', 'VIOLINA', 'BOBEN'], color: 'purple' },
    ],
  },
  {
    id: 2,
    groups: [
      { name: 'MORJE', words: ['VAL', 'PESEK', 'ŠKOLJKA', 'SVETILNIK'], color: 'yellow' },
      { name: 'GOZD', words: ['JELEN', 'GOBA', 'MAH', 'STORŽ'], color: 'green' },
      { name: 'KUHINJA', words: ['LONEC', 'PONVA', 'KUHANJE', 'REZATI'], color: 'blue' },
      {
        name: 'BESEDE S PREDPONO "PRI"',
        words: ['PRIHOD', 'PRIMER', 'PRINOS', 'PRIJAZEN'],
        color: 'purple',
      },
    ],
  },
  {
    id: 3,
    groups: [
      {
        name: 'ŠPORT Z ŽOGO',
        words: ['NOGOMET', 'KOŠARKA', 'ODBOJKA', 'ROKOMET'],
        color: 'yellow',
      },
      { name: 'ZIMSKI ŠPORTI', words: ['SMUČANJE', 'DRSANJE', 'HOKEJ', 'BIATLON'], color: 'green' },
      { name: 'MERJENJE ČASA', words: ['SEKUNDA', 'MINUTA', 'URA', 'DAN'], color: 'blue' },
      { name: 'IZPELJANKA "VOD"', words: ['VODA', 'VODJA', 'VODNIK', 'ODVOD'], color: 'purple' },
    ],
  },
  {
    id: 4,
    groups: [
      { name: 'PREVOZNA SREDSTVA', words: ['AVTO', 'VLAK', 'LADJA', 'LETALO'], color: 'yellow' },
      { name: 'DELI TELESA', words: ['ROKA', 'NOGA', 'GLAVA', 'HRBET'], color: 'green' },
      { name: 'VRSTE OBLAKOV', words: ['KUMULUS', 'CIRUS', 'STRATUS', 'NIMBUS'], color: 'blue' },
      { name: 'KONČNICA "-AR"', words: ['MESAR', 'RIBAR', 'MIZAR', 'ZIDAR'], color: 'purple' },
    ],
  },
  {
    id: 5,
    groups: [
      {
        name: 'SLOVENSKA MESTA',
        words: ['LJUBLJANA', 'MARIBOR', 'CELJE', 'KRANJ'],
        color: 'yellow',
      },
      { name: 'REKE', words: ['SAVA', 'DRAVA', 'SOČA', 'MURA'], color: 'green' },
      { name: 'ZAČIMBE', words: ['POPER', 'CIMET', 'KUMINA', 'ORIGANO'], color: 'blue' },
      {
        name: 'BESEDE KI SE RIMajo Z "LUNA"',
        words: ['TUNA', 'KUNA', 'RUNA', 'LUNA'],
        color: 'purple',
      },
    ],
  },
  {
    id: 6,
    groups: [
      {
        name: 'OSNOVNE OBLIKE',
        words: ['KROG', 'KVADRAT', 'TRIKOTNIK', 'PRAVOKOTNIK'],
        color: 'yellow',
      },
      { name: 'VESELE BESEDE', words: ['NASMEH', 'RADOST', 'SREČA', 'VESELJE'], color: 'green' },
      { name: 'ORODJA', words: ['KLADIVO', 'IZVIJAČ', 'KLEŠČE', 'ŽAGA'], color: 'blue' },
      { name: 'PALINDROMI', words: ['ANNA', 'EJE', 'POP', 'RADAR'], color: 'purple' },
    ],
  },
  {
    id: 7,
    groups: [
      { name: 'PTICE', words: ['VRANA', 'SOKOL', 'GOS', 'LABOD'], color: 'yellow' },
      { name: 'DREVESA', words: ['HRAST', 'BUKEV', 'JAVOR', 'SMREKA'], color: 'green' },
      { name: 'KOVINE', words: ['ŽELEZO', 'BAKER', 'ZLATO', 'SREBRO'], color: 'blue' },
      { name: 'POZDRAVI', words: ['ZDRAVO', 'ŽIVJO', 'ADJO', 'ČAO'], color: 'purple' },
    ],
  },
  {
    id: 8,
    groups: [
      { name: 'POHIŠTVO', words: ['MIZA', 'STOL', 'OMARA', 'POSTELJA'], color: 'yellow' },
      { name: 'ELEKTRONIKA', words: ['TELEFON', 'TABLICA', 'LAPTOP', 'TV'], color: 'green' },
      { name: 'VRSTE SIRA', words: ['EDAMEC', 'GAUDA', 'MOZZARELLA', 'BRIE'], color: 'blue' },
      { name: 'HOMONIMI "KLJUČ"', words: ['VRATA', 'NOTA', 'REŠITEV', 'VIR'], color: 'purple' },
    ],
  },
  {
    id: 9,
    groups: [
      { name: 'OKUSI', words: ['SLADKO', 'KISLO', 'GRENKO', 'SLANO'], color: 'yellow' },
      { name: 'LETNI ČASI', words: ['POMLAD', 'POLETJE', 'JESEN', 'ZIMA'], color: 'green' },
      {
        name: 'MATEMATIKA',
        words: ['SEŠTEVANJE', 'ODŠTEVANJE', 'MNOŽENJE', 'DELJENJE'],
        color: 'blue',
      },
      {
        name: 'ZAČETEK S "PRE"',
        words: ['PREHOD', 'PRENOS', 'PREVOZ', 'PREGLED'],
        color: 'purple',
      },
    ],
  },
  {
    id: 10,
    groups: [
      { name: 'PIJAČE', words: ['VODA', 'SOK', 'KAVA', 'ČAJ'], color: 'yellow' },
      { name: 'PECI', words: ['KRUH', 'POTICA', 'ROGLJIČ', 'BUREK'], color: 'green' },
      { name: 'GLASBA', words: ['MELODIJA', 'RITEM', 'HARMONIJA', 'TON'], color: 'blue' },
      { name: 'KONČA SE Z "OST"', words: ['MOST', 'GOST', 'POST', 'KOST'], color: 'purple' },
    ],
  },
  {
    id: 11,
    groups: [
      { name: 'DNEVI V TEDNU (KRATKO)', words: ['PON', 'TOR', 'SRE', 'ČET'], color: 'yellow' },
      { name: 'MESECI', words: ['JAN', 'FEB', 'MAR', 'APR'], color: 'green' },
      { name: 'ŠTEVILA', words: ['ENA', 'DVE', 'TRI', 'ŠTIRI'], color: 'blue' },
      {
        name: 'BESEDE Z DVEMA SAMOGLASNIKOMA',
        words: ['MIZA', 'MURA', 'GORA', 'POLJE'],
        color: 'purple',
      },
    ],
  },
  {
    id: 12,
    groups: [
      {
        name: 'SLOVENSKI OTPOKI',
        words: ['BLEJSKI', 'BOHINJSKO', 'PTUJSKO', 'CERKNIŠKO'],
        color: 'yellow',
      },
      { name: 'GORE', words: ['TRIGLAV', 'STOL', 'GRINTAVEC', 'JALOVEC'], color: 'green' },
      { name: 'PRAZNIKI', words: ['BOŽIČ', 'VELIKA NOČ', 'NOVO LETO', 'PUST'], color: 'blue' },
      { name: 'BESEDE KI VSEBUJEJO "AJ"', words: ['MAJ', 'ČAJ', 'KAJ', 'ZAKAJ'], color: 'purple' },
    ],
  },
  {
    id: 13,
    groups: [
      { name: 'CVETLICE', words: ['VRANICA', 'TULIPAN', 'NARCISA', 'VRTNICA'], color: 'yellow' },
      { name: 'ZELENJAVA', words: ['KORENJE', 'PARADIŽNIK', 'KUMARA', 'SOLATA'], color: 'green' },
      { name: 'SADJE', words: ['KIVI', 'MANGO', 'BANANA', 'ANANAS'], color: 'blue' },
      { name: 'BESEDE NA "KA"', words: ['REKA', 'MOKA', 'ROKA', 'LOKA'], color: 'purple' },
    ],
  },
  {
    id: 14,
    groups: [
      {
        name: 'ŠOLSKI PREDMETI',
        words: ['MATEMATIKA', 'SLOVENŠČINA', 'ZGODOVINA', 'GEOGRAFIJA'],
        color: 'yellow',
      },
      { name: 'ŠPORTNE IGRE', words: ['ŠAH', 'TENIS', 'GOLF', 'BOKS'], color: 'green' },
      { name: 'EMOCIJE', words: ['VESEL', 'ŽALOSTEN', 'JEZEN', 'PRESENEČEN'], color: 'blue' },
      { name: 'MESTA OB MORJU', words: ['PIRAN', 'KOPER', 'IZOLA', 'PORTOROŽ'], color: 'purple' },
    ],
  },
];

const COLOR_CLASS = {
  yellow: 'pov-group-yellow',
  green: 'pov-group-green',
  blue: 'pov-group-blue',
  purple: 'pov-group-purple',
};

const STATE_KEY = 'povezave_state_v1';

export function renderPovezave() {
  const settingsHtml = `
    <div class="settings-row">
      <label class="form-label">Način izbire uganke
        <select id="pov-mode" class="form-select">
          <option value="random" selected>Naključna uganka</option>
          <option value="daily">Dnevna uganka (enaka za vse)</option>
          <option value="sequential">Zaporedno (1 → 14)</option>
        </select>
      </label>
      <label class="form-label">Pomoč
        <select id="pov-hints" class="form-select">
          <option value="on" selected>Pokaži št. pravilnih ob napaki</option>
          <option value="off">Brez namigov</option>
        </select>
      </label>
    </div>
  `;

  const stageHtml = `
    <div class="game-stage">
      <div id="pov-start-screen" class="stage-layer">
        ${renderStartCard(
          'Razvrsti 16 besed v 4 skupine po 4. Vsaka skupina ima svojo barvo: rumena najlažja → vijolična najtežja. Imaš 4 življenja.',
          'pov-start-btn',
          '▶ Začni Povezave',
          'Povezave – Poišči skupine'
        )}
      </div>

      <div id="pov-play-screen" class="stage-layer hidden">
        <div class="pov-stage-container">
          <div class="pov-topbar">
            <div class="pov-lives" id="pov-lives"><span>Napake:</span><span id="pov-dots"></span><span id="pov-lives-text">4/4</span></div>
            <div style="display:flex; gap:6px;">
              <button id="pov-shuffle-btn" class="btn btn-outline" style="padding:0.35rem 0.7rem; font-size:0.82rem;">🔀 Pomešaj</button>
              <button id="pov-new-btn" class="btn btn-outline" style="padding:0.35rem 0.7rem; font-size:0.82rem;">↺ Nova</button>
            </div>
          </div>

          <div id="pov-solved" class="pov-solved-groups"></div>
          <div id="pov-grid" class="pov-grid"></div>

          <div id="pov-msg" class="pov-message"></div>

          <div class="pov-actions">
            <button id="pov-deselect-btn" class="btn btn-outline" style="padding:0.5rem 1rem;">Počisti izbor</button>
            <button id="pov-submit-btn" class="btn" style="padding:0.5rem 1.2rem;" disabled>Potrdi skupino</button>
          </div>

          <p class="pov-help">Izberi 4 besede in potrdi. Če je skupina napačna, izgubiš življenje. Poišči vse 4 skupine!</p>
        </div>
      </div>

      <div id="pov-end-screen" class="stage-layer hidden">
        <div class="rc-victory-content" style="text-align:center; max-width:420px; width:92%; background:var(--color-surface); border:1px solid var(--color-border); padding:var(--spacing-md); border-radius:var(--border-radius); box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <h3 id="pov-end-title" class="result-title" style="font-size:1.3rem; margin-bottom:var(--spacing-xs);"></h3>
          <p class="muted-xs" id="pov-end-desc" style="margin-bottom:var(--spacing-sm);"></p>
          <div id="pov-end-groups" style="display:flex; flex-direction:column; gap:6px; margin-bottom:var(--spacing-sm); text-align:left;"></div>
          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
            <button id="pov-share-btn" class="btn btn-outline" style="padding:0.4rem 0.9rem;">📋 Deli rezultat</button>
            <button id="pov-retry-btn" class="btn" style="padding:0.4rem 0.9rem;">Nova uganka</button>
          </div>
          <button id="pov-back-to-list" class="btn btn-outline" style="margin-top:8px; padding:0.35rem 0.8rem; font-size:0.82rem;">← Seznam iger</button>
        </div>
      </div>
    </div>
  `;

  const infoHtml = `
    <h4 style="margin-bottom:8px;">O igri Povezave</h4>
    <p style="margin-bottom:12px;">Povezave je <strong>slovenska logična uganka razvrščanja</strong> po kategorijah (navdih NYT Connections). Mehanika 4×4 ni zaščitena; ime <em>Connections</em> je blagovna znamka NYT, zato uporabljamo izvirno ime <strong>Povezave</strong> z lastnimi slovenskimi nizi besed.</p>
    <h4 style="margin-bottom:8px;">Pravila:</h4>
    <ul style="margin-bottom:12px; padding-left:20px; line-height:1.6;">
      <li>16 besed pripada 4 skupinam po 4 besede. Vsaka skupina ima barvo in ime.</li>
      <li><span style="background:#fef08a;border:1px solid #facc15;padding:1px 6px;border-radius:6px;">Rumena</span> najlažja → <span style="background:#e9d5ff;border:1px solid #c084fc;padding:1px 6px;border-radius:6px;">Vijolična</span> najtežja.</li>
      <li>Izberi 4 besede → Potrdi. Če tvorijo celotno skupino, se zaklenejo in obarvajo.</li>
      <li>Napačna izbira odvzame življenje (4 življenja). Če ugibaš 3 pravilne od 4, dobiš namig "skoraj!".</li>
      <li>Zmagaš, ko najdeš vse 4 skupine. Poraz po 4 napakah – rešitev se razkrije.</li>
      <li>Gumb Pomešaj naključno premeša preostale besede.</li>
    </ul>
    <p style="color:var(--color-text-muted); font-size:0.9em;">14 izvirnih slovenskih ugank, vse besede in kategorije so v slovenščini.</p>
  `;

  return renderGameShell({
    title: 'Povezave',
    subtitle: 'Razvrsti 16 besed v 4 skupine.',
    statusHtml:
      '<span>Rešeno: <strong id="pov-header-solved">0/4</strong></span><span>Življenja: <strong id="pov-header-lives">●●●●</strong></span>',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initPovezave() {
  const startScreen = document.getElementById('pov-start-screen');
  const playScreen = document.getElementById('pov-play-screen');
  const endScreen = document.getElementById('pov-end-screen');
  const gridEl = document.getElementById('pov-grid');
  const solvedEl = document.getElementById('pov-solved');
  const msgEl = document.getElementById('pov-msg');
  const startBtn = document.getElementById('pov-start-btn');
  const shuffleBtn = document.getElementById('pov-shuffle-btn');
  const newBtn = document.getElementById('pov-new-btn');
  const deselectBtn = document.getElementById('pov-deselect-btn');
  const submitBtn = document.getElementById('pov-submit-btn');

  let mode = 'random';
  let hintsOn = true;
  let currentPuzzle = null;
  let words = []; // shuffled 16 words objects {word, groupIdx}
  let selected = new Set(); // indices in words array (visible)
  let solvedGroups = []; // boolean per group
  let lives = 4;
  let won = false;
  let puzzleIndexSeq = 0; // for sequential
  let previouslyTried = new Set(); // to detect duplicate tries

  function readSettingsFromUI() {
    const mEl = document.getElementById('pov-mode');
    const hEl = document.getElementById('pov-hints');
    if (mEl) mode = mEl.value || 'random';
    if (hEl) hintsOn = hEl.value !== 'off';
  }

  setGameSettingsApplyHandler(() => {
    readSettingsFromUI();
    startNewGame();
    showLayer(playScreen);
  });

  function showLayer(layer) {
    [startScreen, playScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (layer) layer.classList.remove('hidden');
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }
  function dateSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function pickPuzzle() {
    if (mode === 'daily') {
      const idx = dateSeed(todayStr()) % PUZZLES.length;
      return PUZZLES[idx];
    } else if (mode === 'sequential') {
      const idx = puzzleIndexSeq % PUZZLES.length;
      puzzleIndexSeq++;
      try {
        localStorage.setItem('povezave_seq', String(puzzleIndexSeq));
      } catch {}
      return PUZZLES[idx];
    } else {
      return PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
    }
  }

  function loadSeq() {
    try {
      const v = parseInt(localStorage.getItem('povezave_seq') || '0', 10);
      if (!Number.isNaN(v)) puzzleIndexSeq = v;
    } catch {}
  }

  function showMessage(text, type = 'info') {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = 'pov-message ' + type;
    if (text) {
      clearTimeout(showMessage._t);
      showMessage._t = setTimeout(() => {
        msgEl.textContent = '';
        msgEl.className = 'pov-message';
      }, 2200);
    }
  }

  function updateHeader() {
    const solvedCount = solvedGroups.filter(Boolean).length;
    const livesEl = document.getElementById('pov-header-lives');
    const solvedHdr = document.getElementById('pov-header-solved');
    const dots = document.getElementById('pov-dots');
    const livesText = document.getElementById('pov-lives-text');
    if (solvedHdr) solvedHdr.textContent = `${solvedCount}/4`;
    if (livesEl) livesEl.textContent = '●'.repeat(lives) + '○'.repeat(4 - lives);
    if (dots) {
      dots.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const d = document.createElement('span');
        d.className = 'pov-life' + (i < lives ? '' : ' lost');
        dots.appendChild(d);
      }
    }
    if (livesText) livesText.textContent = `${lives}/4`;
    if (submitBtn) submitBtn.disabled = selected.size !== 4 || solvedCount === 4 || lives <= 0;
  }

  function buildGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    const unsolvedWords = words.filter((_, idx) => {
      // hide words that belong to solved groups
      const g = words[idx].groupIdx;
      return !solvedGroups[g];
    });
    // we keep original words array but only render unsolved ones in shuffled order? Actually words already shuffled global
    // To keep stable positions after solves, we filter
    const toRender = words.filter(w => !solvedGroups[w.groupIdx]);
    toRender.forEach((item, i) => {
      // need original index for selection tracking? Use word string as key
      const card = document.createElement('button');
      card.className = 'pov-card';
      card.textContent = item.word;
      card.dataset.word = item.word;
      card.dataset.group = String(item.groupIdx);
      // selected if word in selected set (store words, not indices)
      if (selected.has(item.word)) card.classList.add('selected');
      card.addEventListener('click', () => toggleSelect(item.word, card));
      gridEl.appendChild(card);
    });
    // update submit disabled
    updateHeader();
  }

  function buildSolved() {
    if (!solvedEl) return;
    solvedEl.innerHTML = '';
    solvedGroups.forEach((isSolved, gi) => {
      if (!isSolved) return;
      const g = currentPuzzle.groups[gi];
      const div = document.createElement('div');
      div.className = `pov-solved-group ${COLOR_CLASS[g.color] || ''}`;
      div.innerHTML = `<div class="pov-group-name">${escapeHtml(g.name)}</div><div class="pov-group-words">${escapeHtml(g.words.join(', '))}</div>`;
      solvedEl.appendChild(div);
    });
  }

  function toggleSelect(word, cardEl) {
    if (solvedGroups.some(Boolean) && lives <= 0) return;
    if (selected.has(word)) {
      selected.delete(word);
      cardEl.classList.remove('selected');
    } else {
      if (selected.size >= 4) {
        showMessage('Izberi največ 4 besede.', 'error');
        // shake?
        cardEl.classList.add('shake');
        setTimeout(() => cardEl.classList.remove('shake'), 350);
        sounds.play('error');
        return;
      }
      selected.add(word);
      cardEl.classList.add('selected');
      sounds.play('click');
    }
    updateHeader();
    if (selected.size === 4 && hintsOn) {
      // pre-check almost?
    }
  }

  function handleDeselect() {
    selected.clear();
    buildGrid();
    sounds.play('click');
  }

  function handleShuffle() {
    // shuffle only unsolved words
    const unsolved = words.filter(w => !solvedGroups[w.groupIdx]);
    const solved = words.filter(w => solvedGroups[w.groupIdx]);
    const shuffledUnsolved = shuffle(unsolved);
    words = [...solved, ...shuffledUnsolved];
    // keep solved groups order? Actually we reconstruct with solved first not needed because we filter solved out.
    // Rebuild to show new order: shuffle the remaining display
    // Instead shuffle words array randomly for remaining part
    // Simpler: words = shuffle(words.filter...) + solved...
    // But we want overall shuffle of unsolved positions
    // Do it as above and re-render
    // To randomize more, shuffle words unsolved part independent
    selected.clear();
    buildGrid();
    sounds.play('click');
    showMessage('Pomešano 🔀', 'info');
  }

  function checkGroup(selectedWords) {
    // selectedWords array 4 strings
    // Check if all belong to same group and group size exactly 4
    const groupsMap = {};
    selectedWords.forEach(w => {
      const item = words.find(x => x.word === w);
      if (item) groupsMap[item.groupIdx] = (groupsMap[item.groupIdx] || 0) + 1;
    });
    const entries = Object.entries(groupsMap);
    if (entries.length === 1 && entries[0][1] === 4) {
      return parseInt(entries[0][0], 10);
    }
    return null;
  }

  function countCorrectInSelection(selectedWords) {
    // For "one away" hint: how many of selected belong to some group that would be 3/4 correct
    let best = 0;
    currentPuzzle.groups.forEach((g, gi) => {
      if (solvedGroups[gi]) return;
      const cnt = selectedWords.filter(w => g.words.includes(w)).length;
      if (cnt > best) best = cnt;
    });
    return best;
  }

  function handleSubmit() {
    if (selected.size !== 4) return;
    const selArr = Array.from(selected);
    const key = selArr.slice().sort().join('|');
    if (previouslyTried.has(key)) {
      showMessage('To kombinacijo si že poskusil.', 'error');
      // shake selected cards
      selArr.forEach(w => {
        const el = gridEl.querySelector(`.pov-card[data-word="${CSS.escape(w)}"]`);
        if (el) {
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
        }
      });
      sounds.play('error');
      return;
    }
    previouslyTried.add(key);
    const groupIdx = checkGroup(selArr);
    if (groupIdx !== null) {
      // correct
      solvedGroups[groupIdx] = true;
      selected.clear();
      buildSolved();
      buildGrid();
      sounds.play('correct');
      // check win
      if (solvedGroups.every(Boolean)) {
        winGame();
      } else {
        showMessage(`Pravilno! Skupina "${currentPuzzle.groups[groupIdx].name}"`, 'success');
        // slight confetti for each group?
      }
      updateHeader();
      saveState();
      return;
    } else {
      // wrong
      lives--;
      // shake
      selArr.forEach(w => {
        const el = gridEl.querySelector(`.pov-card[data-word="${CSS.escape(w)}"]`);
        if (el) {
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
        }
      });
      sounds.play('error');
      const correctCount = countCorrectInSelection(selArr);
      if (hintsOn && correctCount === 3) {
        showMessage('Skoraj! 3 od 4 so iz iste skupine.', 'info');
      } else {
        showMessage(
          lives > 0 ? `Napačno. Preostalo življenj: ${lives}` : 'Ni več življenj!',
          'error'
        );
      }
      updateHeader();
      if (lives <= 0) {
        // reveal
        setTimeout(() => loseGame(), 700);
      }
      saveState();
    }
  }

  function winGame() {
    won = true;
    showMessage('Bravo! Vse skupine najdene 🎉', 'success');
    showConfetti({ count: 30 });
    sounds.play('victory');
    // stats
    const mistakes = 4 - lives;
    const xp = 40 + (4 - mistakes) * 15;
    const score = Math.max(10, 100 - mistakes * 15);
    statsManager.addXp(xp);
    statsManager.saveRecord('povezave', {
      won: true,
      mistakes,
      puzzleId: currentPuzzle.id,
      mode,
      score,
      solved: 4,
    });
    showEndScreen(true);
  }

  function loseGame() {
    won = false;
    showMessage('Konec – rešitev razkrita.', 'error');
    // reveal all remaining groups as solved but dim?
    currentPuzzle.groups.forEach((_, gi) => (solvedGroups[gi] = true));
    buildSolved();
    // hide grid
    if (gridEl) gridEl.innerHTML = '';
    statsManager.addXp(5);
    statsManager.saveRecord('povezave', {
      won: false,
      mistakes: 4,
      puzzleId: currentPuzzle.id,
      mode,
      score: 0,
      solved: solvedGroups.filter(Boolean).length,
    });
    showEndScreen(false);
  }

  function showEndScreen(isWin) {
    const titleEl = document.getElementById('pov-end-title');
    const descEl = document.getElementById('pov-end-desc');
    const groupsEl = document.getElementById('pov-end-groups');
    if (titleEl)
      titleEl.textContent = isWin
        ? '🎉 Zmaga – vse povezave najdene!'
        : 'Žal ni uspelo – zmanjkalo življenj';
    if (titleEl) titleEl.style.color = isWin ? '#16a34a' : '#ef4444';
    if (descEl)
      descEl.textContent = isWin
        ? `Rešil/a si uganko #${currentPuzzle.id} s ${4 - lives} napakami.`
        : `Ugan ka #${currentPuzzle.id} ni rešena. Oglej si pravilne skupine spodaj.`;
    if (groupsEl) {
      groupsEl.innerHTML = '';
      currentPuzzle.groups.forEach(g => {
        const div = document.createElement('div');
        div.className = `pov-solved-group ${COLOR_CLASS[g.color] || ''}`;
        div.style.fontSize = '0.85rem';
        div.innerHTML = `<div class="pov-group-name">${escapeHtml(g.name)}</div><div class="pov-group-words">${escapeHtml(g.words.join(' • '))}</div>`;
        groupsEl.appendChild(div);
      });
    }
    showLayer(endScreen);
  }

  function handleShare() {
    const solvedCount = solvedGroups.filter(Boolean).length;
    const status = won ? `4/4` : `${solvedCount}/4`;
    const mistakes = 4 - lives;
    let text = `Povezave #${currentPuzzle.id} ${won ? '✅' : '❌'} ${status} (${mistakes} napak)\n`;
    // Add emoji grid? For each group color representation
    // Simpler: list groups with emojis
    const emojis = { yellow: '🟨', green: '🟩', blue: '🟦', purple: '🟪' };
    text += currentPuzzle.groups.map(g => emojis[g.color] || '⬜').join('') + '\n';
    text += new URL('#game/povezave', window.location.href).href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast('Rezultat kopiran 📋', { type: 'success' }))
        .catch(() => showToast(text, { type: 'info', timeout: 5000 }));
    } else {
      showToast(text, { type: 'info', timeout: 5000 });
    }
    sounds.play('click');
  }

  function saveState() {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          mode,
          puzzleId: currentPuzzle?.id,
          solvedGroups,
          lives,
          words,
          selected: Array.from(selected),
          previouslyTried: Array.from(previouslyTried),
          puzzleIndexSeq,
        })
      );
    } catch {}
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function startNewGame(forcePuzzle = null) {
    readSettingsFromUI();
    loadSeq();
    let puzzle = forcePuzzle || pickPuzzle();
    // If daily and we have saved state for today's daily and not finished, restore
    if (mode === 'daily' && !forcePuzzle) {
      const saved = loadState();
      const todayPuzzle = PUZZLES[dateSeed(todayStr()) % PUZZLES.length];
      if (
        saved &&
        saved.mode === 'daily' &&
        saved.puzzleId === todayPuzzle.id &&
        saved.lives > 0 &&
        !saved.solvedGroups?.every(Boolean)
      ) {
        // restore
        currentPuzzle = PUZZLES.find(p => p.id === saved.puzzleId) || todayPuzzle;
        words =
          saved.words ||
          currentPuzzle.groups.flatMap((g, gi) => g.words.map(w => ({ word: w, groupIdx: gi })));
        solvedGroups = saved.solvedGroups || [false, false, false, false];
        lives = saved.lives ?? 4;
        selected = new Set(saved.selected || []);
        previouslyTried = new Set(saved.previouslyTried || []);
        buildSolved();
        buildGrid();
        updateHeader();
        return;
      } else {
        puzzle = todayPuzzle;
      }
    }
    currentPuzzle = puzzle;
    // build words shuffled
    const flat = currentPuzzle.groups.flatMap((g, gi) =>
      g.words.map(w => ({ word: w, groupIdx: gi }))
    );
    words = shuffle(flat);
    solvedGroups = [false, false, false, false];
    selected.clear();
    previouslyTried.clear();
    lives = 4;
    won = false;
    buildSolved();
    buildGrid();
    updateHeader();
    showMessage('', 'info');
    saveState();
  }

  // listeners
  if (startBtn)
    startBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  if (shuffleBtn) shuffleBtn.addEventListener('click', handleShuffle);
  if (newBtn)
    newBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  if (deselectBtn) deselectBtn.addEventListener('click', handleDeselect);
  if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
  document.getElementById('pov-retry-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('pov-share-btn')?.addEventListener('click', handleShare);
  document.getElementById('pov-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  // Keyboard support: numbers 1-4? Not needed.

  // init
  loadSeq();
  startNewGame();
  showLayer(startScreen);

  return () => {
    // cleanup if needed
  };
}
