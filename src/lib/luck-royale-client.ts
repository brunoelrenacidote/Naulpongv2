"use client";

import type { LuckItem } from "@/lib/luck-royale";

export interface LuckRoyaleState {
  tickets: number;
  unlockedItems: string[];
  spinCost: number;
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function apiLuckRoyaleState(
  token: string,
): Promise<LuckRoyaleState | null> {
  const res = await fetch("/api/luck-royale", {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as LuckRoyaleState;
}

export interface SpinResult {
  item: LuckItem;
  duplicate: boolean;
  ticketsRefunded: number;
  newTickets: number;
  unlockedItems: string[];
}

export async function apiLuckRoyaleSpin(token: string): Promise<SpinResult> {
  const res = await fetch("/api/luck-royale/spin", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as SpinResult;
}

export interface CreditResult {
  tickets: number;
  delta: number;
  cooldown?: number;
}

/**
 * Le pega al endpoint de "crédito por jugar partida". Best-effort:
 * si falla (offline, sesión vencida, cooldown), simplemente no se
 * acreditan boletos esta vez. No bloquea el flow del juego.
 */
export async function apiPlayCredit(
  token: string,
  won: boolean,
): Promise<CreditResult | null> {
  try {
    const res = await fetch("/api/play/credit", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ won }),
    });
    if (!res.ok) return null;
    return (await res.json()) as CreditResult;
  } catch {
    return null;
  }
}
