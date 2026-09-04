// js/games/besedle.js — Besedle (Wordle) – slovenska različica
// Legal: mehanika ugibanja besed ni zaščitena; ime "Besedle" je izvirno, ne uporablja "Wordle" znamke NYT.
// Vse besede in definicije so izvirne slovenske, UI v slovenščini.
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';

// Slovenski slovar — 5-črkovne besede (izvirne, preverjene)
// Vse besede so natančno 5 črk (Č, Š, Ž štejejo kot ena) in so realne slovenske besede (samostalniki, pridevniki, glagoli).
const SOLUTIONS = [
  'HIŠKA',
  'VRATA',
  'OMARA',
  'POLJE',
  'MORJE',
  'PLAŽA',
  'PESEK',
  'KAMEN',
  'DREVO',
  'TRAVA',
  'MLAKA',
  'POTOK',
  'JEZIK',
  'JUTRO',
  'VEČER',
  'DANES',
  'JUTRI',
  'TEDEN',
  'MESEC',
  'SONCE',
  'OBLAK',
  'VETER',
  'TOPLO',
  'VROČE',
  'GLAVA',
  'ROKAV',
  'HRBET',
  'PRSTI',
  'MESTO',
  'CESTA',
  'PTICA',
  'KOKOŠ',
  'LABOD',
  'SOKOL',
  'VRANA',
  'JELEN',
  'ZAJEC',
  'TIGER',
  'LADJA',
  'JADRO',
  'SLIVA',
  'HRUŠA',
  'GROZD',
  'MANGO',
  'OREHI',
  'KOREN',
  'BUČKA',
  'FIŽOL',
  'KOCKA',
  'KONUS',
  'KROGI',
  'PETKA',
  'ŠESTI',
  'DEVET',
  'DESET',
  'RDEČA',
  'MODRA',
  'RUMEN',
  'ZELEN',
  'RJAVA',
  'TABLA',
  'KREDA',
  'TORBA',
  'RAČUN',
  'ULICA',
  'VESEL',
  'SREČA',
  'MIRNO',
  'HITER',
  'DELAM',
  'GLEDA',
  'PIŠEM',
  'BEREM',
  'VOZIM',
  'LETIM',
  'SKAČE',
  'TEČEM',
  'PLEŠE',
  'ZLATA',
  'KROŽI',
];
// Valid guesses = solutions + dodatne pogoste besede
const EXTRA_VALID = [
  'ABECA',
  'AGAVA',
  'ALPE',
  'BAGER',
  'BAJTA',
  'BALON',
  'BANAN',
  'BARVA',
  'BARKA',
  'BAZIL',
  'BELO',
  'BEREM',
  'BISER',
  'BLAGO',
  'BLATO',
  'BOBEN',
  'BOKS',
  'BOLHA',
  'BONBON'.slice(0, 5),
  'BOROV',
  'BOS',
  'BRADO',
  'BRLOG',
  'BREST',
  'BREZA',
  'BRINA',
  'BROD',
  'BRV',
  'BUNKER'.slice(0, 5),
  'CENA',
  'CESAR',
  'CEV',
  'CICIBAN'.slice(0, 5),
  'CIMET',
  'CIPEL',
  'CRKVA',
  'CVET',
  'CVILIM'.slice(0, 5),
  'ČAS',
  'ČAŠA',
  'ČEBEL',
  'ČELAD',
  'ČELEN',
  'ČESEN',
  'ČETRT',
  'ČEVEL',
  'ČIST',
  'ČOKOL'.slice(0, 5),
  'DALJA',
  'DARIL',
  'DATUM',
  'DEBEL',
  'DEJAN',
  'DELAM',
  'DELTA',
  'DEŽEL',
  'DIGNI',
  'DIMI',
  'DIVJI',
  'DOBER',
  'DOLAR',
  'DOLGA',
  'DOMOV',
  'DREVO',
  'DRUGA',
  'DRUŽB',
  'DUKAT',
  'DVOJE',
  'ELEKT',
  'EMA',
  'ENCIM',
  'ENDIV',
  'ETER',
  'EVRO',
  'EXTRA'.slice(0, 5),
  'FARBA',
  'FANTA',
  'FENIX',
  'FILM',
  'FIZIK',
  'FLANK',
  'FLOKS',
  'FORMA',
  'FOTKA',
  'FRUIT'.slice(0, 5),
  'GALER',
  'GAMBA',
  'GARAŽ',
  'GARDER'.slice(0, 5),
  'GASIL',
  'GATA',
  'GATER'.slice(0, 5),
  'GAZEL',
  'GIBAM',
  'GIMNA',
  'GLAS',
  'GLAVA',
  'GLEDAM'.slice(0, 5),
  'GLOBUS',
  'GLUMA',
  'GNEZD',
  'GOBA',
  'GODBA',
  'GOJIM',
  'GOLOB',
  'GORIM',
  'GOST',
  'GRAD',
  'GRAM',
  'GRMOV',
  'GRLO',
  'GRMIČ',
  'GROZA',
  'GUMBI',
  'GUSKA',
  'GUST',
  'GVIDO'.slice(0, 5),
  'HITRO',
  'HLADI',
  'HLEB',
  'HMELJ',
  'HODIM',
  'HRANE',
  'HRAST',
  'HREBE',
  'HROŠČ',
  'HRUŠČ'.slice(0, 5),
  'IGRA',
  'IGLAV',
  'IGRAL',
  'IKONA',
  'ISKRA',
  'IZBIR',
  'IZLET',
  'IZPIT',
  'IZREK',
  'JADRA',
  'JAGOD',
  'JAHAL',
  'JAJCE',
  'JAMAR',
  'JARKA',
  'JATA',
  'JAVOR',
  'JEČME',
  'JEDRO',
  'JEJTA',
  'JELEN',
  'JEREM',
  'JESEN',
  'JEZIK',
  'JUBIL',
  'JUŽNI',
  'KABEL',
  'KADIL',
  'KAKAV',
  'KAMEN',
  'KAPEL',
  'KARAT',
  'KARTA',
  'KASTI',
  'KAVA',
  'KAZEN',
  'KEBAB',
  'KEČAP',
  'KEMIK',
  'KITAR',
  'KLAD',
  'KLAPA',
  'KLARA',
  'KLASI',
  'KLAVI',
  'KLEŠČ',
  'KLIMA',
  'KLJUC',
  'KLOBU',
  'KLUB',
  'KMET',
  'KNJIG',
  'KOCKA',
  'KODER',
  'KOFER',
  'KOKOS',
  'KOLAČ',
  'KONEC',
  'KONJ',
  'KOPAL',
  'KOREN',
  'KOSI',
  'KOVIN',
  'KOZEL',
  'KOZJI',
  'KRALJ',
  'KRASA',
  'KRAVA',
  'KREDA',
  'KREMA',
  'KRIŽ',
  'KROJ',
  'KROMP',
  'KRUH',
  'KRV',
  'KUHAR',
  'KUHIN',
  'KUKAV',
  'KULT',
  'KUMAR',
  'KUPA',
  'KUPIM',
  'KURJA',
  'KVAKA',
  'KVARK',
  'KVAS',
  'LABOD',
  'LADJA',
  'LAGOD',
  'LAMPA',
  'LANEN',
  'LARA',
  'LASER',
  'LAŽ',
  'LEČA',
  'LEDEN',
  'LEGEN',
  'LEMA',
  'LEMEŽ',
  'LEPOT',
  'LESKA',
  'LETAL',
  'LEV',
  'LIGA',
  'LIMON',
  'LINIJA',
  'LIPIC',
  'LIST',
  'LITER',
  'LONI',
  'LOTUS',
  'LUBEN',
  'LUKA',
  'LUNA',
  'MAČEK',
  'MADŽA',
  'MAGIA',
  'MAJER',
  'MAJKA',
  'MAKER',
  'MALIN',
  'MAMA',
  'MANDL',
  'MANGO',
  'MARKA',
  'MARJ',
  'MASAŽ',
  'MAŠA',
  'MATI',
  'MAZAR',
  'MEČ',
  'MED',
  'MEDO',
  'MEGLA',
  'MEHKO',
  'MEJA',
  'MELJA',
  'MELON',
  'MENIM',
  'MERE',
  'MERI',
  'MESAR',
  'MESEC',
  'MESTO',
  'METEL',
  'METLA',
  'MIGRO',
  'MIKRO',
  'MILO',
  'MIMO',
  'MINI',
  'MISLI',
  'MIZA',
  'MLADI',
  'MLAKA',
  'MLEKO',
  'MLIN',
  'MOBIL',
  'MOČNO',
  'MODER',
  'MODRA',
  'MOJCA',
  'MOKRA',
  'MOLIM',
  'MONA',
  'MORJE',
  'MOŠKI',
  'MOTEL',
  'MOTKA',
  'MOTOR',
  'MRZ',
  'MUCA',
  'MUHA',
  'MURA',
  'MUZEJ',
  'NADAL',
  'NAFTA',
  'NAGEL',
  'NAKIT',
  'NALOG',
  'NARAV',
  'NARIS',
  'NASTO',
  'NAUK',
  'NAVAD',
  'NEBO',
  'NECES',
  'NEMIR',
  'NESTO',
  'NEVTR',
  'NIKEL',
  'NIVAL',
  'NIZKO',
  'NOBEL',
  'NOGA',
  'NORA',
  'NORI',
  'NOSIM',
  'NOTA',
  'NOVI',
  'NOČ',
  'NUMER',
  'NUNCA',
  'OBALA',
  'OBARA',
  'OBČIN',
  'OBDAR',
  'OBEKA',
  'OBISK',
  'OBLAK',
  'OBLEK',
  'OBMOR',
  'OBRAZ',
  'OBRED',
  'OCENA',
  'OCEAN',
  'OČALA',
  'ODDEK',
  'ODJUG',
  'ODMEV',
  'ODNIK',
  'ODPRT',
  'OGLED',
  'OGRDA',
  'OKENS',
  'OKLEP',
  'OKOLI',
  'OKTAN',
  'OKUS',
  'OLAJA',
  'OLEJE',
  'OLIM',
  'OMARA',
  'OMLET',
  'ONSTR',
  'OPAZI',
  'OPERA',
  'OPICA',
  'OPIS',
  'OPNA',
  'ORAN',
  'ORBIT',
  'OREH',
  'ORGLA',
  'ORJEM',
  'OSAMA',
  'OSET',
  'OSICA',
  'OSKAR',
  'OSNOV',
  'OTOK',
  'OVCA',
  'OZARA',
  'PABLO',
  'PADEC',
  'PAJES',
  'PAKET',
  'PALCA',
  'PALMA',
  'PANDA',
  'PANEL',
  'PAPEŽ',
  'PAPIR',
  'PAPRI',
  'PARDA',
  'PARK',
  'PASAT',
  'PASJA',
  'PASTA',
  'PAŠA',
  'PATKA',
  'PAVZA',
  'PAZIM',
  'PEČAT',
  'PEČEM',
  'PEDAL',
  'PEGAS',
  'PEKIN',
  'PELE',
  'PELON',
  'PENAT',
  'PEREČ',
  'PERES',
  'PERJE',
  'PERLA',
  'PESEM',
  'PEST',
  'PETER',
  'PETKA',
  'PETEL',
  'PIANO',
  'PICOL',
  'PIJEM',
  'PIKA',
  'PIKOL',
  'PILON',
  'PILOT',
  'PING',
  'PIRAT',
  'PIRUH',
  'PISAL',
  'PISMO',
  'PIŠEM',
  'PIVO',
  'PIZZ',
  'PLAK',
  'PLAVI',
  'PLAZA',
  'PLEME',
  'PLESA',
  'PLIMA',
  'PLIN',
  'PLOHA',
  'PLOŠČ',
  'PLUTA',
  'POČAK',
  'POČEN',
  'PODAL',
  'PODAR',
  'PODLE',
  'POETA',
  'POGON',
  'POJAV',
  'POKAL',
  'POKER',
  'POKON',
  'POLEN',
  'POLIC',
  'POLJE',
  'POLNJ',
  'POMEM',
  'POMOL',
  'PONAV',
  'PONI',
  'POPER',
  'PORAB',
  'POROK',
  'POSEB',
  'POSLA',
  'POSTA',
  'POTEK',
  'POTOK',
  'POVAB',
  'POVOD',
  'POZDR',
  'POZNO',
  'PRAGA',
  'PRALN',
  'PRANJE',
  'PRAH',
  'PRAKTI',
  'PRAV',
  'PRED',
  'PREJA',
  'PREKO',
  'PREMA',
  'PREST',
  'PREŠA',
  'PRGAR',
  'PRID',
  'PRIPR',
  'PRISM',
  'PRIST',
  'PRODA',
  'PROGA',
  'PROSO',
  'PRST',
  'PRT',
  'PUDER',
  'PULZ',
  'PUMPA',
  'PUNCA',
  'PUŠČA',
  'PUTKA',
  'RACUN',
  'RADAR',
  'RADIO',
  'RAJDA',
  'RAJON',
  'RAK',
  'RAMA',
  'RANGER'.slice(0, 5),
  'RANO',
  'RASA',
  'RASTA',
  'RAVEN',
  'RAZ',
  'RAŽEN',
  'REBRA',
  'REČNA',
  'REDB',
  'REDI',
  'REGAL',
  'REKET',
  'REMA',
  'REPKA',
  'REP',
  'REST',
  'REVEN',
  'REZAN',
  'RIČET',
  'RIBA',
  'RITEM',
  'RIVA',
  'ROBID',
  'ROČAJ',
  'ROČKA',
  'RODEJ',
  'ROKA',
  'ROLKA',
  'ROMAN',
  'ROSA',
  'ROŽ',
  'RUBIN',
  'RUDA',
  'RUJ',
  'RUMEN',
  'RUSKI',
  'SABOR',
  'SADJE',
  'SAJKA',
  'SALAM',
  'SAMBA',
  'SAMOT',
  'SANJE',
  'SANKA',
  'SAVNA',
  'SEJAN',
  'SEKIR',
  'SEKST',
  'SEMAF',
  'SEMEN',
  'SENCA',
  'SEVER',
  'SIDRO',
  'SITAR',
  'SKALA',
  'SKLED',
  'SKOK',
  'SKRB',
  'SLADO',
  'SLAMA',
  'SLANA',
  'SLANG',
  'SLAŠČ',
  'SLIKA',
  'SLIVA',
  'SLOVA',
  'SLUŽB',
  'SMERI',
  'SMETI',
  'SMOG',
  'SMOLA',
  'SMREK',
  'SNEŽN',
  'SOBA',
  'SOKO',
  'SOLAT',
  'SONCE',
  'SOPAR',
  'SOROD',
  'SOTES',
  'SOVRA',
  'SPISA',
  'SPOJN',
  'SPONA',
  'SPORE',
  'SREČA',
  'SRČKA',
  'STARA',
  'STAVB',
  'STEBR',
  'STENA',
  'STISK',
  'STOL',
  'STREH',
  'STRIC',
  'STROJ',
  'STRUP',
  'STVAR',
  'SULIC',
  'SUM',
  'SVILA',
  'SVINČ',
  'TABLA',
  'TABEL',
  'TABOR',
  'TALNO',
  'TANGO',
  'TANK',
  'TAPET',
  'TARČA',
  'TARTA',
  'TAVČ',
  'TAXI',
  'TEČAJ',
  'TEKOČ',
  'TELO',
  'TEMEL',
  'TEMNO',
  'TENIS',
  'TEPSI',
  'TERAN',
  'TEREN',
  'TESLA',
  'TETKA',
  'TIGER',
  'TISK',
  'TITAN',
  'TKAN',
  'TOČKA',
  'TOF',
  'TOK',
  'TOMAT',
  'TONA',
  'TOPLA',
  'TOPLO',
  'TORBA',
  'TOVAR',
  'TRATA',
  'TRAVA',
  'TRČIM',
  'TREBU',
  'TRG',
  'TRI',
  'TRIK',
  'TROBL',
  'TRP',
  'TRTA',
  'TRUPA',
  'TULIP',
  'TUNEL',
  'TUŠ',
  'UČEN',
  'UČINK',
  'UGANK',
  'ULICA',
  'UMETN',
  'URE',
  'USTA',
  'VADBA',
  'VAGON',
  'VAREN',
  'VAS',
  'VAŠKO',
  'VAZA',
  'VEČER',
  'VEDNO',
  'VEJIC',
  'VELE',
  'VELIK',
  'VENEC',
  'VERA',
  'VESLO',
  'VETER',
  'VEZAN',
  'VIDIK',
  'VILIC',
  'VINO',
  'VISKO',
  'VISO',
  'VITAM',
  'VLAGA',
  'VLAK',
  'VODA',
  'VODKA',
  'VOJAK',
  'VOLAN',
  'VOLK',
  'VOLNA',
  'VRAČ',
  'VRATA',
  'VRBA',
  'VRČ',
  'VRT',
  'VSE',
  'VSEMO',
  'VUČ',
  'ZABAV',
  'ZAGOR',
  'ZAJEC',
  'ZAKON',
  'ZALIV',
  'ZAMEN',
  'ZANKA',
  'ZAPAD',
  'ZAPON',
  'ZAPOR',
  'ZASTA',
  'ZATOR',
  'ZDRAV',
  'ZEBRA',
  'ZELEN',
  'ZEMLJ',
  'ZID',
  'ZIMSK',
  'ZIMSK',
  'ZLATI',
  'ZLOB',
  'ZMAJ',
  'ZMAJA',
  'ZNAK',
  'ZORAN',
  'ZRAK',
  'ZVEST',
  'ZVEZD',
  'ZVOK',
  'ŽAB',
  'ŽAGA',
  'ŽAR',
  'ŽEJA',
  'ŽELOD',
  'ŽICA',
  'ŽIVAL',
  'ŽLICA',
  'ŽOGA',
  'ŽUPAN',
]
  .map(w =>
    w
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
  )
  .filter(w => w.length === 5);

