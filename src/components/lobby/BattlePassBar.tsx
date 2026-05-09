"use client";

import { useEffect, useState } from "react";
import { loadStats, type Stats } from "@/lib/stats";
import { HexLevel } from "./tactical-icons";

/**
 * Barra de "Battle Pass / Operador" en el centro superior. El level se
 * deriva de las stats locales (wins * 3 + powerUpsTaken) y la barra de
 * progreso se calcula en base al avance dentro del nivel actual.
 *
 * No es un battle pass real — es una capa de progresión visual para que
 * el jugador sienta que sus partidas suman.
 */
export default function BattlePassBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(loadStats());
    const refresh = () => setStats(loadStats());
    window.addEventListener("naulpong:stats-changed", refresh);
    return () => window.removeEventListener("naulpong:stats-changed", refresh);
  }, []);

  // Progresión: 100 XP por nivel. XP = wins*30 + powers*5 + goalsFor*2.
  const xp = stats
    ? stats.wins * 30 + stats.powerUpsTaken * 5 + stats.goalsFor * 2
    : 0;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const xpInLevel = xp % 100;
  const pct = Math.min(100, xpInLevel);

  return (
    <div
      className="bp-bar"
      role="status"
      aria-label={`Operador nivel ${level}, ${xpInLevel} de 100 XP`}
    >
      <span aria-hidden style={{ display: "grid", placeItems: "center" }}>
        <HexLevel size={38} level={level} />
      </span>
      <span className="bp-progress-wrap">
        <span className="bp-progress-label">
          <span className="bp-progress-eyebrow">Operador • Temp 01</span>
          <span className="bp-progress-pct">{xpInLevel}/100 XP</span>
        </span>
        <span className="bp-progress-track" aria-hidden>
          <span
            className="bp-progress-fill"
            style={{ ["--bp-pct" as string]: `${pct}%` }}
          />
        </span>
      </span>
    </div>
  );
}
