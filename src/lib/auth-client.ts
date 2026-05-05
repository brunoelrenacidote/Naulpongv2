"use client";

import {
  Stats,
  AchievementId,
  loadStats,
  loadUnlocked,
  saveStats,
} from "@/lib/stats";

/**
 * Cliente del sistema de auth opcional. Si no hay token, las funciones
 * "logueado" devuelven null y la app sigue funcionando con localStorage.
 */

const TOKEN_KEY = "naulpong:auth:token";
const USER_KEY = "naulpong:auth:user";

export interface AuthSession {
  token: string;
  username: string;
}

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    const u = window.localStorage.getItem(USER_KEY);
    if (!t || !u) return null;
    return { token: t, username: u };
  } catch {
    return null;
  }
}

export function saveSession(s: AuthSession) {
  window.localStorage.setItem(TOKEN_KEY, s.token);
  window.localStorage.setItem(USER_KEY, s.username);
  try {
    window.dispatchEvent(new CustomEvent("naulpong:auth-changed"));
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  try {
    window.dispatchEvent(new CustomEvent("naulpong:auth-changed"));
  } catch {
    /* ignore */
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function apiRegister(
  username: string,
  password: string,
  initialStats: Stats | null,
): Promise<AuthSession> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password, initialStats }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as AuthSession;
  saveSession(data);
  return data;
}

export async function apiLogin(
  username: string,
  password: string,
): Promise<AuthSession> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as AuthSession;
  saveSession(data);
  return data;
}

export async function apiMe(token: string): Promise<{
  username: string;
  stats: Stats | null;
  unlocked: AchievementId[];
} | null> {
  const res = await fetch("/api/auth/me", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as {
    username: string;
    stats: Stats | null;
    unlocked: AchievementId[];
  };
}

export async function apiPushStats(
  token: string,
  stats: Stats,
  unlocked: AchievementId[],
): Promise<void> {
  const res = await fetch("/api/stats", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stats, unlocked }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

/**
 * Mergea stats local + remoto para casos donde los dos tienen datos.
 * Estrategia simple: el de mayor "matches" es la fuente principal; el
 * resto de campos toma el max() correspondiente.
 */
export function mergeStats(local: Stats, remote: Stats): Stats {
  const main = local.matches >= remote.matches ? local : remote;
  return {
    matches: Math.max(local.matches, remote.matches),
    wins: Math.max(local.wins, remote.wins),
    losses: Math.max(local.losses, remote.losses),
    goalsFor: Math.max(local.goalsFor, remote.goalsFor),
    goalsAgainst: Math.max(local.goalsAgainst, remote.goalsAgainst),
    powerUpsTaken: Math.max(local.powerUpsTaken, remote.powerUpsTaken),
    currentStreak: main.currentStreak,
    bestStreak: Math.max(local.bestStreak, remote.bestStreak),
    shutoutWins: Math.max(local.shutoutWins, remote.shutoutWins),
    fastestWinMs:
      local.fastestWinMs == null
        ? remote.fastestWinMs
        : remote.fastestWinMs == null
          ? local.fastestWinMs
          : Math.min(local.fastestWinMs, remote.fastestWinMs),
    totalPlayMs: Math.max(local.totalPlayMs, remote.totalPlayMs),
    vsHumanWins: Math.max(local.vsHumanWins, remote.vsHumanWins),
    vsBotWins: {
      easy: Math.max(local.vsBotWins.easy, remote.vsBotWins.easy),
      medium: Math.max(local.vsBotWins.medium, remote.vsBotWins.medium),
      hard: Math.max(local.vsBotWins.hard, remote.vsBotWins.hard),
    },
  };
}

export function pullLocal(): { stats: Stats; unlocked: AchievementId[] } {
  return {
    stats: loadStats(),
    unlocked: Array.from(loadUnlocked()),
  };
}

export function applyToLocal(
  stats: Stats,
  unlocked: AchievementId[],
): void {
  saveStats(stats);
  try {
    window.localStorage.setItem(
      "naulpong:achievements:v1",
      JSON.stringify(unlocked),
    );
  } catch {
    /* ignore */
  }
}
