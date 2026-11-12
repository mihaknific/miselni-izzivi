// js/theme.js — tematske nastavitve in barvne utilitete
import { Settings } from './store.js';

export const DEFAULT_SETTINGS = {
  fontSize: '16px',
  bgColor: '#FEFCE8',
  surfaceColor: '#ffffff',
  borderColor: '#000000',
  textColor: '#000000',
  headingColor: '#000000',
  mutedColor: '#475569',
  primaryColor: '#FACC15',
  primaryText: '#000000',
};
export const THEME_PRESETS = {
  default: {
    bg: '#FEFCE8',
    surface: '#ffffff',
    border: '#000000',
    text: '#000000',
    heading: '#000000',
    muted: '#475569',
    primary: '#FACC15',
    ptext: '#000000',
  },
  zinc: {
    bg: '#ffffff',
    surface: '#fafafa',
    border: '#e4e4e7',
    text: '#09090b',
    heading: '#09090b',
    muted: '#71717a',
    primary: '#18181b',
    ptext: '#fafafa',
  },
  stone: {
    bg: '#fafaf9',
    surface: '#f5f5f4',
    border: '#d6d3d1',
    text: '#0c0a09',
    heading: '#0c0a09',
    muted: '#78716c',
    primary: '#44403c',
    ptext: '#fafaf9',
  },
  blue: {
    bg: '#eff6ff',
    surface: '#ffffff',
    border: '#bfdbfe',
    text: '#1e3a5f',
    heading: '#1e3a5f',
    muted: '#64748b',
    primary: '#2563eb',
    ptext: '#ffffff',
  },
  green: {
    bg: '#f0fdf4',
    surface: '#ffffff',
    border: '#bbf7d0',
    text: '#14532d',
    heading: '#14532d',
    muted: '#4b5563',
    primary: '#16a34a',
    ptext: '#ffffff',
  },
  rose: {
    bg: '#fff1f2',
    surface: '#ffffff',
    border: '#fecdd3',
    text: '#4c0519',
    heading: '#4c0519',
    muted: '#71717a',
    primary: '#e11d48',
    ptext: '#ffffff',
  },
  dark: {
    bg: '#0f0f1a',
    surface: '#1a1a2e',
    border: '#2d2d44',
    text: '#e2e8f0',
    heading: '#f1f5f9',
    muted: '#94a3b8',
    primary: '#818cf8',
    ptext: '#0f0f1a',
  },
  neobrutalism: {
    bg: '#FEFCE8',
    surface: '#ffffff',
    border: '#000000',
    text: '#000000',
    heading: '#000000',
    muted: '#475569',
    primary: '#FACC15',
    ptext: '#000000',
  },
};

function hexToRgb(hex) {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '');
  if (cleaned.length === 3) {
    const r = cleaned[0];
    const g = cleaned[1];
    const b = cleaned[2];
    return [r, g, b].map(part => parseInt(part + part, 16)).join(', ');
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b].join(', ');
  }
  return '23, 23, 23';
}

function adjustHexColor(hex, amount) {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '');
  if (!/^[0-9a-fA-F]{3}$/.test(cleaned) && !/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return '#404040';
  }

  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map(part => part + part)
          .join('')
      : cleaned;

  const num = parseInt(expanded, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${[r, g, b].map(part => part.toString(16).padStart(2, '0')).join('')}`;
}

export async function applyCustomSettings() {
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const [
    fontSize,
    bgColor,
    surfaceColor,
    borderColor,
    textColor,
    headingColor,
    mutedColor,
    primaryColor,
    primaryText,
  ] = await Promise.all([
    Settings.get('fontSize', DEFAULT_SETTINGS.fontSize),
    Settings.get('bgColor', DEFAULT_SETTINGS.bgColor),
    Settings.get('surfaceColor', DEFAULT_SETTINGS.surfaceColor),
    Settings.get('borderColor', DEFAULT_SETTINGS.borderColor),
    Settings.get('textColor', DEFAULT_SETTINGS.textColor),
    Settings.get('headingColor', DEFAULT_SETTINGS.headingColor),
    Settings.get('mutedColor', DEFAULT_SETTINGS.mutedColor),
    Settings.get('primaryColor', DEFAULT_SETTINGS.primaryColor),
    Settings.get('primaryText', DEFAULT_SETTINGS.primaryText),
  ]);

  root.style.setProperty('--custom-font-size', fontSize);
  root.style.setProperty('--custom-bg', bgColor);
  root.style.setProperty('--color-bg', bgColor);
  root.style.setProperty('--color-bg-rgb', hexToRgb(bgColor));
  root.style.setProperty('--color-surface', surfaceColor);
  root.style.setProperty('--color-border', borderColor);
  root.style.setProperty('--custom-text', textColor);
  root.style.setProperty('--color-text', textColor);
  root.style.setProperty('--color-text-main', textColor);
  root.style.setProperty('--custom-heading', headingColor);
  root.style.setProperty('--custom-muted', mutedColor);
  root.style.setProperty('--color-text-muted', mutedColor);
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-primary-hover', adjustHexColor(primaryColor, -18));
  const primaryRgb = hexToRgb(primaryColor);
  root.style.setProperty('--color-primary-rgb', primaryRgb);
  root.style.setProperty('--custom-primary-text', primaryText);

  root.style.setProperty('--color-scrollbar-thumb', `rgba(${primaryRgb}, 0.38)`);
  root.style.setProperty('--color-scrollbar-thumb-hover', primaryColor);

  if (themeMeta) {
    themeMeta.setAttribute('content', bgColor);
  }
}
