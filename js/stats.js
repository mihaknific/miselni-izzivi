// js/stats.js — Upravljanje statistike in prikaz rezultatov (ES6 modul)

const STORAGE_KEY = 'kognitivni_rekordi';

export const statsManager = {
  saveRecord(gameId, scoreData) {
    try {
      const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!records[gameId]) records[gameId] = [];

      scoreData.date = new Date().toISOString().split('T')[0];
      records[gameId].push(scoreData);

      // Ohrani le zadnjih 50 vnosov
      if (records[gameId].length > 50) records[gameId].shift();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Shranjevanje statistike ni uspelo:', e);
    }
  },

  getRecords(gameId) {
    try {
      const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return records[gameId] || [];
    } catch {
      return [];
    }
  },

  getAllRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  getBest(gameId, metric, maximize = true) {
    const gameRecords = this.getRecords(gameId);
    if (gameRecords.length === 0) return null;
    return gameRecords.reduce((best, cur) => {
      if (maximize) return cur[metric] > best[metric] ? cur : best;
      return cur[metric] < best[metric] ? cur : best;
    });
  },

  getGamificationStats() {
    try {
      const stats = JSON.parse(localStorage.getItem('kognitivni_gamification') || '{}');
      return {
        xp: stats.xp || 0,
        level: Math.floor(Math.sqrt((stats.xp || 0) / 100)) + 1,
        streak: stats.streak || 0,
        lastPlayedDate: stats.lastPlayedDate || null,
      };
    } catch {
      return { xp: 0, level: 1, streak: 0, lastPlayedDate: null };
    }
  },

  saveSession(gameId, primaryValue, extraData = {}) {
    // Združljivost z uganke.js/vzorci.js ki kličejo saveSession(gameId, count, {solved, xp})
    try {
      const payload = { ...extraData };
      if (primaryValue != null && payload.solved == null && payload.score == null) {
        payload.solved = primaryValue;
      }
      this.saveRecord(gameId, payload);
    } catch (e) {
      console.error('saveSession ni uspel:', e);
    }
  },

  addXp(amount) {
    try {
      const stats = this.getGamificationStats();
      const today = new Date().toISOString().split('T')[0];

      // Streak logic
      if (stats.lastPlayedDate !== today) {
        if (stats.lastPlayedDate) {
          const lastDate = new Date(stats.lastPlayedDate);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate - lastDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            stats.streak += 1;
          } else {
            stats.streak = 1;
          }
        } else {
          stats.streak = 1;
        }
        stats.lastPlayedDate = today;
      }

      stats.xp += amount;
      stats.level = Math.floor(Math.sqrt(stats.xp / 100)) + 1;

      localStorage.setItem(
        'kognitivni_gamification',
        JSON.stringify({
          xp: stats.xp,
          streak: stats.streak,
          lastPlayedDate: stats.lastPlayedDate,
        })
      );

      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('xp-updated', { detail: stats }));
    } catch (e) {
      console.error('Shranjevanje XP ni uspelo:', e);
    }
  },
};

/**
 * Vrne najboljše zapise združene po poljih iz groupKeys.
 */
export function getBestGrouped(gameId, metric, groupKeys = [], maximize = true) {
  const records = statsManager.getRecords(gameId);
  if (!records || records.length === 0) return {};

  const groups = {};

  for (const rec of records) {
    const keyObj = {};
    for (const k of groupKeys) keyObj[k] = rec[k] ?? null;
    const groupKey = JSON.stringify(keyObj);

    if (!groups[groupKey]) groups[groupKey] = rec;
    else {
      const curBest = groups[groupKey];
      if (maximize) {
        if ((rec[metric] ?? -Infinity) > (curBest[metric] ?? -Infinity)) groups[groupKey] = rec;
      } else {
        if ((rec[metric] ?? Infinity) < (curBest[metric] ?? Infinity)) groups[groupKey] = rec;
      }
    }
  }

  return groups;
}

