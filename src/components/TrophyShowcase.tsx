"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENTS, AchievementId, loadStats, loadUnlocked } from "@/lib/stats";

const ACH_GLYPH: Record<AchievementId, string> = {
  first_win: "🥇",
  five_streak: "🔥",
  ten_wins: "🏆",
  shutout: "🛡",
  perfect_seven: "💎",
  power_collector: "⚡",
  bot_easy: "🤖",
  bot_medium: "🤖",
  bot_hard: "💀",
  speed_run: "🏃",
  veteran: "👑",
};

/**
 * Vitrina de trofeos / progreso estilo Brawl Stars en la home.
 * Arriba: trofeos totales + barra de progreso al próximo logro.
 * Abajo: 4 mini-chips con achievements destacados (los más cercanos a desbloquear
 * o ya desbloqueados).
 */
export default function TrophyShowcase() {
  const [data, setData] = useState<{
    trophies: number;
    nextTarget: number;
    nextLabel: string;
    chips: { id: AchievementId; unlocked: boolean }[];
  } | null>(null);

  useEffect(() => {
    const stats = loadStats();
    const unlocked = loadUnlocked();

    // "Trofeos" = total de logros desbloqueados (de un total de N).
    const trophies = unlocked.size;
    const total = Object.keys(ACHIEVEMENTS).length;

    // Próxima meta: el siguiente logro relevante. Para simplificar,
    // usamos "ten_wins" como meta de wins, o "veteran" si ya tiene 10 wins.
    let nextTarget = 1;
    let nextLabel = "PRIMER WIN";
    if (unlocked.has("first_win")) {
      nextTarget = 5;
      nextLabel = "RACHA DE 5";
    }
    if (unlocked.has("five_streak")) {
      nextTarget = 10;
      nextLabel = "10 WINS";
    }
    if (unlocked.has("ten_wins")) {
      nextTarget = 50;
      nextLabel = "VETERANO (50)";
    }
    if (unlocked.has("veteran")) {
      nextTarget = total;
      nextLabel = "TODOS LOS LOGROS";
    }

    // Chips destacados — orden: los desbloqueados primero, luego los próximos.
    const order: AchievementId[] = [
      "first_win",
      "five_streak",
      "ten_wins",
      "shutout",
      "perfect_seven",
      "veteran",
    ];
    const chips = order.slice(0, 4).map((id) => ({
      id,
      unlocked: unlocked.has(id),
    }));

    setData({
      trophies,
      nextTarget,
      nextLabel,
      chips,
    });

    // sólo lee localStorage (montado en cliente) — no requiere stats arg
    void stats;
  }, []);

  if (!data) {
    return <div className="h-[120px] w-full" aria-hidden />;
  }

  const total = Object.keys(ACHIEVEMENTS).length;
  const pct = Math.min(100, Math.round((data.trophies / data.nextTarget) * 100));

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="trophy-slot">
        <span className="ts-icon" aria-hidden>
          🏆
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="ts-num">{data.trophies}</span>
            <span className="ts-label">DE {total}</span>
          </div>
          <div
            className="progress-pixel"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso al próximo logro: ${data.nextLabel}`}
          >
            <div className="fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="font-press text-[7px] tracking-[0.2em] text-white/45">
            PRÓX: {data.nextLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {data.chips.map((c) => (
          <div
            key={c.id}
            className={`ach-chip ${c.unlocked ? "unlocked" : "locked"} flex-col items-center justify-center text-center`}
            title={ACHIEVEMENTS[c.id].name}
            aria-label={`${ACHIEVEMENTS[c.id].name}${c.unlocked ? "" : " (bloqueado)"}`}
          >
            <span className="ach-glyph">{ACH_GLYPH[c.id]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
