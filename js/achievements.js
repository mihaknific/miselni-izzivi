// js/achievements.js — Sistem dosežkov (Achievements/Badges)
import { statsManager } from './stats.js';
import { Settings } from './store.js';
import { showToast } from './feedback.js';

const ACHIEVEMENTS_KEY = 'achievements_v1';
const ACHIEVEMENT_DEFS = [
  // Prvi koraki
  {
    id: 'first_game',
    name: 'Prvi korak',
    desc: 'Odigraj prvo igro',
    icon: '🎮',
    xp: 10,
    condition: s => s.totalGames >= 1,
  },
  {
    id: 'first_win',
    name: 'Prva zmaga',
    desc: 'Zmagaj v prvi igri',
    icon: '🏆',
    xp: 20,
    condition: s => s.totalWins >= 1,
  },

  // Streak
  {
    id: 'streak_3',
    name: 'Tri dni',
    desc: 'Igraj 3 dni zapored',
    icon: '🔥',
    xp: 50,
    condition: s => s.streak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Teden',
    desc: 'Igraj 7 dni zapored',
    icon: '🔥',
    xp: 100,
    condition: s => s.streak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Mesec',
    desc: 'Igraj 30 dni zapored',
    icon: '🌟',
    xp: 500,
    condition: s => s.streak >= 30,
  },

  // XP milestones
  {
    id: 'xp_100',
    name: 'Stotnik',
    desc: 'Zberi 100 XP',
    icon: '⭐',
    xp: 0,
    condition: s => s.xp >= 100,
  },
  {
    id: 'xp_1000',
    name: 'Tisočak',
    desc: 'Zberi 1.000 XP',
    icon: '⭐',
    xp: 0,
    condition: s => s.xp >= 1000,
  },
  {
    id: 'xp_10000',
    name: 'Desetkratnik',
    desc: 'Zberi 10.000 XP',
    icon: '💫',
    xp: 0,
    condition: s => s.xp >= 10000,
  },

  // Game-specific
  {
    id: 'memory_master',
    name: 'Mister spomina',
    desc: 'Doseži raven "Ekspert" v Spominu',
    icon: '🧠',
    xp: 100,
    condition: s => s.bestByGame?.spomin?.difficulty === 'expert',
  },
  {
    id: 'sequence_10',
    name: 'Zaporedni genij',
    desc: 'Doseži raven 10 v Zaporedju',
    icon: '🔢',
    xp: 100,
    condition: s => (s.bestByGame?.zaporedje?.level || 0) >= 10,
  },
  {
    id: 'nback_3',
    name: 'Dual N-Back 3',
    desc: 'Zavrzi 3-Back',
    icon: '🔄',
    xp: 150,
    condition: s => (s.bestByGame?.dualnback?.nVal || 0) >= 3,
  },
  {
    id: 'corsi_7',
    name: 'Prostorski navigator',
    desc: 'Doseži span 7 v Corsiju',
    icon: '📍',
    xp: 150,
    condition: s => (s.bestByGame?.corsi?.span || 0) >= 7,
  },
  {
    id: 'reaction_200',
    name: 'Bleskoviti',
    desc: 'Povprečni reakcijski čas pod 200ms',
    icon: '⚡',
    xp: 100,
    condition: s => (s.bestByGame?.reakcija?.ms || 9999) < 200,
  },
  {
    id: 'stroop_perfect',
    name: 'Stroop mojster',
    desc: '100% točnost v Stroopu (min 20 poskusov)',
    icon: '🎨',
    xp: 100,
    condition: s =>
      (s.bestByGame?.stroop?.accuracy || 0) === 100 && (s.bestByGame?.stroop?.trials || 0) >= 20,
  },
  {
    id: 'patterns_50',
    name: 'Reševalec vzorcev',
    desc: 'Reši vseh 50 osnovnih nivojev Vzorcev',
    icon: '🧩',
    xp: 200,
    condition: s => (s.solvedPatterns || 0) >= 50,
  },
  {
    id: 'patterns_infinite',
    name: 'Neskončni reševalec',
    desc: 'Reši 100 proceduralnih nivojev Vzorcev',
    icon: '♾️',
    xp: 300,
    condition: s => (s.solvedProceduralPatterns || 0) >= 100,
  },
  {
    id: 'twfo_2048',
    name: 'Združevalec',
    desc: 'Doseži ploščico 2048',
    icon: '🔢',
    xp: 150,
    condition: s => (s.bestByGame?.['2048']?.bestTile || 0) >= 2048,
  },
  {
    id: 'besedle_win',
    name: 'Besedni mojster',
    desc: 'Zmagaj v Besedlah 5×',
    icon: '📝',
    xp: 100,
    condition: s => (s.besedleWins || 0) >= 5,
  },
  {
    id: 'povezave_win',
    name: 'Povezovalec',
    desc: 'Reši 5 ugank Povezav',
    icon: '🔗',
    xp: 150,
    condition: s => (s.povezaveWins || 0) >= 5,
  },
  {
    id: 'besedolov_genius',
    name: 'Besedolov Genij',
    desc: 'Doseži Genij v Besedolovu',
    icon: '🔤',
    xp: 150,
    condition: s => (s.bestByGame?.besedolov?.pct || 0) >= 70,
  },
  {
    id: 'sudoku_master',
    name: 'Sudoku Mojster',
    desc: 'Reši Sudoku težko',
    icon: '🔢',
    xp: 150,
    condition: s => s.bestByGame?.sudoku?.difficulty === 'hard',
  },
  {
    id: 'minolovec_win',
    name: 'Minolovec',
    desc: 'Zmaga na težki stopnji Minolovca',
    icon: '💣',
    xp: 150,
    condition: s => s.bestByGame?.minolovec?.difficulty === 'hard' && s.bestByGame?.minolovec?.won,
  },

  // Daily challenge
  {
    id: 'daily_7',
    name: 'Teden izzivov',
    desc: 'Končaj dnevni izziv 7 dni zapored',
    icon: '📅',
    xp: 100,
    condition: s => (s.dailyStreak || 0) >= 7,
  },
  {
    id: 'daily_30',
    name: 'Mesec izzivov',
    desc: 'Končaj dnevni izziv 30 dni',
    icon: '🗓️',
    xp: 300,
    condition: s => (s.dailyCompleted || 0) >= 30,
  },

  // Variety
  {
    id: 'variety_5',
    name: 'Raznolik',
    desc: 'Poskusi vsaj 5 različnih iger',
    icon: '🌈',
    xp: 50,
    condition: s => (s.gamesPlayedTypes?.size || 0) >= 5,
  },
  {
    id: 'variety_all',
    name: 'Polimat',
    desc: 'Poskusi vseh 25 iger',
    icon: '🎓',
    xp: 500,
    condition: s => (s.gamesPlayedTypes?.size || 0) >= 25,
  },

  // Special
  {
    id: 'night_owl',
    name: 'Nočni sovar',
    desc: 'Igraj po 22:00',
    icon: '🦉',
    xp: 50,
    condition: s => s.playedAtNight === true,
  },
  {
    id: 'early_bird',
    name: 'Zajtrk',
    desc: 'Igraj pred 7:00',
    icon: '🌅',
    xp: 50,
    condition: s => s.playedAtMorning === true,
  },
];

