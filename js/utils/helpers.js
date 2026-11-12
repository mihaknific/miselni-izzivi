// js/utils/helpers.js — skupni pomočniki širom iger (DRY; prej podvojeni v 6 igrah)

/**
 * Datum kot "YYYY-MM-DD" po LOKALNI uri — za dnevne izzive.
 * (toISOString bi bil UTC: dnevni izziv bi pri uporabniku začasovno prestopil
 * polnoč za več ur, glede na to, kaj vidi.)
 * @param {Date} [d=new Date()] izbirni datum (npr. za "včeraj")
 * @returns {string} npr. "2026-11-05"
 */
export function todayKey(d = new Date()) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/**
 * Odstrani diakritiko in velike črke za primerjanje besed.
 * @param {string} word
 * @returns {string}
 */
export function normalizeWord(word) {
  return String(word || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/**
 * Preprost deterministični hash niza za dnevne izbire (mulberry-friendly).
 * @param {string} str
 * @returns {number} 32-bit celo število
 */
export function dateSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Sformatemente sekunde kot "MM:SS".
 * @param {number} s sekunde
 * @returns {string}
 */
export function formatTime(s) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