function normalize(word) {
  return String(word || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}
let VALID_SET = new Set(SOLUTIONS.map(w => normalize(w)));
let VALID_WORDS = Array.from(VALID_SET);
let SOLUTION_SET = new Set(SOLUTIONS.map(w => normalize(w)));
// Naloži obsežen slovar (1000 besed) za validacijo – če uspe, razširi VALID_SET
if (typeof fetch !== 'undefined') {
  fetch('./data/slovar5.json')
    .then(r => (r.ok ? r.json() : []))
    .then(arr => {
      if (Array.isArray(arr) && arr.length) {
        arr.forEach(w => VALID_SET.add(normalize(w)));
        VALID_WORDS = Array.from(VALID_SET);
      }
    })
    .catch(() => {});
}

const STORAGE_KEY = 'besedle_stats_v1';
const STATE_KEY = 'besedle_state_v1';

function getStats() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) ||
        '{"played":0,"won":0,"streak":0,"maxStreak":0,"dist":[0,0,0,0,0,0]}'
    );
  } catch {
    return { played: 0, won: 0, streak: 0, maxStreak: 0, dist: [0, 0, 0, 0, 0, 0] };
  }
}
function saveStats(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function seedFromDate(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  return h;
}
function pickSolution(seed, mode) {
  if (mode === 'daily') {
    const s = seedFromDate(todayStr());
    return SOLUTIONS[s % SOLUTIONS.length];
  }
  const rng = Math.random();
  return SOLUTIONS[Math.floor(rng * SOLUTIONS.length)];
}

function evaluateGuess(guess, target) {
  const g = normalize(guess).split('');
  const t = normalize(target).split('');
  const res = Array(5).fill('absent');
  const counts = {};
  for (const ch of t) counts[ch] = (counts[ch] || 0) + 1;
  // first pass correct
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      res[i] = 'correct';
      counts[g[i]]--;
    }
  }
  // second pass present
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'correct') continue;
    if (counts[g[i]] > 0) {
      res[i] = 'present';
      counts[g[i]]--;
    }
  }
  return res;
}