// Opis iger za statistiko
const GAME_META = {
  spomin: { name: 'Spomin', metric: 'moves', label: 'Poteze', order: 'min' },
  racunanje: { name: 'Hitro računanje', metric: 'score', label: 'Točke', order: 'max' },
  stroop: { name: 'Stroop test', metric: 'score', label: 'Točke', order: 'max' },
  reakcija: { name: 'Reakcijski čas', metric: 'ms', label: 'ms', order: 'min' },
  zaporedje: { name: 'Zaporedje števil', metric: 'level', label: 'Raven', order: 'max' },
  corsi: { name: 'Prostorski spomin (Corsi)', metric: 'span', label: 'Polj', order: 'max' },
  search: { name: 'Iskanje tujka', metric: 'avgMs', label: 'ms', order: 'min' },
  switch: { name: 'Preklop pozornosti', metric: 'accuracy', label: '%', order: 'max' },
  dualnback: { name: 'Dual N-Back', metric: 'accuracy', label: '%', order: 'max' },
  words: { name: 'Besedna fluentnost', metric: 'score', label: 'Točke', order: 'max' },
  abeceda: { name: 'Abeceda ↔ Številke', metric: 'score', label: 'Točke', order: 'max' },
  kvadriranje: { name: 'Kvadriranje', metric: 'score', label: 'Točke', order: 'max' },
  major: { name: 'Major Sistem', metric: 'score', label: 'Točke', order: 'max' },
  uganke: { name: 'Uganke', metric: 'solved', label: 'Rešenih', order: 'max' },
  vzorci: { name: 'Vzorci', metric: 'solved', label: 'Rešenih', order: 'max' },
  trail: { name: 'Barvni Labirint', metric: 'time', label: 's', order: 'min' },
  2048: { name: '2048 – Združi ploščice', metric: 'score', label: 'Točke', order: 'max' },
  besedle: { name: 'Besedle', metric: 'attempts', label: 'Poskusov', order: 'min' },
  povezave: { name: 'Povezave', metric: 'score', label: 'Točk', order: 'max' },
  besedolov: { name: 'Besedolov', metric: 'score', label: 'Točk', order: 'max' },
  sudoku: { name: 'Sudoku', metric: 'time', label: 's', order: 'min' },
  minolovec: { name: 'Minolovec', metric: 'time', label: 's', order: 'min' },
  nonogram: { name: 'Nonogram', metric: 'time', label: 's', order: 'min' },
};

function formatLabelParts(parsed) {
  return Object.entries(parsed)
    .map(([key, value]) => {
      if (key === 'difficulty' || key === 'diff') {
        const levelStr = String(value || '').toLowerCase();
        let stars = '★★☆';
        let tone = 'difficulty-medium';
        let label = translateValue('difficulty', value);

        if (
          levelStr.includes('hard') ||
          levelStr.includes('tež') ||
          levelStr.includes('3') ||
          levelStr.includes('high') ||
          levelStr.includes('expert')
        ) {
          stars = '★★★';
          tone = 'difficulty-hard';
        } else if (
          levelStr.includes('easy') ||
          levelStr.includes('lah') ||
          levelStr.includes('1') ||
          levelStr.includes('low')
        ) {
          stars = '★☆☆';
          tone = 'difficulty-easy';
        }

        return `<span class="stats-chip ${tone}">${stars} ${label}</span>`;
      }

      if (key === 'theme') {
        return `<span class="stats-chip stats-chip-neutral">Tema: ${translateValue('theme', value)}</span>`;
      }

      if (key === 'layout') {
        return `<span class="stats-chip stats-chip-neutral">Postavitev: ${translateValue('layout', value)}</span>`;
      }

      if (key === 'searchType') {
        return `<span class="stats-chip stats-chip-neutral">Tip iskanja: ${translateValue('searchType', value)}</span>`;
      }

      if (key === 'direction') {
        return `<span class="stats-chip stats-chip-neutral">Smer: ${translateValue('direction', value)}</span>`;
      }

      if (key === 'type') {
        return `<span class="stats-chip stats-chip-neutral">Način: ${translateValue('type', value)}</span>`;
      }

      if (key === 'mode') {
        return `<span class="stats-chip stats-chip-neutral">Način: ${translateValue('mode', value)}</span>`;
      }

      if (key === 'nVal') {
        return `<span class="stats-chip difficulty-medium">★ ${value}-Back</span>`;
      }

      if (key === 'gridSize') {
        return `<span class="stats-chip stats-chip-neutral">Mreža: ${value}×${value}</span>`;
      }

      if (key === 'rounds') {
        return `<span class="stats-chip stats-chip-neutral">Krogov: ${value}</span>`;
      }

      if (key === 'trials') {
        return `<span class="stats-chip stats-chip-neutral">Poskusov: ${value}</span>`;
      }

      if (key === 'duration') {
        return `<span class="stats-chip stats-chip-neutral">Trajanje: ${value} s</span>`;
      }

      if (key === 'speed') {
        return `<span class="stats-chip stats-chip-neutral">Hitrost: ${value} ms</span>`;
      }

      return `<span class="stats-chip stats-chip-neutral">${translateKey(key)}: ${translateValue(key, value)}</span>`;
    })
    .join('');
}

