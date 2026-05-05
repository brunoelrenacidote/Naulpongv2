"use client";

import { useEffect, useState } from "react";
import {
  ACHIEVEMENTS,
  Achievement,
  AchievementId,
  Stats,
  formatDuration,
  loadStats,
  loadUnlocked,
  winRate,
} from "@/lib/stats";

function readNick(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem("naulpong:nick") ?? "").toUpperCase();
}

function sanitizeNick(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 _\-]/g, "")
    .toUpperCase()
    .slice(0, 12);
}

function NickEditor({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (n: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  function save() {
    const clean = sanitizeNick(draft);
    if (clean.length < 2) return;
    localStorage.setItem("naulpong:nick", clean);
    onChange(clean);
    setEditing(false);
  }

  return (
    <section className="flex flex-col items-center gap-2 text-center">
      <p className="font-press text-[9px] tracking-widest text-white/40">
        NOMBRE
      </p>
      {editing ? (
        <div className="flex w-full max-w-xs flex-col items-stretch gap-2">
          <input
            autoFocus
            maxLength={12}
            className="input-arcade text-center"
            value={draft}
            onChange={(e) => setDraft(sanitizeNick(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            aria-label="Tu nombre"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-chunky pink"
              onClick={() => setEditing(false)}
            >
              CANCELAR
            </button>
            <button className="btn-chunky" onClick={save}>
              GUARDAR
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-press text-2xl tracking-widest text-[var(--neon-cyan)] transition hover:text-white sm:text-3xl"
          style={{ textShadow: "0 0 12px rgba(92,255,224,0.45)" }}
          aria-label="Editar nombre"
        >
          {initial || "—"}
        </button>
      )}
    </section>
  );
}

export default function ProfilePanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [unlocked, setUnlocked] = useState<Set<AchievementId>>(new Set());
  const [nick, setNick] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStats(loadStats());
    setUnlocked(loadUnlocked());
    setNick(readNick());
    setHydrated(true);
  }, []);

  if (!hydrated || !stats) {
    return (
      <div className="font-press text-[10px] tracking-widest text-white/40">
        CARGANDO...
      </div>
    );
  }

  const achievements: Achievement[] = Object.values(ACHIEVEMENTS);
  const totalUnlocked = achievements.filter((a) => unlocked.has(a.id)).length;

  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8">
      {/* Identity */}
      <NickEditor
        initial={nick}
        onChange={(n) => setNick(n)}
      />

      {/* Stats grid */}
      <section className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="PARTIDOS" value={String(stats.matches)} />
        <Tile
          label="VICTORIAS"
          value={String(stats.wins)}
          color="var(--neon-green)"
        />
        <Tile
          label="DERROTAS"
          value={String(stats.losses)}
          color="var(--neon-pink)"
        />
        <Tile
          label="% VICTORIA"
          value={`${winRate(stats)}%`}
          color="var(--neon-yellow)"
        />
        <Tile
          label="RACHA ACTUAL"
          value={String(stats.currentStreak)}
          color="var(--neon-cyan)"
        />
        <Tile
          label="MEJOR RACHA"
          value={String(stats.bestStreak)}
          color="var(--neon-yellow)"
        />
        <Tile label="GOLES A FAVOR" value={String(stats.goalsFor)} />
        <Tile label="GOLES EN CONTRA" value={String(stats.goalsAgainst)} />
        <Tile label="POWER-UPS" value={String(stats.powerUpsTaken)} />
        <Tile
          label="SHUTOUTS"
          value={String(stats.shutoutWins)}
          color="var(--neon-green)"
        />
        <Tile
          label="MÁS RÁPIDA"
          value={
            stats.fastestWinMs == null
              ? "—"
              : formatDuration(stats.fastestWinMs)
          }
        />
        <Tile label="TIEMPO TOTAL" value={formatDuration(stats.totalPlayMs)} />
      </section>

      {/* Bot wins */}
      <section className="flex flex-col gap-2">
        <p className="font-press text-[9px] tracking-widest text-white/40">
          VICTORIAS VS BOT
        </p>
        <div className="grid w-full grid-cols-3 gap-3">
          <Tile
            label="FÁCIL"
            value={String(stats.vsBotWins.easy)}
            color="var(--neon-green)"
          />
          <Tile
            label="MEDIO"
            value={String(stats.vsBotWins.medium)}
            color="var(--neon-yellow)"
          />
          <Tile
            label="DIFÍCIL"
            value={String(stats.vsBotWins.hard)}
            color="var(--neon-pink)"
          />
        </div>
      </section>

      {/* Achievements */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="font-press text-[10px] tracking-widest text-white/60">
            LOGROS
          </p>
          <p className="font-press text-[9px] tracking-widest text-white/40">
            {totalUnlocked} / {achievements.length}
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {achievements.map((a) => {
            const got = unlocked.has(a.id);
            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  got
                    ? "border-[var(--neon-yellow)]/55 bg-[var(--neon-yellow)]/5"
                    : "border-white/10 bg-black/20 opacity-60"
                }`}
              >
                <span
                  className="font-press text-base"
                  style={{
                    color: got ? "var(--neon-yellow)" : "rgba(255,255,255,0.2)",
                    textShadow: got ? "0 0 8px #ffd95c" : "none",
                  }}
                >
                  {got ? "★" : "☆"}
                </span>
                <div className="flex flex-col">
                  <span
                    className="font-press text-[10px] tracking-widest"
                    style={{
                      color: got ? "#fff" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {a.name}
                  </span>
                  <span className="font-vt text-sm text-white/60">
                    {a.description}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-center backdrop-blur-sm">
      <span className="font-press text-[8px] tracking-widest text-white/40">
        {label}
      </span>
      <span
        className="font-press text-base sm:text-lg"
        style={{
          color: color ?? "#fff",
          textShadow: color ? `0 0 8px ${color}` : "none",
        }}
      >
        {value}
      </span>
    </div>
  );
}
