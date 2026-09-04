// js/games/pattern-generators.js — Proceduralni generatorji vzorcev za neomejen content
import { mulberry32 } from '../utils/rng.js';

/**
 * Generira naključno piramido opeke
 * @param {number} seed - Seed za deterministično generiranje
 * @param {Object} options - { minBase: 3, maxBase: 6, minVal: 1, maxVal: 9 }
 * @returns {Object} { bottom, middle, top, prompt, answer }
 */
export function generatePyramid(seed, options = {}) {
  const rng = mulberry32(seed);
  const minBase = options.minBase || 3;
  const maxBase = options.maxBase || 6;
  const minVal = options.minVal || 1;
  const maxVal = options.maxVal || 9;

  const baseSize = minBase + Math.floor(rng() * (maxBase - minBase + 1));
  const bottom = Array.from(
    { length: baseSize },
    () => minVal + Math.floor(rng() * (maxVal - minVal + 1))
  );

  // Izračunaj srednji nivo
  const middle = [];
  for (let i = 0; i < baseSize - 1; i++) {
    middle.push(bottom[i] + bottom[i + 1]);
  }

  // Izračunaj vrh
  let current = [...middle];
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length - 1; i++) {
      next.push(current[i] + current[i + 1]);
    }
    current = next;
  }
  const top = current[0];

  // Prikaži le prvi dve srednji opeki (če so več)
  const displayMiddle = middle.slice(0, 2).map((v, i) => (i === 0 ? v : null));

  return {
    bottom,
    middle: displayMiddle,
    top,
    prompt: 'Dopolni piramido. Katero število je na vrhu?',
    answer: String(top),
    answers: [String(top)],
  };
}

/**
 * Generira algebrski sistem dveh enačb
 * @param {number} seed
 * @returns {Object} { lines, answer, explanation }
 */
export function generateAlgebraSystem(seed) {
  const rng = mulberry32(seed);

  // Generiraj A in B tako, da sta cela števila
  const A = 1 + Math.floor(rng() * 10); // 1-10
  const B = 1 + Math.floor(rng() * 10); // 1-10

  const sum = A + B;
  const diff = Math.abs(A - B);
  const isDivisible = B !== 0 && A % B === 0;
  const quot = isDivisible ? A / B : A > B ? Math.floor(A / B) : Math.floor(B / A);

  const ops = ['+', '-', '/'];
  const op1 = ops[Math.floor(rng() * ops.length)];
  const op2 = ops[Math.floor(rng() * ops.length)];

  let line1, line2, targetLine, answer;

  if (op1 === '+') line1 = `A + B = ${sum}`;
  else if (op1 === '-') line1 = `A - B = ${diff}`;
  else line1 = `A / B = ${quot}`;

  if (op2 === '+') line2 = `A + B = ${sum}`;
  else if (op2 === '-') line2 = `A - B = ${diff}`;
  else line2 = `A / B = ${quot}`;

  // Target: A op B = ?
  const targetOp = ops[Math.floor(rng() * ops.length)];
  if (targetOp === '+') answer = sum;
  else if (targetOp === '-') answer = diff;
  else answer = quot;

  targetLine = `A ${targetOp} B = ?`;

  // Generiraj hint
  const hints = [
    `Začni s seštevanjem/odštevanjem enačb, da izločiš eno spremenljivko.`,
    `Ko imaš vrednost ene spremenljivke, vstavi v drugo enačbo.`,
    `Izračunaj zahtevano operacijo.`,
  ];

  return {
    lines: [line1, line2, targetLine],
    answer: String(answer),
    answers: [String(answer)],
    hints,
    explanation: `A = ${A}, B = ${B}. ${line1}, ${line2}. Torej A ${targetOp} B = ${answer}.`,
  };
}

/**
 * Generira koleso s kratki (wheel spokes)
 * @param {number} seed
 * @returns {Object} { pairs, answer }
 */
export function generateWheelSpokes(seed) {
  const rng = mulberry32(seed);
  const pairCount = 3 + Math.floor(rng() * 3); // 3-5 parov
  const targetSum = 10 + Math.floor(rng() * 30); // 10-39

  const pairs = [];
  for (let i = 0; i < pairCount; i++) {
    const top = 1 + Math.floor(rng() * 15);
    const bottom = targetSum - top;
    pairs.push({ top, bottom });
  }

  // Skrij eno vrednost
  const hideIndex = Math.floor(rng() * pairCount);
  const hideTop = rng() < 0.5;
  const answer = hideTop ? pairs[hideIndex].top : pairs[hideIndex].bottom;

  const displayPairs = pairs.map((p, i) => {
    if (i === hideIndex) {
      return {
        top: hideTop ? '?' : p.top,
        bottom: hideTop ? p.bottom : '?',
      };
    }
    return p;
  });

  return {
    pairs: displayPairs,
    answer: String(answer),
    answers: [String(answer)],
    hints: [
      `Vsi pari imajo enako vsoto.`,
      `Seštej znana števila v enem popolnem paru.`,
      `Izračunaj manjkajoče število.`,
    ],
    explanation: `Vsota vsakega para je ${targetSum}. Manjkajoče število je ${answer}.`,
  };
}

/**
 * Generira domino zaporedje
 * @param {number} seed
 * @returns {Object} { tiles, answer }
 */
export function generateDomino(seed) {
  const rng = mulberry32(seed);
  const tileCount = 4 + Math.floor(rng() * 3); // 4-6 ploščić

  // Generiraj začetno ploščico
  let prevTop = 1 + Math.floor(rng() * 6);
  let prevBottom = 1 + Math.floor(rng() * 6);

  const tiles = [{ top: prevTop, bottom: prevBottom }];

  for (let i = 1; i < tileCount; i++) {
    // Domino pravilo: spodnje prejšnje = zgornje naslednje
    const nextTop = prevBottom;
    const nextBottom = 1 + Math.floor(rng() * 6);
    tiles.push({ top: nextTop, bottom: nextBottom });
    prevTop = nextTop;
    prevBottom = nextBottom;
  }

  // Skrij zadnjo spodnjo vrednost
  const lastTile = tiles[tileCount - 1];
  const answer = String(lastTile.bottom);
  lastTile.bottom = '?';

  return {
    tiles,
    answer,
    answers: [answer],
    hints: [
      `V domino zaporedju se spodnja vrednost ujema z zgornjo naslednje ploščice.`,
      `Poglej predzadnjo ploščico.`,
      `Zadnja zgornja vrednost je enaka predzadnji spodnji.`,
    ],
    explanation: `Domino pravilo: spodnja vrednost ploščice = zgornja vrednost naslednje ploščice. Zadnja zgornja je ${lastTile.top}, torej spodnja = ${answer}.`,
  };
}

/**
 * Glavna funkcija za generiranje vzorca po tipu
 */
export function generatePattern(type, seed, options = {}) {
  switch (type) {
    case 'pyramid_bricks':
      return { ...generatePyramid(seed, options), type: 'pyramid_bricks' };
    case 'system_algebra':
    case 'operator_rule':
      return { ...generateAlgebraSystem(seed), type: 'system_algebra' };
    case 'wheel_spokes':
      return { ...generateWheelSpokes(seed), type: 'wheel_spokes' };
    case 'domino_tiles':
      return { ...generateDomino(seed), type: 'domino_tiles' };
    default:
      return null;
  }
}

/**
 * Generira batch vzorcev za "novi nivo" gumb
 */
export function generatePatternBatch(type, count, baseSeed) {
  return Array.from({ length: count }, (_, i) => generatePattern(type, baseSeed + i * 1000000));
}
