// js/utils/rng.js — Deterministični generator naključnih števil (Mulberry32)
/**
 * Mulberry32 PRNG - hitro, dobro razpršeno, deterministično
 * @param {number} seed - 32-bit seed
 * @returns {Function} generator funkcija, ki vrača [0, 1)
 */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generira seed iz stringa (npr. datum, uporabniško ime)
 * @param {string} str
 * @returns {number} 32-bit hash
 */
export function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generira seed iz datuma (YYYY-MM-DD)
 * @param {string} dateStr - ISO date string
 * @returns {number}
 */
export function dateToSeed(dateStr) {
  return stringToSeed(dateStr);
}

/**
 * Shuffle array using Fisher-Yates z danim RNG
 * @param {Array} array
 * @param {Function} rng - generator funkcija
 * @returns {Array} shuffled copy
 */
export function shuffle(array, rng = Math.random) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Weighted random choice
 * @param {Array<{weight: number, value: any}>} items
 * @param {Function} rng
 * @returns {any}
 */
export function weightedChoice(items, rng = Math.random) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = rng() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

/**
 * Random integer in range [min, max]
 */
export function randomInt(min, max, rng = Math.random) {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Random float in range [min, max)
 */
export function randomFloat(min, max, rng = Math.random) {
  return min + rng() * (max - min);
}

/**
 * Normal distribution (Box-Muller transform)
 * @param {number} mean
 * @param {number} stdDev
 * @param {Function} rng
 * @returns {number}
 */
export function randomNormal(mean = 0, stdDev = 1, rng = Math.random) {
  let u = 0,
    v = 0;
  while (u === 0) u = rng(); // Avoid log(0)
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}
