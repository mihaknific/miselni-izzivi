// js/game-registry.js — enoten register iger (en vir resnice).
// Prej se enaki podatki vzporedno vzdržali v ≥4 tabelah:
//   game-loaders.js (loaderji), switch v main.js (render), initMap v main.js (init),
//   CARD_BEST v ui.js (rekordi kartic), GAME_META v stats.js (statistika).
// Dodajanje igre zdaj zahteva samo: datoteko v js/games/ + en vnos tukaj.

/**
 * @typedef {Object} GameEntry
 * @property {string} id
 * @property {() => Promise<Object>} loader dinamični import modula
 * @property {(mod: Object) => string} render izris HTML
 * @property {(mod: Object, subParam?: string|null) => (Function|undefined)} [init]
 *   inicializacija igre; vrača cleanup ali undefined
 * @property {{metric: string, max: boolean, fmt: (v: number) => string}} [card]
 *   metrika rekorda za kartico na seznamu iger
 * @property {{name: string, metric: string, label: string, order: 'min'|'max'}} [stats]
 *   metrika za statistiko in grafikone
 */

/** @type {GameEntry[]} */
export const GAMES = [
  {
    id: 'spomin',
    loader: () => import('./games/spomin.js'),
    render: mod => mod.renderSpomin(),
    init: mod => mod.initSpomin(),
    card: { metric: 'moves', max: false, fmt: v => `${v} potez` },
    stats: { name: 'Spomin', metric: 'moves', label: 'Poteze', order: 'min' },
  },
  {
    id: 'racunanje',
    loader: () => import('./games/racunanje.js'),
    render: mod => mod.renderRacunanje(),
    init: mod => mod.initRacunanje(),
    card: { metric: 'score', max: true, fmt: v => `${v} točk` },
    stats: { name: 'Hitro računanje', metric: 'score', label: 'Točke', order: 'max' },
  },
  {
    id: 'stroop',
    loader: () => import('./games/stroop.js'),
    render: mod => mod.renderStroop(),
    init: mod => mod.initStroop(),
    card: { metric: 'score', max: true, fmt: v => `${v} točk` },
    stats: { name: 'Stroop test', metric: 'score', label: 'Točke', order: 'max' },
  },
  {
    id: 'reakcija',
    loader: () => import('./games/reakcija.js'),
    render: mod => mod.renderReakcija('classic'),
    init: mod => mod.initReakcija('classic'),
    card: { metric: 'ms', max: false, fmt: v => `pod ${v} ms` },
    stats: { name: 'Reakcijski čas', metric: 'ms', label: 'ms', order: 'min' },
  },
  {
    id: 'gonogo',
    loader: () => import('./games/reakcija.js'),
    render: mod => mod.renderReakcija('gonogo'),
    init: mod => mod.initReakcija('gonogo'),
  },
  {
    id: 'zaporedje',
    loader: () => import('./games/zaporedje.js'),
    render: mod => mod.renderZaporedje(),
    init: mod => mod.initZaporedje(),
    card: { metric: 'level', max: true, fmt: v => `${v}. raven` },
    stats: { name: 'Zaporedje števil', metric: 'level', label: 'Raven', order: 'max' },
  },
  {
    id: 'abeceda',
    loader: () => import('./games/abeceda.js'),
    render: mod => mod.renderAbeceda(),
    init: mod => mod.initAbeceda(),
    card: { metric: 'score', max: true, fmt: v => `${v} točk` },
    stats: { name: 'Abeceda ↔ Številke', metric: 'score', label: 'Točke', order: 'max' },
  },
  {
    id: 'kvadriranje',
    loader: () => import('./games/kvadriranje.js'),
    render: mod => mod.renderKvadriranje(),
    init: mod => mod.initKvadriranje(),
    card: { metric: 'score', max: true, fmt: v => `${v} točk` },
    stats: { name: 'Kvadriranje', metric: 'score', label: 'Točke', order: 'max' },
  },
  {
    id: 'major',
    loader: () => import('./games/major.js'),
    render: mod => mod.renderMajor(),
    init: mod => mod.initMajor(),
    card: { metric: 'score', max: true, fmt: v => `${v} točk` },
    stats: { name: 'Major sistem', metric: 'score', label: 'Točke', order: 'max' },
  },
  {
    id: 'corsi',
    loader: () => import('./games/corsi.js'),
    render: mod => mod.renderCorsi(),
    init: mod => mod.initCorsi(),
    card: { metric: 'span', max: true, fmt: v => `razpon ${v}` },
    stats: { name: 'Prostorski spomin (Corsi)', metric: 'span', label: 'Polj', order: 'max' },
  },
  {
    id: 'search',
    loader: () => import('./games/search.js'),
    render: mod => mod.renderSearch(),
    init: mod => mod.initSearch(),
    card: { metric: 'avgMs', max: false, fmt: v => `pod ${v} ms` },
    stats: { name: 'Iskanje tujka', metric: 'avgMs', label: 'ms', order: 'min' },
  },
  {
    id: 'switch',
    loader: () => import('./games/switch.js'),
    render: mod => mod.renderSwitch(),
    init: mod => mod.initSwitch(),
    card: { metric: 'accuracy', max: true, fmt: v => `${v} %` },
    stats: { name: 'Preklop pozornosti', metric: 'accuracy', label: '%', order: 'max' },
  },
  {
    id: 'dualnback',
    loader: () => import('./games/dualnback.js'),
    render: mod => mod.renderDualNBack(),
    init: mod => mod.initDualNBack(),
    card: { metric: 'accuracy', max: true, fmt: v => `${v} %` },
    stats: { name: 'Dual N-Back', metric: 'accuracy', label: '%', order: 'max' },
  },
  {
    id: 'words',
    loader: () => import('./games/words.js'),
    render: mod => mod.renderWords(),
    init: mod => mod.initWords(),
    stats: { name: 'Besedna tekočnost', metric: 'score', label: 'Točke', order: 'max' },
  },
  {
    id: 'uganke',
    loader: () => import('./games/uganke.js'),
    render: mod => mod.renderUganke(),
    init: (mod, subParam) => mod.initUganke(subParam),
    card: { metric: 'solved', max: true, fmt: v => `${v} rešenih` },
    stats: { name: 'Uganke', metric: 'solved', label: 'Rešenih', order: 'max' },
  },
  {
    id: 'vzorci',
    loader: () => import('./games/vzorci.js'),
    render: mod => mod.renderVzorci(),
    init: (mod, subParam) => mod.initVzorci(subParam),
    card: { metric: 'solved', max: true, fmt: v => `${v} rešenih` },
    stats: { name: 'Vzorci', metric: 'solved', label: 'Rešenih', order: 'max' },
  },
  {
    id: 'trail',
    loader: () => import('./games/trail.js'),
    render: mod => mod.renderTrail(),
    init: mod => mod.initTrail(),
    card: { metric: 'time', max: false, fmt: v => `${v} s` },
    stats: { name: 'Barvni labirint', metric: 'time', label: 's', order: 'min' },
  },
  {
    id: '2048',
    loader: () => import('./games/2048.js'),
    render: mod => mod.render2048(),
    init: mod => mod.init2048(),
    card: { metric: 'score', max: true, fmt: v => `${v} točk` },
    stats: { name: '2048 – Združi ploščice', metric: 'score', label: 'Točke', order: 'max' },
  },
  {
    id: 'besedle',
    loader: () => import('./games/besedle.js'),
    render: mod => mod.renderBesedle(),
    init: mod => mod.initBesedle(),
    card: { metric: 'attempts', max: false, fmt: v => `v ${v} poskusih` },
    stats: { name: 'Besedle', metric: 'attempts', label: 'Poskusov', order: 'min' },
  },
  {
    id: 'povezave',
    loader: () => import('./games/povezave.js'),
    render: mod => mod.renderPovezave(),
    init: mod => mod.initPovezave(),
    card: { metric: 'score', max: true, fmt: v => `${v} točk` },
    stats: { name: 'Povezave', metric: 'score', label: 'Točk', order: 'max' },
  },
  {
    id: 'besedolov',
    loader: () => import('./games/besedolov.js'),
    render: mod => mod.renderBesedolov(),
    init: mod => mod.initBesedolov(),
    card: { metric: 'score', max: true, fmt: v => `${v} točk` },
    stats: { name: 'Besedolov', metric: 'score', label: 'Točk', order: 'max' },
  },
  {
    id: 'sudoku',
    loader: () => import('./games/sudoku.js'),
    render: mod => mod.renderSudoku(),
    init: mod => mod.initSudoku(),
    card: { metric: 'time', max: false, fmt: v => `${v} s` },
    stats: { name: 'Sudoku', metric: 'time', label: 's', order: 'min' },
  },
  {
    id: 'minolovec',
    loader: () => import('./games/minolovec.js'),
    render: mod => mod.renderMinolovec(),
    init: mod => mod.initMinolovec(),
    card: { metric: 'time', max: false, fmt: v => `${v} s` },
    stats: { name: 'Minolovec', metric: 'time', label: 's', order: 'min' },
  },
  {
    id: 'nonogram',
    loader: () => import('./games/nonogram.js'),
    render: mod => mod.renderNonogram(),
    init: mod => mod.initNonogram(),
    card: { metric: 'time', max: false, fmt: v => `${v} s` },
    stats: { name: 'Nonogram', metric: 'time', label: 's', order: 'min' },
  },
  {
    id: 'daily',
    loader: () => import('./games/daily-challenge.js'),
    render: mod => mod.renderDailyChallenge(),
    init: mod => mod.initDailyChallenge(),
  },
];

/** Vrne vnos registra za igro, ali null. */
export function getGameEntry(id) {
  return GAMES.find(g => g.id === id) || null;
}

/** Vrne loader modula za igro, ali null. */
export function getGameLoader(id) {
  return getGameEntry(id)?.loader || null;
}

/** Rekordna metrika za kartico igre, ali null. */
export function getGameCard(id) {
  return getGameEntry(id)?.card || null;
}

/** Preslikava id → stats metapodatki (za stats.js). */
export const GAME_STATS_META = Object.fromEntries(
  GAMES.filter(g => g.stats).map(g => [g.id, g.stats])
);