function getAchievements() {
  try {
    return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAchievements(achievements) {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (e) {
    console.error('Achievements save failed:', e);
  }
}

function getGameStats() {
  const records = statsManager.getAllRecords();
  const gamification = statsManager.getGamificationStats();

  let totalGames = 0;
  let totalWins = 0;
  const gamesPlayedTypes = new Set();
  const bestByGame = {};
  let solvedPatterns = 0;
  let solvedProceduralPatterns = 0;
  let besedleWins = 0;
  let povezaveWins = 0;

  for (const [gameId, recs] of Object.entries(records)) {
    const validRecs = Array.isArray(recs)
      ? recs.filter(record => record && typeof record === 'object' && !Array.isArray(record))
      : [];
    totalGames += validRecs.length;
    gamesPlayedTypes.add(gameId);

    if (validRecs.length > 0) {
      totalWins += validRecs.filter(r =>
        r.won !== false && r.success !== false && r.won !== undefined ? r.won : r.success !== false
      ).length;
      // Alternativno štetje zmag glede na tip igre
      if (gameId === 'besedle') besedleWins = validRecs.filter(r => r.won).length;
      if (gameId === 'povezave') povezaveWins = validRecs.filter(r => r.won).length;

      // Best by game
      if (gameId === 'spomin') {
        const best = validRecs.reduce((a, b) => (a.moves < b.moves ? a : b));
        bestByGame[gameId] = { difficulty: best.difficulty, moves: best.moves };
      } else if (gameId === 'zaporedje') {
        const best = validRecs.reduce((a, b) => ((a.level || 0) > (b.level || 0) ? a : b));
        bestByGame[gameId] = { level: best.level };
      } else if (gameId === 'dualnback') {
        const best = validRecs.reduce((a, b) => ((a.nVal || 0) > (b.nVal || 0) ? a : b));
        bestByGame[gameId] = { nVal: best.nVal };
      } else if (gameId === 'corsi') {
        const best = validRecs.reduce((a, b) => ((a.span || 0) > (b.span || 0) ? a : b));
        bestByGame[gameId] = { span: best.span };
      } else if (gameId === 'reakcija') {
        const best = validRecs.reduce((a, b) => ((a.ms || 9999) < (b.ms || 9999) ? a : b));
        bestByGame[gameId] = { ms: best.ms };
      } else if (gameId === 'stroop') {
        const best = validRecs.reduce((a, b) => ((a.accuracy || 0) > (b.accuracy || 0) ? a : b));
        bestByGame[gameId] = { accuracy: best.accuracy, trials: best.trials };
      } else if (gameId === 'vzorci') {
        solvedPatterns += validRecs.filter(r => !r.procedural && r.success).length;
        solvedProceduralPatterns += validRecs.filter(r => r.procedural && r.success).length;
      } else if (gameId === '2048') {
        const best = validRecs.reduce((a, b) => ((a.score || 0) > (b.score || 0) ? a : b));
        bestByGame[gameId] = { score: best.score, bestTile: best.bestTile };
      } else if (gameId === 'besedle') {
        const best = validRecs
          .filter(r => r.won)
          .reduce((a, b) => (a && a.attempts < b.attempts ? a : b), null);
        if (best) bestByGame[gameId] = { attempts: best.attempts };
      } else if (gameId === 'povezave') {
        const best = validRecs
          .filter(r => r.won)
          .reduce((a, b) => (a && (a.score || 0) > (b.score || 0) ? a : b), null);
        if (best) bestByGame[gameId] = { score: best.score };
      } else if (gameId === 'besedolov') {
        const best = validRecs.reduce((a, b) => ((a.pct || 0) > (b.pct || 0) ? a : b));
        bestByGame[gameId] = { pct: best.pct, score: best.score };
      } else if (gameId === 'sudoku') {
        const best = validRecs.reduce((a, b) => ((a.time || 9999) < (b.time || 9999) ? a : b), null);
        if (best) bestByGame[gameId] = { time: best.time, difficulty: best.difficulty };
      } else if (gameId === 'minolovec') {
        const best = validRecs
          .filter(r => r.won)
          .reduce(
            (a, b) => (!a || (a.time || 9999) < (b.time || 9999) ? a : b),
            null
          );
        if (best) bestByGame[gameId] = { time: best.time, difficulty: best.difficulty, won: true };
      } else if (gameId === 'nonogram') {
        const best = validRecs.reduce((a, b) => ((a.time || 9999) < (b.time || 9999) ? a : b), null);
        if (best) bestByGame[gameId] = { time: best.time, size: best.size };
      }
    }
  }

  // Daily challenge stats
  const dailyProgress = JSON.parse(localStorage.getItem('daily_challenge_progress') || '{}');
  let dailyCompleted = 0;
  let dailyStreak = 0;
  const sortedDates = Object.keys(dailyProgress).sort();
  for (const date of sortedDates) {
    if (dailyProgress[date].completed?.length >= 3) {
      // 3+ games = completed
      dailyCompleted++;
    }
  }
  // Calculate streak
  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date(today);
  checkDate.setDate(checkDate.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (dailyProgress[dStr]?.completed?.length >= 3) {
      dailyStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }

  // Time-based
  const hour = new Date().getHours();
  const playedAtNight = hour >= 22 || hour < 5;
  const playedAtMorning = hour >= 5 && hour < 7;

  return {
    totalGames,
    totalWins,
    gamesPlayedTypes,
    bestByGame,
    solvedPatterns,
    solvedProceduralPatterns,
    besedleWins,
    povezaveWins,
    dailyCompleted,
    dailyStreak,
    playedAtNight,
    playedAtMorning,
    xp: gamification.xp,
    streak: gamification.streak,
    level: gamification.level,
  };
}

export function checkAchievements() {
  const stats = getGameStats();
  const achievements = getAchievements();
  const newlyUnlocked = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (achievements[def.id]) continue; // že odklenjen

    try {
      if (def.condition(stats)) {
        achievements[def.id] = {
          unlockedAt: new Date().toISOString(),
          xpAwarded: def.xp,
        };
        newlyUnlocked.push(def);

        if (def.xp > 0) {
          statsManager.addXp(def.xp);
        }
      }
    } catch (e) {
      console.error(`Achievement check failed for ${def.id}:`, e);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveAchievements(achievements);
    for (const a of newlyUnlocked) {
      showToast(`${a.icon} Dosežek odklenjen: ${a.name}! ${a.xp > 0 ? '+' + a.xp + ' XP' : ''}`, {
        type: 'success',
        timeout: 5000,
      });
    }
  }

  return newlyUnlocked;
}

export function getAllAchievements() {
  const userAchievements = getAchievements();
  return ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: !!userAchievements[def.id],
    unlockedAt: userAchievements[def.id]?.unlockedAt,
    xpAwarded: userAchievements[def.id]?.xpAwarded || def.xp,
  }));
}