function translateKey(key) {
  const map = {
    difficulty: 'Težavnost',
    theme: 'Tema',
    type: 'Vrsta',
    mode: 'Način',
    diff: 'Težavnost',
    rounds: 'Krogov',
    trials: 'Poskusov',
    layout: 'Postavitev',
    direction: 'Smer',
    searchType: 'Tip iskanja',
    nVal: 'N-Back',
    gridSize: 'Mreža',
    duration: 'Trajanje',
    speed: 'Hitrost',
  };
  return map[key] || key;
}

function translateValue(key, value) {
  if (value == null || value === '') return '—';
  const str = String(value).trim().toLowerCase();
  const map = {
    difficulty: {
      easy: 'lahka',
      medium: 'srednja',
      hard: 'težka',
      expert: 'ekspert',
      1: 'lahka',
      2: 'srednja',
      3: 'težka',
    },
    direction: {
      forward: 'naprej',
      backward: 'vzvratno',
    },
    layout: {
      grid: 'mreža',
      irregular: 'asimetrična plošča',
    },
    searchType: {
      feature: 'enostavno (barva/oblika)',
      conjunction: 'kombinirano (barva+oblika)',
    },
    theme: {
      emojis: 'emodžiji',
      numbers: 'številke',
      words: 'besede',
      colors: 'barve',
    },
    mode: {
      easy: 'lahko',
      medium: 'srednje',
      hard: 'težko',
      normal: 'navadno',
    },
  };

  if (map[key] && map[key][str]) return map[key][str];
  return str;
}

const GROUP_KEYS = {
  spomin: ['difficulty', 'theme'],
  racunanje: ['mode', 'diff'],
  reakcija: ['type', 'trials'],
  zaporedje: ['startLength', 'displaySpeed'],
  stroop: ['rounds', 'colorCount'],
  corsi: ['layout', 'direction'],
  search: ['searchType', 'gridSize'],
  switch: ['trials'],
  dualnback: ['nVal', 'speed'],
  words: ['duration'],
  abeceda: ['lang', 'mode'],
  kvadriranje: ['mode'],
  major: ['lang', 'mode'],
  uganke: ['category'],
  vzorci: ['category'],
  trail: ['difficulty'],
  2048: ['size', 'target'],
  besedle: ['mode'],
  povezave: ['mode'],
  besedolov: ['mode'],
  sudoku: ['difficulty'],
  minolovec: ['difficulty'],
  nonogram: ['size'],
};

