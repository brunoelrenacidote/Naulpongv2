"use client";

import { useEffect, useState } from "react";
import { loadStats, Stats } from "@/lib/stats";

/**
 * Pequeña fila de "trofeos / racha / partidos" pensada para el home.
 * Los valores se leen de localStorage (stats personales) y solo se
 * muestran tras la hidratación para evitar mismatch SSR.
 */
export default function StatsBadges() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  if (!stats) {
    return <div className="h-[34px]" aria-hidden />;
  }

  return (
    <div className="flex w-full max-w-md items-center justify-center gap-2 sm:gap-3">
      <Badge
        glyph="🏆"
        label="TROFEOS"
        value={String(stats.wins)}
        color="var(--neon-yellow)"
      />
      <Badge
        glyph="🔥"
        label="RACHA"
        value={String(stats.currentStreak)}
        color="var(--neon-orange)"
        muted={stats.currentStreak === 0}
      />
      <Badge
        glyph="🎮"
        label="PARTIDAS"
        value={String(stats.matches)}
        color="var(--neon-cyan)"
      />
    </div>
  );
}

function Badge({
  glyph,
  label,
  value,
  color,
  muted,
}: {
  glyph: string;
  label: string;
  value: string;
  color: string;
  muted?: boolean;
}) {
  return (
    <div
      className="pixel-frame flex flex-1 items-center gap-2 px-2 py-1.5 sm:px-3"
      style={{
        opacity: muted ? 0.55 : 1,
        borderColor: muted ? "rgba(255,255,255,0.18)" : `${color}55`,
      }}
    >
      <span className="text-base sm:text-lg" aria-hidden>
        {glyph}
      </span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-press text-[7px] tracking-widest text-white/45 sm:text-[8px]">
          {label}
        </span>
        <span
          className="font-press text-[11px] sm:text-[13px]"
          style={{
            color,
            textShadow: muted ? "none" : `0 0 6px ${color}`,
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
