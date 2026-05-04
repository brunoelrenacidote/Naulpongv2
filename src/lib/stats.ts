// Local stats + achievements stored in localStorage.
// All counters and unlocks live client-side; this is purely a personal
// progression tracker (no server / leaderboard).

export interface Stats {
  matches: number;
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  powerUpsTaken: number;
  currentStreak: number;
  bestStreak: number;
  shutoutWins: number;
  fastestWinMs: number | null;
  totalPlayMs: number;
  // Per-mode counts
  vsHumanWins: number;
  vsBotWins: Record<"easy" | "medium" | "hard", number>;
}

const STATS_KEY = "naulpong:stats:v1";
const ACHIEVEMENTS_KEY = "naulpong:achievements:v1";

const DEFAULT_STATS: Stats = {
  matches: 0,
  wins: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  powerUpsTaken: 0,
  currentStreak: 0,
  bestStreak: 0,
  shutoutWins: 0,
  fastestWinMs: null,
  totalPlayMs: 0,
  vsHumanWins: 0,
  vsBotWins: { easy: 0, medium: 0, hard: 0 },
};

export type AchievementId =
  | "first_win"
  | "five_streak"
  | "ten_wins"
  | "shutout"
  | "perfect_seven"
  | "power_collector"
  | "bot_easy"
  | "bot_medium"
  | "bot_hard"
  | "speed_run"
  | "veteran";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_win: {
    id: "first_win",
    name: "PRIMERA VICTORIA",
    description: "Ganaste tu primer partido",
  },
  five_streak: {
    id: "five_streak",
    name: "EN RACHA",
    description: "5 victorias seguidas",
  },
  ten_wins: {
    id: "ten_wins",
    name: "CRACK DE LA CASA",
    description: "10 victorias acumuladas",
  },
  shutout: {
    id: "shutout",
    name: "SIN PIEDAD",
    description: "Ganaste sin recibir un solo gol",
  },
  perfect_seven: {
    id: "perfect_seven",
    name: "7-0",
    description: "Ganaste 7 a 0",
  },
  power_collector: {
    id: "power_collector",
    name: "COLECCIONISTA",
    description: "Agarraste 10 power-ups en un solo partido",
  },
  bot_easy: {
    id: "bot_easy",
    name: "TUTORIAL CUMPLIDO",
    description: "Le ganaste al bot fácil",
  },
  bot_medium: {
    id: "bot_medium",
    name: "RESPETO MEDIO",
    description: "Le ganaste al bot medio",
  },
  bot_hard: {
    id: "bot_hard",
    name: "CAZA-BOTS",
    description: "Le ganaste al bot difícil",
  },
  speed_run: {
    id: "speed_run",
    name: "FLECHA",
    description: "Ganaste en menos de 60 segundos",
  },
  veteran: {
    id: "veteran",
    name: "VETERANO",
    description: "Jugaste 50 partidos",
  },
};

export function loadStats(): Stats {
  if (typeof window === "undefined") return { ...DEFAULT_STATS };
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return {
      ...DEFAULT_STATS,
      ...parsed,
      vsBotWins: {
        ...DEFAULT_STATS.vsBotWins,
        ...(parsed.vsBotWins ?? {}),
      },
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveStats(s: Stats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota errors */
  }
}

export function loadUnlocked(): Set<AchievementId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as AchievementId[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveUnlocked(set: Set<AchievementId>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ACHIEVEMENTS_KEY,
      JSON.stringify(Array.from(set)),
    );
  } catch {
    /* ignore */
  }
}

export interface MatchSummary {
  won: boolean;
  goalsFor: number;
  goalsAgainst: number;
  durationMs: number;
  powerUpsTaken: number;
  vsBot: "easy" | "medium" | "hard" | null;
  vsHuman: boolean;
}

export interface MatchRecordResult {
  newStats: Stats;
  unlocked: Achievement[];
}

export function recordMatch(summary: MatchSummary): MatchRecordResult {
  const stats = loadStats();
  const unlocked = loadUnlocked();
  const newlyUnlocked: Achievement[] = [];

  stats.matches += 1;
  stats.goalsFor += summary.goalsFor;
  stats.goalsAgainst += summary.goalsAgainst;
  stats.powerUpsTaken += summary.powerUpsTaken;
  stats.totalPlayMs += summary.durationMs;

  if (summary.won) {
    stats.wins += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }
    if (summary.goalsAgainst === 0) stats.shutoutWins += 1;
    if (
      stats.fastestWinMs == null ||
      summary.durationMs < stats.fastestWinMs
    ) {
      stats.fastestWinMs = summary.durationMs;
    }
    if (summary.vsHuman) stats.vsHumanWins += 1;
    if (summary.vsBot) stats.vsBotWins[summary.vsBot] += 1;
  } else {
    stats.losses += 1;
    stats.currentStreak = 0;
  }

  // Evaluate achievements
  const tryUnlock = (id: AchievementId) => {
    if (!unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(ACHIEVEMENTS[id]);
    }
  };

  if (summary.won) {
    if (stats.wins >= 1) tryUnlock("first_win");
    if (stats.currentStreak >= 5) tryUnlock("five_streak");
    if (stats.wins >= 10) tryUnlock("ten_wins");
    if (summary.goalsAgainst === 0) tryUnlock("shutout");
    if (summary.goalsFor >= 7 && summary.goalsAgainst === 0) {
      tryUnlock("perfect_seven");
    }
    if (summary.durationMs > 0 && summary.durationMs < 60_000) {
      tryUnlock("speed_run");
    }
    if (summary.vsBot === "easy") tryUnlock("bot_easy");
    if (summary.vsBot === "medium") tryUnlock("bot_medium");
    if (summary.vsBot === "hard") tryUnlock("bot_hard");
  }
  if (summary.powerUpsTaken >= 10) tryUnlock("power_collector");
  if (stats.matches >= 50) tryUnlock("veteran");

  saveStats(stats);
  saveUnlocked(unlocked);
  return { newStats: stats, unlocked: newlyUnlocked };
}

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function winRate(stats: Stats): number {
  if (stats.matches === 0) return 0;
  return Math.round((stats.wins / stats.matches) * 100);
}
