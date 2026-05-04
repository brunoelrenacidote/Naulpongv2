"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PartySocket from "partysocket";
import GameCanvas from "@/components/GameCanvas";
import {
  CHARACTERS,
  GameState,
  POWER_EMOJIS,
  POWER_LABELS,
  ServerMessage,
  Side,
} from "@/lib/game-types";
import { partyHost } from "@/lib/party-host";
import {
  sfxCountdown,
  sfxGoal,
  sfxLose,
  sfxPaddleHit,
  sfxPower,
  sfxSpawn,
  sfxStart,
  sfxWall,
  sfxWin,
  unlockAudio,
} from "@/lib/sounds";

interface Props {
  code: string;
  isHost: boolean;
  mode: "quick" | "private";
}

export default function GameClient({ code, mode }: Props) {
  const [state, setState] = useState<GameState | null>(null);
  const [you, setYou] = useState<Side | "spectator">("spectator");
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<PartySocket | null>(null);
  const inputRef = useRef<{ up: boolean; down: boolean }>({
    up: false,
    down: false,
  });
  const lastSentRef = useRef<{ up: boolean; down: boolean }>({
    up: false,
    down: false,
  });
  const lastPhaseRef = useRef<string | null>(null);
  const lastEventTRef = useRef<number>(0);
  const lastCountdownNRef = useRef<number>(-1);

  // Connect
  useEffect(() => {
    const ws = new PartySocket({
      host: partyHost(),
      room: code.toLowerCase(),
    });
    wsRef.current = ws;
    ws.addEventListener("open", () => {
      setConnected(true);
    });
    ws.addEventListener("close", () => {
      setConnected(false);
    });
    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data) as ServerMessage;
        if (msg.type === "state") {
          setState(msg.state);
          setYou(msg.you);
          handleSounds(msg.state);
        } else if (msg.type === "assign") {
          setYou(msg.you);
        }
      } catch {
        // ignore
      }
    });

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Send input snapshot regularly
  useEffect(() => {
    const t = setInterval(() => {
      const cur = inputRef.current;
      const last = lastSentRef.current;
      if (cur.up !== last.up || cur.down !== last.down) {
        wsRef.current?.send(
          JSON.stringify({ type: "input", up: cur.up, down: cur.down }),
        );
        lastSentRef.current = { ...cur };
      }
    }, 30);
    return () => clearInterval(t);
  }, []);

  // Keyboard input
  useEffect(() => {
    function down(e: KeyboardEvent) {
      let changed = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        if (!inputRef.current.up) changed = true;
        inputRef.current.up = true;
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        if (!inputRef.current.down) changed = true;
        inputRef.current.down = true;
      }
      if (changed) {
        unlockAudio();
        e.preventDefault();
      }
    }
    function up(e: KeyboardEvent) {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        inputRef.current.up = false;
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        inputRef.current.down = false;
      }
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Touch input — split screen vertically: tap upper half = up, lower half = down
  const onTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    unlockAudio();
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const clientY =
      "touches" in e
        ? e.touches[0]?.clientY ?? rect.top
        : (e as React.MouseEvent).clientY;
    const relY = clientY - rect.top;
    const isUp = relY < rect.height / 2;
    inputRef.current.up = isUp;
    inputRef.current.down = !isUp;
  }, []);

  const onTouchEnd = useCallback(() => {
    inputRef.current.up = false;
    inputRef.current.down = false;
  }, []);

  function handleSounds(s: GameState) {
    // Countdown ticks
    if (s.phase === "COUNTDOWN") {
      const remaining = Math.max(0, s.countdownEndsAt - s.now);
      const n = Math.ceil(remaining / 1000);
      if (n !== lastCountdownNRef.current) {
        lastCountdownNRef.current = n;
        if (n > 0) sfxCountdown();
      }
    } else {
      lastCountdownNRef.current = -1;
    }

    if (s.phase !== lastPhaseRef.current) {
      if (lastPhaseRef.current === "COUNTDOWN" && s.phase === "PLAYING") {
        sfxStart();
      }
      if (s.phase === "FINISHED" && s.winner) {
        if (s.winner === you) sfxWin();
        else sfxLose();
      }
      lastPhaseRef.current = s.phase;
    }

    if (s.lastEvent && s.lastEvent.t !== lastEventTRef.current) {
      lastEventTRef.current = s.lastEvent.t;
      switch (s.lastEvent.kind) {
        case "hit":
          sfxPaddleHit();
          break;
        case "wall":
          sfxWall();
          break;
        case "goal":
          sfxGoal();
          break;
        case "power":
          sfxPower();
          break;
        case "spawn":
          sfxSpawn();
          break;
      }
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/play/${code}`;
    navigator.clipboard?.writeText(url).catch(() => {
      /* ignore */
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function rematch() {
    wsRef.current?.send(JSON.stringify({ type: "rematch" }));
  }

  const playing =
    state &&
    (state.phase === "PLAYING" ||
      state.phase === "COUNTDOWN" ||
      state.phase === "GOAL");

  const leftCh = state ? CHARACTERS[state.characters.left] : null;
  const rightCh = state ? CHARACTERS[state.characters.right] : null;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <Link
          href="/"
          className="font-press text-[10px] text-white/60 hover:text-white"
        >
          ← MENÚ
        </Link>
        <div className="font-press flex items-center gap-2 text-[10px] text-white/70">
          <span className="opacity-60">SALA</span>
          <button
            onClick={copyLink}
            className="glow-cyan rounded border border-[var(--neon-cyan)] px-2 py-1 hover:bg-[var(--neon-cyan)]/10"
          >
            {copied ? "¡COPIADO!" : code}
          </button>
        </div>
        <span className="font-press text-[10px] text-white/40">
          {connected ? "● ONLINE" : "○ OFFLINE"}
        </span>
      </div>

      {/* HUD */}
      <div className="flex w-full max-w-[960px] items-center justify-between gap-2 rounded border border-white/10 bg-black/40 p-2">
        <PlayerCard
          ch={leftCh}
          score={state?.scores.left ?? 0}
          you={you === "left"}
          paddleEffects={state ? activeEffects(state, "left") : []}
        />
        <div className="font-press text-center text-xs text-white/70 sm:text-sm">
          <div>{state?.phase ?? "..."}</div>
          {mode === "quick" && state?.phase === "WAITING" && (
            <div className="text-[8px] opacity-70">PARTIDA RÁPIDA</div>
          )}
        </div>
        <PlayerCard
          ch={rightCh}
          score={state?.scores.right ?? 0}
          you={you === "right"}
          paddleEffects={state ? activeEffects(state, "right") : []}
          right
        />
      </div>

      {/* Game canvas */}
      <div
        className="w-full max-w-[960px] touch-none select-none"
        onTouchStart={onTouch}
        onTouchMove={onTouch}
        onTouchEnd={onTouchEnd}
        onMouseDown={(e) => {
          if (window.matchMedia("(pointer: coarse)").matches) onTouch(e);
        }}
        onMouseUp={onTouchEnd}
        onMouseLeave={onTouchEnd}
      >
        <GameCanvas state={state} you={you} />
      </div>

      {/* Bottom panel: instructions / actions */}
      <div className="font-press flex w-full max-w-[960px] flex-wrap items-center justify-center gap-3 rounded border border-white/10 bg-black/40 p-2 text-[10px] text-white/70">
        {state?.phase === "WAITING" && (
          <span>
            COMPARTÍ EL CÓDIGO <span className="glow-cyan">{code}</span> O EL
            LINK PARA QUE TU RIVAL ENTRE.
          </span>
        )}
        {playing && (
          <>
            <span>
              ↑ / W : ARRIBA &nbsp;&nbsp; ↓ / S : ABAJO &nbsp;&nbsp;
              <span className="opacity-60">(en mobile, tocá la mitad superior/inferior)</span>
            </span>
          </>
        )}
        {state?.phase === "FINISHED" && (
          <div className="flex flex-col items-center gap-3">
            <div>
              {state.winner === you
                ? "¡GANASTE!"
                : you === "spectator"
                  ? "PARTIDA TERMINADA"
                  : "PERDISTE"}
            </div>
            <div className="flex gap-3">
              <button className="btn-arcade yellow" onClick={rematch}>
                REVANCHA
              </button>
              <Link href="/" className="btn-arcade pink">
                MENÚ
              </Link>
            </div>
            {state.rematchVotes && (
              <div className="text-[8px] opacity-70">
                {state.rematchVotes.left ? "✓" : "○"} izquierda &nbsp;
                {state.rematchVotes.right ? "✓" : "○"} derecha
              </div>
            )}
          </div>
        )}
      </div>

      {/* Power legend */}
      <details className="font-press w-full max-w-[960px] rounded border border-white/10 bg-black/30 p-2 text-[9px] text-white/60">
        <summary className="cursor-pointer">PODERES (clic para abrir)</summary>
        <ul className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
          {Object.entries(POWER_LABELS).map(([id, label]) => (
            <li key={id} className="flex items-center gap-2">
              <span className="text-base">
                {POWER_EMOJIS[id as keyof typeof POWER_EMOJIS]}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function activeEffects(state: GameState, side: Side): string[] {
  const out: string[] = [];
  const p = state.paddles[side];
  if (p.shield) out.push("🛡️");
  if (p.frozenUntil > state.now) out.push("❄️");
  if (p.invertedUntil > state.now) out.push("🔄");
  for (const b of p.activeBuffs) {
    if (b.power === "paddleXL") out.push("📏");
    if (b.power === "paddleMini") out.push("🔪");
  }
  if (state.speedMul !== 1 && state.speedMulUntil > state.now) {
    out.push("🐢");
  }
  return out;
}

function PlayerCard({
  ch,
  score,
  you,
  paddleEffects,
  right,
}: {
  ch: { id: string; name: string; color: string; emoji: string } | null;
  score: number;
  you: boolean;
  paddleEffects: string[];
  right?: boolean;
}) {
  if (!ch) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <div className="font-press text-xs text-white/40">...</div>
      </div>
    );
  }
  return (
    <div
      className={`flex flex-1 items-center gap-3 ${
        right ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded border-2 sm:h-16 sm:w-16"
        style={{
          borderColor: ch.color,
          boxShadow: `0 0 12px ${ch.color}`,
          background: "rgba(0,0,0,0.6)",
        }}
      >
        <span className="text-2xl sm:text-3xl">{ch.emoji}</span>
      </div>
      <div className={`flex flex-col ${right ? "items-end" : "items-start"}`}>
        <div
          className="font-press text-[8px] sm:text-[10px]"
          style={{ color: ch.color }}
        >
          {ch.name}
          {you ? " (VOS)" : ""}
        </div>
        <div className="font-press text-2xl text-white sm:text-3xl">{score}</div>
        <div className="text-base sm:text-lg">{paddleEffects.join(" ")}</div>
      </div>
    </div>
  );
}