export function renderAchievementsPanel() {
  const all = getAllAchievements();
  const unlocked = all.filter(a => a.unlocked).length;
  const total = all.length;

  const html = all
    .map(
      a => `
        <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon" style="font-size: 2rem;">${a.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${a.name}</div>
                <div class="achievement-desc">${a.desc}</div>
                ${a.xp > 0 ? `<div class="achievement-xp">+${a.xp} XP</div>` : ''}
            </div>
            <div class="achievement-status">
                ${a.unlocked ? '✅' : '🔒'}
            </div>
        </div>
    `
    )
    .join('');

  return `
        <div class="achievements-panel">
            <div class="achievements-header">
                <h3>Dosežki (${unlocked} / ${total})</h3>
                <div class="achievements-progress">
                    <div class="achievements-bar" style="--progress: ${(unlocked / total) * 100}%"></div>
                </div>
            </div>
            <div class="achievements-grid">${html}</div>
        </div>
    `;
}

// Avtomatska preverjanje ob zagotavljanju XP
export function initAchievementWatcher() {
  // Preveri dosežke vsakič, ko se XP spremeni
  window.addEventListener('xp-updated', () => {
    setTimeout(checkAchievements, 100);
  });

  // Preveri takoj ob zagonu
  checkAchievements();
}