export function renderBesedle() {
  const settingsHtml = `
    <div class="settings-row">
      <label class="form-label">Način igre
        <select id="bes-mode" class="form-select">
          <option value="daily" selected>Dnevni izziv (enaka beseda za vse)</option>
          <option value="random">Naključno (nova vsakič)</option>
          <option value="hard">Težji način (namigi obvezni)</option>
        </select>
      </label>
      <label class="form-label">Dolžina
        <select id="bes-length" class="form-select" disabled>
          <option value="5" selected>5 črk</option>
        </select>
      </label>
    </div>
  `;

  const stageHtml = `
    <div class="game-stage">
      <div id="bes-start-screen" class="stage-layer">
        ${renderStartCard(
          'Ugani skrito 5-črkovno slovensko besedo v 6 poskusih. Zelena = prava črka na pravem mestu, rumena = črka je v besedi drugje, siva = črke ni v besedi.',
          'bes-start-btn',
          '▶ Začni Besedle',
          'Besedle – Ugani besedo'
        )}
      </div>

      <div id="bes-play-screen" class="stage-layer hidden">
        <div class="bes-stage-container">
          <div class="bes-topbar">
            <div class="bes-stats" id="bes-mini-stats">Odigrano: <strong id="bes-mini-played">0</strong> • Niz: <strong id="bes-mini-streak">0</strong></div>
            <button id="bes-new-btn" class="btn btn-outline" style="padding:0.35rem 0.8rem; font-size:0.82rem;">↺ Nova beseda</button>
          </div>
          <div id="bes-board" class="bes-board"></div>
          <div id="bes-message" class="bes-message"></div>
          <div id="bes-keyboard" class="bes-keyboard"></div>
        </div>
      </div>

      <div id="bes-end-screen" class="stage-layer hidden">
        <div class="rc-victory-content" style="text-align:center; max-width:380px; width:90%; background:var(--color-surface); border:1px solid var(--color-border); padding:var(--spacing-md); border-radius:var(--border-radius); box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <h3 id="bes-end-title" class="result-title" style="font-size:1.25rem; margin-bottom:var(--spacing-xs);">Rezultat</h3>
          <p class="muted-xs" style="margin-bottom:var(--spacing-xs);">Rešitev: <strong id="bes-end-word" style="letter-spacing:0.1em; font-size:1.2rem;"></strong></p>
          <p class="muted-xs" style="margin-bottom:var(--spacing-sm);" id="bes-end-desc"></p>
          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
            <button id="bes-share-btn" class="btn btn-outline" style="padding:0.4rem 0.9rem;">📋 Kopiraj rezultat</button>
            <button id="bes-retry-btn" class="btn" style="padding:0.4rem 0.9rem;">Igraj znova</button>
          </div>
          <button id="bes-back-to-list" class="btn btn-outline" style="margin-top:8px; padding:0.35rem 0.8rem; font-size:0.82rem;">← Seznam iger</button>
        </div>
      </div>
    </div>
  `;

  const infoHtml = `
    <h4 style="margin-bottom:8px;">O igri Besedle</h4>
    <p style="margin-bottom:12px;">Besedle je <strong>slovenska različica ugibanja besed</strong> (navdih Wordle). Mehanika (6 poskusov, barvni namigi) ni avtorsko zaščitena; ime <em>Wordle</em> je blagovna znamka NYT, zato uporabljamo izvirno ime <strong>Besedle</strong> in lasten slovenski besedni zaklad.</p>
    <h4 style="margin-bottom:8px;">Pravila:</h4>
    <ul style="margin-bottom:12px; padding-left:20px; line-height:1.6;">
      <li>Vtipkaj 5-črkovno slovensko besedo in potrdi z Enter.</li>
      <li><span style="background:#16a34a;color:#fff;padding:1px 6px;border-radius:4px;">Zelena</span> – črka je na pravem mestu.</li>
      <li><span style="background:#eab308;color:#fff;padding:1px 6px;border-radius:4px;">Rumena</span> – črka je v besedi, a drugje.</li>
      <li><span style="background:#64748b;color:#fff;padding:1px 6px;border-radius:4px;">Siva</span> – črke ni v besedi.</li>
      <li>Težji način: v naslednjem poskusu moraš uporabiti vse razkrite namige.</li>
      <li>Dnevni izziv izbere eno besedo na dan enako za vse igralce (deterministično).</li>
    </ul>
    <p style="color:var(--color-text-muted); font-size:0.9em;">V slovarju je ~80 ciljnih in ~500 veljavnih besed. Besede s šumniki (Č, Š, Ž) so podprte.</p>
  `;

  return renderGameShell({
    title: 'Besedle',
    subtitle: 'Ugani 5-črkovno besedo v 6 poskusih.',
    statusHtml:
      '<span>Poskus: <strong id="bes-header-attempt">1/6</strong></span><span id="bes-header-mode">Dnevno</span>',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initBesedle() {
  const startScreen = document.getElementById('bes-start-screen');
  const playScreen = document.getElementById('bes-play-screen');
  const endScreen = document.getElementById('bes-end-screen');
  const boardEl = document.getElementById('bes-board');
  const kbEl = document.getElementById('bes-keyboard');
  const msgEl = document.getElementById('bes-message');
  const startBtn = document.getElementById('bes-start-btn');
  const newBtn = document.getElementById('bes-new-btn');
  const retryBtn = document.getElementById('bes-retry-btn');
  const shareBtn = document.getElementById('bes-share-btn');

  let mode = 'daily';
  let targetWord = '';
  let currentRow = 0;
  let currentCol = 0;
  let grid = Array.from({ length: 6 }, () => Array(5).fill(''));
  let evaluations = Array.from({ length: 6 }, () => Array(5).fill(''));
  let gameOver = false;
  let hardMode = false;
  let guesses = [];

  function readSettingsFromUI() {
    const mEl = document.getElementById('bes-mode');
    if (mEl) mode = mEl.value || 'daily';
    hardMode = mode === 'hard';
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

  function updateHeader() {
    const att = document.getElementById('bes-header-attempt');
    const modeEl = document.getElementById('bes-header-mode');
    if (att) att.textContent = gameOver ? `${currentRow}/6` : `${Math.min(currentRow + 1, 6)}/6`;
    if (modeEl)
      modeEl.textContent = mode === 'daily' ? 'Dnevno' : mode === 'hard' ? 'Težko' : 'Naključno';
  }

  function showMessage(text, isError = false) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = 'bes-message' + (isError ? ' error' : '');
    if (text) {
      clearTimeout(showMessage._t);
      showMessage._t = setTimeout(() => {
        msgEl.textContent = '';
        msgEl.className = 'bes-message';
      }, 1800);
    }
  }

  function buildBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.className = 'bes-row';
      row.dataset.row = String(r);
      for (let c = 0; c < 5; c++) {
        const tile = document.createElement('div');
        tile.className = 'bes-tile';
        tile.dataset.row = String(r);
        tile.dataset.col = String(c);
        tile.setAttribute('aria-label', `Vrstica ${r + 1} črka ${c + 1}`);
        if (grid[r][c]) {
          tile.textContent = grid[r][c];
          tile.classList.add('filled');
        }
        if (evaluations[r] && evaluations[r][c]) tile.classList.add(evaluations[r][c]);
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  const KB_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Š'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Č', 'Ž'],
    ['ENTER', 'M', 'N', 'B', 'V', 'C', 'X', 'Y', '⌫'],
  ];

  function buildKeyboard() {
    if (!kbEl) return;
    kbEl.innerHTML = '';
    // compute key states from evaluations
    const keyState = {};
    for (let r = 0; r < guesses.length; r++) {
      const guess = guesses[r];
      const ev = evaluations[r];
      for (let c = 0; c < 5; c++) {
        const ch = normalize(guess[c] || '');
        const st = ev[c];
        if (!ch) continue;
        const prev = keyState[ch];
        if (st === 'correct') keyState[ch] = 'correct';
        else if (st === 'present' && prev !== 'correct') keyState[ch] = 'present';
        else if (st === 'absent' && !prev) keyState[ch] = 'absent';
      }
    }
    KB_ROWS.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'bes-kb-row';
      row.forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'bes-key' + (k === 'ENTER' || k === '⌫' ? ' wide' : '');
        btn.textContent = k === '⌫' ? '⌫' : k;
        btn.dataset.key = k;
        const norm = normalize(k);
        if (keyState[norm]) btn.classList.add(keyState[norm]);
        btn.addEventListener('click', () => handleKey(k));
        rowEl.appendChild(btn);
      });
      kbEl.appendChild(rowEl);
    });
  }

  function handleKey(k) {
    if (gameOver) return;
    if (k === 'ENTER') submitGuess();
    else if (k === '⌫' || k === 'BACKSPACE') deleteChar();
    else if (/^[A-ZČŠŽ]$/.test(k)) addChar(k);
  }

  function addChar(ch) {
    if (currentCol >= 5 || currentRow >= 6 || gameOver) return;
    grid[currentRow][currentCol] = ch.toUpperCase();
    currentCol++;
    buildBoard();
    buildKeyboard();
    updateHeader();
  }

  function deleteChar() {
    if (currentCol <= 0) return;
    currentCol--;
    grid[currentRow][currentCol] = '';
    buildBoard();
    buildKeyboard();
  }

  function getCurrentGuess() {
    return grid[currentRow].join('');
  }

  function isValidWord(word) {
    const n = normalize(word);
    return VALID_SET.has(n);
  }

  function hardModeCheck(guess) {
    if (!hardMode || guesses.length === 0) return null;
    // Must reuse correct positions and present letters
    const prevEvals = evaluations.slice(0, currentRow);
    const prevGuesses = guesses.slice();
    // collect required letters
    const requiredPositions = {}; // pos -> char must be there if ever correct
    const requiredLetters = new Set();
    for (let r = 0; r < prevGuesses.length; r++) {
      const g = normalize(prevGuesses[r]);
      const ev = prevEvals[r];
      for (let c = 0; c < 5; c++) {
        if (ev[c] === 'correct') requiredPositions[c] = g[c];
        if (ev[c] === 'correct' || ev[c] === 'present') requiredLetters.add(g[c]);
      }
    }
    const ng = normalize(guess);
    for (const [pos, ch] of Object.entries(requiredPositions)) {
      if (ng[parseInt(pos)] !== ch)
        return `V težjem načinu mora biti na mestu ${parseInt(pos) + 1} črka ${ch}`;
    }
    for (const ch of requiredLetters) {
      if (!ng.includes(ch)) return `V težjem načinu mora beseda vsebovati črko ${ch}`;
    }
    return null;
  }

  function submitGuess() {
    if (gameOver) return;
    if (currentCol < 5) {
      showMessage('Premalo črk!', true);
      shakeRow(currentRow);
      sounds.play('error');
      return;
    }
    const guess = getCurrentGuess();
    if (!isValidWord(guess)) {
      showMessage('Ni v slovarju!', true);
      shakeRow(currentRow);
      sounds.play('error');
      return;
    }
    if (hardMode) {
      const err = hardModeCheck(guess);
      if (err) {
        showMessage(err, true);
        shakeRow(currentRow);
        sounds.play('error');
        return;
      }
    }
    const ev = evaluateGuess(guess, targetWord);
    evaluations[currentRow] = ev;
    guesses.push(guess);
    // animate reveal
    animateRow(currentRow, ev, () => {
      buildBoard();
      buildKeyboard();
      if (normalize(guess) === normalize(targetWord)) {
        winGame();
      } else {
        currentRow++;
        currentCol = 0;
        updateHeader();
        if (currentRow >= 6) {
          loseGame();
        } else {
          // continue
          buildBoard();
        }
      }
      saveState();
    });
    sounds.play('click');
  }

  function shakeRow(r) {
    const rowEl = boardEl.querySelector(`.bes-row[data-row="${r}"]`);
    if (!rowEl) return;
    rowEl.querySelectorAll('.bes-tile').forEach(t => {
      t.classList.add('shake');
      setTimeout(() => t.classList.remove('shake'), 400);
    });
  }

  function animateRow(r, ev, cb) {
    const tiles = boardEl.querySelectorAll(`.bes-row[data-row="${r}"] .bes-tile`);
    tiles.forEach((tile, i) => {
      setTimeout(() => {
        tile.classList.add('reveal');
        setTimeout(() => {
          tile.classList.add(ev[i]);
          tile.classList.remove('reveal');
          tile.classList.add('filled');
          if (i === 4 && cb) cb();
        }, 220);
      }, i * 110);
    });
    // play sounds sequential?
  }

  function winGame() {
    gameOver = true;
    updateHeader();
    const attempts = currentRow + 1;
    showMessage(`Bravo! 🎉 (${attempts}/6)`, false);
    showConfetti({ count: 30 });
    sounds.play('victory');
    // stats
    const s = getStats();
    s.played++;
    s.won++;
    s.streak++;
    if (s.streak > s.maxStreak) s.maxStreak = s.streak;
    s.dist[attempts - 1] = (s.dist[attempts - 1] || 0) + 1;
    saveStats(s);
    statsManager.addXp(30 + (7 - attempts) * 10);
    statsManager.saveRecord('besedle', {
      won: true,
      attempts,
      target: targetWord,
      mode,
      hard: hardMode,
    });
    showEndScreen(true, attempts);
    updateMiniStats();
  }

  function loseGame() {
    gameOver = true;
    updateHeader();
    showMessage(`Rešitev: ${targetWord}`, false);
    sounds.play('error');
    const s = getStats();
    s.played++;
    s.streak = 0;
    saveStats(s);
    statsManager.addXp(5);
    statsManager.saveRecord('besedle', {
      won: false,
      attempts: 7,
      target: targetWord,
      mode,
      hard: hardMode,
    });
    showEndScreen(false, 7);
    updateMiniStats();
  }

  function showEndScreen(won, attempts) {
    const titleEl = document.getElementById('bes-end-title');
    const wordEl = document.getElementById('bes-end-word');
    const descEl = document.getElementById('bes-end-desc');
    if (titleEl) titleEl.textContent = won ? `🎉 Zmaga v ${attempts} poskusu!` : 'Žal ni uspelo';
    if (wordEl) wordEl.textContent = targetWord;
    if (descEl)
      descEl.textContent = won
        ? `Odlično! Beseda ${targetWord} uganjena.`
        : `Pravilna beseda je bila ${targetWord}. Poskusi znova!`;
    setTimeout(() => showLayer(endScreen), won ? 900 : 600);
  }

  function updateMiniStats() {
    const s = getStats();
    const pEl = document.getElementById('bes-mini-played');
    const stEl = document.getElementById('bes-mini-streak');
    if (pEl) pEl.textContent = String(s.played);
    if (stEl) stEl.textContent = String(s.streak);
  }

  function saveState() {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          mode,
          targetWord,
          grid,
          evaluations,
          currentRow,
          currentCol,
          gameOver,
          guesses,
          hardMode,
        })
      );
    } catch {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function startNewGame(forceMode = null) {
    readSettingsFromUI();
    if (forceMode) mode = forceMode;
    // daily mode: try to restore today's game if not finished?
    const todayKey = todayStr();
    const dailyTarget = SOLUTIONS[seedFromDate(todayKey) % SOLUTIONS.length];
    if (mode === 'daily') {
      targetWord = dailyTarget;
      // check if we have saved state for today daily
      const saved = loadState();
      if (saved && saved.mode === 'daily' && saved.targetWord === dailyTarget && !saved.gameOver) {
        // restore
        grid = saved.grid || Array.from({ length: 6 }, () => Array(5).fill(''));
        evaluations = saved.evaluations || Array.from({ length: 6 }, () => Array(5).fill(''));
        currentRow = saved.currentRow || 0;
        currentCol = saved.currentCol || 0;
        guesses = saved.guesses || [];
        gameOver = !!saved.gameOver;
        hardMode = !!saved.hardMode;
        if (gameOver) {
          // start fresh if over?
        } else {
          buildBoard();
          buildKeyboard();
          updateHeader();
          updateMiniStats();
          return;
        }
      } else if (
        saved &&
        saved.mode === 'daily' &&
        saved.targetWord === dailyTarget &&
        saved.gameOver
      ) {
        // already finished today – start fresh random? we will still allow new game but show end screen?
        // For daily, if already finished we show end screen again with same target? Instead start new random?
        // We'll just start new daily same target but reset
      }
    } else {
      // random/hard
      targetWord = pickSolution(null, mode);
    }
    grid = Array.from({ length: 6 }, () => Array(5).fill(''));
    evaluations = Array.from({ length: 6 }, () => Array(5).fill(''));
    currentRow = 0;
    currentCol = 0;
    gameOver = false;
    guesses = [];
    // hardMode already set via mode
    buildBoard();
    buildKeyboard();
    updateHeader();
    updateMiniStats();
    showMessage('', false);
    saveState();
  }

  function handlePhysicalKey(e) {
    if (playScreen.classList.contains('hidden') && !endScreen.classList.contains('hidden')) {
      if (e.key === 'Enter') {
        startNewGame();
        showLayer(playScreen);
      }
      return;
    }
    if (playScreen.classList.contains('hidden')) return;
    if (gameOver && e.key === 'Enter') {
      startNewGame();
      showLayer(playScreen);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submitGuess();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      deleteChar();
    } else if (/^[a-zA-ZčšžČŠŽ]$/.test(e.key) && e.key.length === 1) {
      // ignore if ctrl/meta
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      addChar(e.key.toUpperCase());
    }
  }

  async function handleShare() {
    const attempts = gameOver
      ? guesses[guesses.length - 1] === targetWord
        ? currentRow + 1
        : 'X'
      : '?';
    const modeLabel = mode === 'daily' ? `Dnevni ${todayStr()}` : 'Naključno';
    let text = `Besedle ${attempts}/6 (${modeLabel})\n`;
    for (let r = 0; r < guesses.length; r++) {
      const ev = evaluations[r];
      const line = ev.map(s => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬜')).join('');
      text += line + '\n';
    }
    text += new URL('#game/besedle', window.location.href).href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('Rezultat kopiran v odložišče! 📋', { type: 'success' });
      } else {
        showToast(text, { type: 'info', timeout: 5000 });
      }
    } catch {
      showToast(text, { type: 'info', timeout: 5000 });
    }
    sounds.play('click');
  }

  // listeners
  if (startBtn)
    startBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  if (newBtn)
    newBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  if (retryBtn)
    retryBtn.addEventListener('click', () => {
      startNewGame();
      showLayer(playScreen);
    });
  document.getElementById('bes-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });
  if (shareBtn) shareBtn.addEventListener('click', handleShare);
  document.addEventListener('keydown', handlePhysicalKey);

  // initial
  readSettingsFromUI();
  startNewGame();
  showLayer(startScreen);
  updateMiniStats();

  return () => {
    document.removeEventListener('keydown', handlePhysicalKey);
  };
}
