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
    <div className="console-identity">
      <span className="ident-tag">CALLSIGN</span>
      {editing ? (
        <div className="flex w-full max-w-xs flex-col items-stretch gap-2">
          <input
            autoFocus
            maxLength={12}
            className="console-input"
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
              type="button"
              className="console-btn danger"
              onClick={() => setEditing(false)}
            >
              CANCELAR
            </button>
            <button
              type="button"
              className="console-btn cyan"
              onClick={save}
            >
              GUARDAR
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="console-nick-btn"
          aria-label="Editar nombre"
        >
          {initial || "—"}
        </button>
      )}
    </div>
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
      <section
        className="console-panel accent-cyan"
        style={{ animationDelay: "200ms" } as React.CSSProperties}
      >
        <span className="console-panel-tag">{"// LOADING"}</span>
        <span className="console-panel-bracket tl" aria-hidden />
        <span className="console-panel-bracket tr" aria-hidden />
        <span className="console-panel-bracket bl" aria-hidden />
        <span className="console-panel-bracket br" aria-hidden />
        <p className="console-prose" aria-live="polite">
          <span className="hl-cyan">CARGANDO DOSSIER...</span>
        </p>
      </section>
    );
  }

  const achievements: Achievement[] = Object.values(ACHIEVEMENTS);
  const totalUnlocked = achievements.filter((a) => unlocked.has(a.id)).length;

  return (
    <>
      <section
        className="console-panel accent-cyan"
        style={{ animationDelay: "200ms" } as React.CSSProperties}
      >
        <span className="console-panel-tag">{"// IDENTITY"}</span>
        <span className="console-panel-bracket tl" aria-hidden />
        <span className="console-panel-bracket tr" aria-hidden />
        <span className="console-panel-bracket bl" aria-hidden />
        <span className="console-panel-bracket br" aria-hidden />
        <h2 className="console-panel-title">
          <span className="glyph">⚙</span>
          OPERATOR ID
        </h2>
        <NickEditor initial={nick} onChange={(n) => setNick(n)} />
      </section>

      <section
        className="console-panel accent-orange"
        style={{ animationDelay: "260ms" } as React.CSSProperties}
      >
        <span className="console-panel-tag">{"// COMBAT STATS"}</span>
        <span className="console-panel-bracket tl" aria-hidden />
        <span className="console-panel-bracket tr" aria-hidden />
        <span className="console-panel-bracket bl" aria-hidden />
        <span className="console-panel-bracket br" aria-hidden />
        <h2 className="console-panel-title">
          <span className="glyph">▲</span>
          ESTADÍSTICAS
        </h2>
        <div className="console-stat-grid">
          <Stat label="PARTIDOS" value={String(stats.matches)} delay={160} />
          <Stat
            label="VICTORIAS"
            value={String(stats.wins)}
            color="green"
            delay={200}
          />
          <Stat
            label="DERROTAS"
            value={String(stats.losses)}
            color="red"
            delay={240}
          />
          <Stat
            label="% VICTORIA"
            value={`${winRate(stats)}%`}
            color="gold"
            delay={280}
          />
          <Stat
            label="RACHA"
            value={String(stats.currentStreak)}
            color="cyan"
            delay={320}
          />
          <Stat
            label="MEJOR RACHA"
            value={String(stats.bestStreak)}
            color="gold"
            delay={360}
          />
          <Stat label="GOLES +" value={String(stats.goalsFor)} delay={400} />
          <Stat label="GOLES –" value={String(stats.goalsAgainst)} delay={440} />
          <Stat
            label="POWER-UPS"
            value={String(stats.powerUpsTaken)}
            color="pink"
            delay={480}
          />
          <Stat
            label="SHUTOUTS"
            value={String(stats.shutoutWins)}
            color="green"
            delay={520}
          />
          <Stat
            label="MÁS RÁPIDA"
            value={
              stats.fastestWinMs == null
                ? "—"
                : formatDuration(stats.fastestWinMs)
            }
            delay={560}
          />
          <Stat
            label="TIEMPO TOTAL"
            value={formatDuration(stats.totalPlayMs)}
            delay={600}
          />
        </div>
      </section>

      <section
        className="console-panel accent-purple"
        style={{ animationDelay: "320ms" } as React.CSSProperties}
      >
        <span className="console-panel-tag">{"// VS BOT"}</span>
        <span className="console-panel-bracket tl" aria-hidden />
        <span className="console-panel-bracket tr" aria-hidden />
        <span className="console-panel-bracket bl" aria-hidden />
        <span className="console-panel-bracket br" aria-hidden />
        <h2 className="console-panel-title">
          <span className="glyph">⌬</span>
          VICTORIAS VS BOT
        </h2>
        <div className="console-stat-grid cols-3">
          <Stat
            label="FÁCIL"
            value={String(stats.vsBotWins.easy)}
            color="green"
            delay={160}
          />
          <Stat
            label="MEDIO"
            value={String(stats.vsBotWins.medium)}
            color="gold"
            delay={220}
          />
          <Stat
            label="DIFÍCIL"
            value={String(stats.vsBotWins.hard)}
            color="red"
            delay={280}
          />
        </div>
      </section>

      <section
        className="console-panel accent-gold"
        style={{ animationDelay: "380ms" } as React.CSSProperties}
      >
        <span className="console-panel-tag">{"// ACHIEVEMENTS"}</span>
        <span className="console-panel-bracket tl" aria-hidden />
        <span className="console-panel-bracket tr" aria-hidden />
        <span className="console-panel-bracket bl" aria-hidden />
        <span className="console-panel-bracket br" aria-hidden />
        <h2 className="console-panel-title">
          <span className="glyph">★</span>
          LOGROS
          <span className="console-counter-pill" aria-label="Logros desbloqueados">
            {totalUnlocked} / {achievements.length}
          </span>
        </h2>
        <ul className="console-achievement-list">
          {achievements.map((a, i) => {
            const got = unlocked.has(a.id);
            return (
              <li
                key={a.id}
                className={`console-achievement ${got ? "unlocked" : ""}`}
                style={{
                  animationDelay: `${200 + i * 60}ms`,
                  animation: "console-fade-up 500ms ease-out both",
                } as React.CSSProperties}
              >
                <span className="star" aria-hidden>
                  {got ? "★" : "☆"}
                </span>
                <div className="flex flex-col">
                  <span className="name">{a.name}</span>
                  <span className="desc">{a.description}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  color,
  delay = 200,
}: {
  label: string;
  value: string;
  color?: "cyan" | "orange" | "gold" | "green" | "pink" | "red";
  delay?: number;
}) {
  return (
    <div
      className={`console-stat${color ? ` color-${color}` : ""}`}
      style={{ "--delay": `${delay}ms` } as React.CSSProperties}
    >
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}
