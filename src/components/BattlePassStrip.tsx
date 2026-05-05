"use client";

import { useEffect, useState } from "react";
import {
  ACHIEVEMENTS,
  AchievementId,
  loadStats,
  loadUnlocked,
} from "@/lib/stats";

/**
 * Slim "season pass" style progress strip that lives between the hero stage
 * and the play button. Shows the player's trophies count + a horizontal pixel
 * progress bar to the next milestone, plus the next milestone name.
 *
 * Replaces the old vertical TrophyShowcase on the lobby — the achievement
 * chips themselves still live on /perfil.
 */
export default function BattlePassStrip() {
  const [data, setData] = useState<{
    trophies: number;
    nextTarget: number;
    nextLabel: string;
  } | null>(null);

  useEffect(() => {
    const refresh = () => {
      const stats = loadStats();
      const unlocked = loadUnlocked();
      void stats;

      const trophies = unlocked.size;
      const total = Object.keys(ACHIEVEMENTS).length;

      let nextTarget = 1;
      let nextLabel = "PRIMER WIN";
      const has = (id: AchievementId) => unlocked.has(id);
      if (has("first_win")) {
        nextTarget = 5;
        nextLabel = "RACHA DE 5";
      }
      if (has("five_streak")) {
        nextTarget = 10;
        nextLabel = "10 WINS";
      }
      if (has("ten_wins")) {
        nextTarget = 50;
        nextLabel = "VETERANO";
      }
      if (has("veteran")) {
        nextTarget = total;
        nextLabel = "TODOS LOS LOGROS";
      }

      setData({ trophies, nextTarget, nextLabel });
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  if (!data) return <div className="bp-strip placeholder" aria-hidden />;

  const pct = Math.min(100, Math.round((data.trophies / data.nextTarget) * 100));

  return (
    <div
      className="bp-strip"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Trofeos ${data.trophies}, próximo: ${data.nextLabel}`}
    >
      <div className="bp-head">
        <span className="bp-icon" aria-hidden>🏆</span>
        <span className="bp-num">{data.trophies}</span>
        <span className="bp-sep">·</span>
        <span className="bp-label">PRÓX: {data.nextLabel}</span>
      </div>
      <div className="bp-bar">
        <div className="bp-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