function drawXpChart(canvas, allRecords) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width,
    h = rect.height;
  ctx.clearRect(0, 0, w, h);

  // Zberi zadnjih 30 dni
  const DAYS_SHOWN = 30;
  const days = [];
  const counts = [];
  const today = new Date();
  for (let i = DAYS_SHOWN - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push(key.slice(5)); // MM-DD
    let c = 0;
    for (const recs of Object.values(allRecords)) {
      c += recs.filter(r => r.date === key).length;
    }
    counts.push(c);
  }
  const max = Math.max(1, ...counts);
  const pad = { l: 40, r: 24, t: 24, b: 36 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  // Smooth curve points (catmull-rom spline)
  const points = counts.map((c, i) => ({
    x: pad.l + (plotW * i) / (DAYS_SHOWN - 1),
    y: pad.t + plotH - (plotH * c) / max,
  }));

  // Subtle grid - horizontal lines only
  ctx.strokeStyle = 'rgba(148,163,184,0.08)';
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.t + (plotH * i) / gridLines;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
  }

  // Y-axis labels (right side, cleaner)
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px Outfit, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= gridLines; i++) {
    const val = Math.round(max * (1 - i / gridLines));
    const y = pad.t + (plotH * i) / gridLines + 3;
    ctx.fillText(val, pad.l - 8, y);
  }

  // Smooth area fill (gradient)
  const gradient = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
  gradient.addColorStop(0, 'rgba(99,102,241,0.12)');
  gradient.addColorStop(1, 'rgba(99,102,241,0.0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  // Catmull-Rom spline for smooth curve
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i > 0 ? i - 1 : 0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

    const tension = 0.4;
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.lineTo(points[points.length - 1].x, pad.t + plotH);
  ctx.lineTo(points[0].x, pad.t + plotH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Smooth line on top
  const primary =
    getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() ||
    '#6366f1';
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i > 0 ? i - 1 : 0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

    const tension = 0.4;
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.stroke();

  // Data points - only on hover or all with subtle style
  points.forEach((p, i) => {
    const isToday = i === points.length - 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, isToday ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isToday ? primary : '#fff';
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = isToday ? 3 : 2;
    ctx.stroke();
  });

  // X-axis labels - every 5th day + today
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px Outfit, sans-serif';
  ctx.textAlign = 'center';
  days.forEach((d, i) => {
    if (i % 5 === 0 || i === days.length - 1) {
      const x = pad.l + (plotW * i) / (DAYS_SHOWN - 1);
      ctx.fillText(d, x, h - 14);
    }
  });

  // Empty state
  if (counts.every(c => c === 0)) {
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.font = '13px Outfit, sans-serif';
    ctx.fillText('Že ni podatkov – igraj vsak dan', w / 2, h / 2);
  }
}

function drawSkillRadar(canvas, allRecords) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width,
    h = rect.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2,
    cy = h / 2,
    r = Math.min(w, h) * 0.38;

  const domains = [
    { key: 'spomin', label: 'Spomin', games: ['spomin', 'corsi'] },
    { key: 'pozornost', label: 'Pozornost', games: ['search', 'switch', 'stroop', 'trail'] },
    { key: 'hitrost', label: 'Hitrost', games: ['reakcija', 'zaporedje'] },
    {
      key: 'logika',
      label: 'Logika',
      games: [
        'racunanje',
        'vzorci',
        'uganke',
        'kvadriranje',
        'major',
        '2048',
        'sudoku',
        'minolovec',
        'nonogram',
      ],
    },
    {
      key: 'besede',
      label: 'Besede',
      games: ['words', 'abeceda', 'dualnback', 'besedle', 'povezave', 'besedolov'],
    },
  ];

  const values = domains.map(d => {
    let total = 0,
      cnt = 0;
    d.games.forEach(g => {
      const recs = allRecords[g] || [];
      if (recs.length) {
        total += Math.min(100, 20 + recs.length * 8);
        cnt++;
      }
    });
    return cnt ? total / cnt : 0;
  });

  // Subtle grid circles
  ctx.strokeStyle = 'rgba(148,163,184,0.06)';
  ctx.lineWidth = 1;
  for (let level = 1; level <= 4; level++) {
    const rr = (r * level) / 4;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Axes - subtle
  const primary =
    getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() ||
    '#6366f1';
  ctx.strokeStyle = 'rgba(148,163,184,0.12)';
  ctx.lineWidth = 1;
  domains.forEach((_, i) => {
    const a = (Math.PI * 2 * i) / domains.length - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  });

  // Data polygon - smooth fill
  ctx.beginPath();
  values.forEach((v, i) => {
    const a = (Math.PI * 2 * i) / domains.length - Math.PI / 2;
    const rr = (r * v) / 100;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();

  // Gradient fill
  const fillGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  fillGrad.addColorStop(0, 'rgba(99,102,241,0.18)');
  fillGrad.addColorStop(1, 'rgba(99,102,241,0.02)');
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // Outline
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots
  values.forEach((v, i) => {
    const a = (Math.PI * 2 * i) / domains.length - Math.PI / 2;
    const rr = (r * v) / 100;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = primary;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Labels - cleaner positioning
  ctx.fillStyle = '#334155';
  ctx.font = '500 12px Outfit, sans-serif';
  domains.forEach((d, i) => {
    const a = (Math.PI * 2 * i) / domains.length - Math.PI / 2;
    const labelR = r + 22;
    const x = cx + Math.cos(a) * labelR;
    const y = cy + Math.sin(a) * labelR + 4;
    ctx.textAlign = Math.cos(a) > 0.2 ? 'left' : Math.cos(a) < -0.2 ? 'right' : 'center';
    ctx.textBaseline = Math.sin(a) > 0.2 ? 'top' : Math.sin(a) < -0.2 ? 'bottom' : 'middle';
    ctx.fillText(d.label, x, y);
  });

  if (values.every(v => v === 0)) {
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText('Igraj različne kategorije', cx, cy + r + 28);
  }
}

/**
 * Izračuna trende za posamezno igro
 */
function analyzeGameTrends(records, metric, maximize) {
  if (records.length < 3)
    return { trend: 0, direction: 'neutral', message: 'Premalo podatkov za trend' };

  const recent = records
    .slice(-10)
    .map(r => r[metric])
    .filter(v => v != null);
  if (recent.length < 3)
    return { trend: 0, direction: 'neutral', message: 'Premalo podatkov za trend' };

  const n = recent.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = recent.reduce((a, b) => a + b, 0);
  const sumXY = recent.reduce((s, y, i) => s + i * y, 0);
  const sumXX = recent.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  const direction = slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable';
  let message = 'Stabilen';
  if (direction === 'improving') message = maximize ? '📈 Izboljšuje se' : '📉 Upada';
  else if (direction === 'declining') message = maximize ? '📉 Upada' : '📈 Izboljšuje se';
  else message = '➡️ Stabilen';

  return { trend: slope, direction, message };
}

/**
 * Izračuna percentil uporabnika
 */
function calculatePercentile(records, metric, maximize) {
  if (records.length === 0) return { percentile: null, message: 'Ni podatkov' };

  const best = maximize
    ? Math.max(...records.map(r => r[metric] || 0))
    : Math.min(...records.map(r => r[metric] || Infinity));

  const scores = records.map(r => r[metric]).filter(v => v != null);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const std = Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length);

  const z = (best - mean) / (std || 1);
  let percentile = 50;
  if (z > 2) percentile = 98;
  else if (z > 1) percentile = 84;
  else if (z > 0.5) percentile = 69;
  else if (z > -0.5) percentile = 31;
  else if (z > -1) percentile = 16;
  else if (z > -2) percentile = 2;
  else percentile = 1;

  return {
    percentile,
    best,
    mean: Math.round(mean),
    message: `Bolje kot ~${percentile}% uporabnikov`,
  };
}

/**
 * Odkrije slabosti (igre, kjer uporabnik najslabše uspeva)
 */
function detectWeaknesses(allRecords) {
  const weaknesses = [];

  for (const [id, meta] of Object.entries(GAME_META)) {
    const records = allRecords[id] || [];
    if (records.length < 3) continue;

    const percentile = calculatePercentile(records, meta.metric, meta.order === 'max');
    if (percentile.percentile !== null && percentile.percentile < 30) {
      weaknesses.push({
        game: meta.name,
        gameId: id,
        percentile: percentile.percentile,
        metric: meta.label,
        message: `Tvoja ${meta.label.toLowerCase()} je nižja kot pri ${100 - percentile.percentile}% drugih`,
      });
    }
  }

  weaknesses.sort((a, b) => a.percentile - b.percentile);
  return weaknesses.slice(0, 3);
}

/**
 * Generira Insights sekcijo
 */
function generateInsights(allRecords) {
  const weaknesses = detectWeaknesses(allRecords);
  const insights = [];

  weaknesses.forEach(w => {
    insights.push({
      type: 'weakness',
      icon: '🎯',
      title: `Poudarek na: ${w.game}`,
      message: w.message,
      action: `Igraj ${w.game}`,
      gameId: w.gameId,
    });
  });

  const gamification = statsManager.getGamificationStats();
  if (gamification.streak > 0) {
    insights.push({
      type: 'streak',
      icon: '🔥',
      title: `Streak: ${gamification.streak} dni`,
      message:
        gamification.streak >= 7
          ? 'Odlično deluješ!'
          : `Še ${7 - gamification.streak} dni do tedenskega bonusa.`,
      action: 'Nadaljuj niz',
    });
  }

  const playedTypes = new Set();
  for (const [id, recs] of Object.entries(allRecords)) {
    if (recs.length > 0) playedTypes.add(id);
  }
  if (playedTypes.size < 5) {
    insights.push({
      type: 'variety',
      icon: '🌈',
      title: 'Poskusi nove igre',
      message: `Odigral si ${playedTypes.size} vrst iger. Poskusi še ${5 - playedTypes.size} za boljši profil.`,
      action: 'Oglej si vse igre',
    });
  }

  const today = new Date().toISOString().split('T')[0];
  let playedToday = false;
  for (const recs of Object.values(allRecords)) {
    if (recs.some(r => r.date === today)) {
      playedToday = true;
      break;
    }
  }
  if (!playedToday) {
    insights.push({
      type: 'daily',
      icon: '📅',
      title: 'Dnevni izziv čakal',
      message: 'Danes še nisi odigral nobene igre. 5 minut za svež glavo!',
      action: 'Zaženi dnevni izziv',
    });
  }

  return insights;
}

export function renderStats() {
  const all = statsManager.getAllRecords();
  const gamification = statsManager.getGamificationStats();
  const insights = generateInsights(all);

  // Izračun skupnega števila odigranih iger
  let totalGamesPlayed = 0;
  for (const recs of Object.values(all)) {
    totalGamesPlayed += recs.length;
  }

  // Zgornji pregledni dashboard
  const summaryWidget = `
        <div class="stats-overview-bar">
            <div class="stats-overview-item">
                <span class="stats-overview-num">${totalGamesPlayed}</span>
                <span class="stats-overview-label">Odigranih iger</span>
            </div>
            <div class="stats-overview-item">
                <span class="stats-overview-num">${gamification.streak}</span>
                <span class="stats-overview-label">Dni zapored (Streak)</span>
            </div>
            <div class="stats-overview-item">
                <span class="stats-overview-num">${gamification.level}</span>
                <span class="stats-overview-label">Nivo možganov</span>
            </div>
            <div class="stats-overview-item">
                <span class="stats-overview-num">${gamification.xp}</span>
                <span class="stats-overview-label">Skupni XP</span>
            </div>
        </div>
    `;

  // Insights sekcija
  const insightsHtml =
    insights.length > 0
      ? `
        <div class="stats-insights">
            <h3 class="stats-chart-title">💡 Pripombi in priporočila</h3>
            <div class="insights-grid">
                ${insights
                  .map(
                    i => `
                    <div class="insight-card insight-${i.type}">
                        <div class="insight-icon">${i.icon}</div>
                        <div class="insight-content">
                            <div class="insight-title">${i.title}</div>
                            <div class="insight-message">${i.message}</div>
                            ${i.gameId ? `<button class="btn btn-sm insight-action" data-game="${i.gameId}">${i.action}</button>` : ''}
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    `
      : '';

  const chartsHtml = `
        <div class="stats-charts-grid">
            <div class="card stats-chart-card">
                <h3 class="stats-chart-title">Napredek – zadnjih 30 dni</h3>
                <canvas id="xp-chart" width="600" height="200" style="width:100%; height:200px; display:block;"></canvas>
            </div>
            <div class="card stats-chart-card">
                <h3 class="stats-chart-title">Profil veščin</h3>
                <canvas id="skill-radar" width="300" height="300" style="width:100%; height:300px; display:block;"></canvas>
            </div>
        </div>
    `;

  // Nariši grafe po vstavitvi v DOM
  setTimeout(() => {
    const xpCanvas = document.getElementById('xp-chart');
    const radarCanvas = document.getElementById('skill-radar');
    if (xpCanvas) drawXpChart(xpCanvas, all);
    if (radarCanvas) drawSkillRadar(radarCanvas, all);
  }, 0);

  let sections = '';
  for (const [id, meta] of Object.entries(GAME_META)) {
    const records = all[id] || [];

    if (GROUP_KEYS[id] && records.length > 0) {
      const groups = getBestGrouped(id, meta.metric, GROUP_KEYS[id], meta.order === 'max');

      // Dodaj trend in percentil za vsako skupino
      const groupEntries = Object.entries(groups)
        .map(([gk, rec]) => {
          const parsed = JSON.parse(gk);
          const labelMarkup = formatLabelParts(parsed);
          const displayBest = `${rec[meta.metric] ?? '—'}${meta.label === 'ms' ? ' ms' : ' ' + meta.label.toLowerCase()}`;

          // Trend za to skupino
          const groupRecords = records.filter(r => {
            for (const k of GROUP_KEYS[id]) {
              if (r[k] !== parsed[k]) return false;
            }
            return true;
          });
          const trend = analyzeGameTrends(groupRecords, meta.metric, meta.order === 'max');
          const percentile = calculatePercentile(groupRecords, meta.metric, meta.order === 'max');

          return `
                    <div class="stats-group-item">
                        <div class="stats-group-row">
                            <div class="stats-group-label-wrap">${labelMarkup}</div>
                            <span class="stats-best-pill">
                                <span class="stats-best-label">Najboljši:</span>
                                <strong>${displayBest}</strong>
                            </span>
                            <span class="stats-trend trend-${trend.direction}">${trend.message}</span>
                            <span class="stats-percentile">${percentile.message}</span>
                        </div>
                        <div class="stats-date">Zadnji zapis: ${rec.date || '—'}</div>
                    </div>
                `;
        })
        .join('');

      sections += `
            <div class="card stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">${meta.name}</h3>
                    <span class="stats-subtle">${records.length} ${records.length === 1 ? 'zapis' : records.length === 2 ? 'zapisa' : 'zapisov'}</span>
                </div>
                <div class="stats-group-list">${groupEntries}</div>
            </div>`;
    } else {
      const best =
        records.length > 0 ? statsManager.getBest(id, meta.metric, meta.order === 'max') : null;

      const historyRows = records
        .slice(-10)
        .reverse()
        .map(
          r => `
                <tr>
                    <td>${r.date || '—'}</td>
                    <td>${r[meta.metric] ?? '—'}${meta.label === 'ms' ? ' ms' : ''}</td>
                </tr>
            `
        )
        .join('');

      // Trend in percentil za celotno igro
      const trend = analyzeGameTrends(records, meta.metric, meta.order === 'max');
      const percentile = calculatePercentile(records, meta.metric, meta.order === 'max');

      sections += `
            <div class="card stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">${meta.name}</h3>
                    <span class="stats-subtle">
                        ${records.length > 0 ? `Najboljši: <strong>${best[meta.metric]}${meta.label === 'ms' ? ' ms' : ' ' + meta.label.toLowerCase()}</strong> | ${trend.message} | ${percentile.message}` : 'Ni podatkov'}
                    </span>
                </div>
                ${
                  records.length > 0
                    ? `
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>${meta.label}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${historyRows}
                    </tbody>
                </table>
                `
                    : '<p class="stats-subtle">Še nisi igral te igre.</p>'
                }
            </div>`;
    }
  }

  return `
        <div class="stats-page">
            <div class="page-header" style="margin-bottom: 0;">
                <h2 class="title">Statistika dosežkov</h2>
                <p class="subtitle">Pregled napredka, trendov in najboljših rezultatov.</p>
            </div>
            ${summaryWidget}
            ${insightsHtml}
            ${chartsHtml}
            <div class="stats-grid">${sections}</div>
        </div>
    `;
}
