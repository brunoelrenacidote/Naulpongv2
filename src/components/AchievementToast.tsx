"use client";

import { useEffect } from "react";
import { Achievement } from "@/lib/stats";

interface Props {
  achievements: Achievement[];
  onDone: (id: string) => void;
}

export default function AchievementToast({ achievements, onDone }: Props) {
  useEffect(() => {
    if (achievements.length === 0) return;
    const top = achievements[0];
    const t = setTimeout(() => onDone(top.id), 4500);
    return () => clearTimeout(t);
  }, [achievements, onDone]);

  if (achievements.length === 0) return null;
  const top = achievements[0];
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center">
      <div
        className="achievement-toast font-press flex items-center gap-3 rounded-md border border-[var(--neon-yellow)]/70 bg-black/80 px-4 py-2 backdrop-blur"
      >
        <span
          className="text-[10px] tracking-widest text-[var(--neon-yellow)]"
          style={{ textShadow: "0 0 6px #ffd95c" }}
        >
          ★ LOGRO
        </span>
        <div className="flex flex-col text-left">
          <span className="text-[11px] tracking-widest text-white">
            {top.name}
          </span>
          <span className="font-vt text-xs text-white/70">
            {top.description}
          </span>
        </div>
      </div>
    </div>
  );
}
