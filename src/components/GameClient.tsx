"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PartySocket from "partysocket";
import GameCanvas from "@/components/GameCanvas";
import {
  CHARACTERS,
  FIELD_H,
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

interface InputState {
  up: boolean;
  down: boolean;
  targetY: number | null;
}

function readNick(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem("naulpong:nick") ?? "").toUpperCase();
}

export default function GameClient({ code, mode }: Props) {
  const [state, setState] = useState<GameState | null>(null);
  const [you, setYou] = useState<Side | "spectator">("spectator");
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<PartySocket | null>(null);
  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    targetY: null,
  });
  const lastSentRef = useRef<InputState>({
    up: false,
    down: false,
    targetY: null,
  });
  const lastPhaseRef = useRef<string | null>(null);
  const lastEventTRef = useRef<number>(0);
  const lastCountdownNRef = useRef<number>(-1);
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  // Connect
  useEffect(() => {
    const ws = new PartySocket({
      host: partyHost(),
      room: code.toLowerCase(),
    });
    wsRef.current = ws;
    ws.addEventListener("open", () => {
      setConnected(true);
      // send nick once connected
      const nick = readNick();
      if (nick) ws.send(JSON.stringify({ type: "nick", nick }));
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

  // Send input snapshot regularly (when changed, plus periodic targetY refresh)
  useEffect(() => {
    const t = setInterval(() => {
      const cur = inputRef.current;
      const last = lastSentRef.current;
      const targetChanged =
        cur.targetY !== last.targetY &&
        !(cur.targetY === null && last.targetY === null);
      if (
        cur.up !== last.up ||
        cur.down !== last.down ||
        targetChanged
      ) {
        wsRef.current?.send(
          JSON.stringify({
            type: "input",
            up: cur.up,
            down: cur.down,
            targetY: cur.targetY,
          }),
        );
        lastSentRef.current = { ...cur };
      }
    }, 33);
    return () => clearInterval(t);
  }, []);

  // Keyboard input
  useEffect(() => {
    function down(e: KeyboardEvent) {
      let changed = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        if (!inputRef.current.up) changed = true;
        inputRef.current.up = true;
        inputRef.current.targetY = null; // keyboard wins over drag
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        if (!inputRef.current.down) changed = true;
        inputRef.current.down = true;
        inputRef.current.targetY = null;
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

  // Drag input — paddle follows finger / pointer Y, mapped into field coords.
  // Works on mobile (touchstart/touchmove) and desktop (mousedown/mousemove).
  const setTargetFromClientY = useCallback((clientY: number) => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const rel = (clientY - rect.top) / rect.height;
    const fieldY = Math.max(0, Math.min(FIELD_H, rel * FIELD_H));
    inputRef.current.targetY = fieldY;
    inputRef.current.up = false;
    inputRef.current.down = false;
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    let dragging = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault();
      unlockAudio();
      dragging = true;
      setTargetFromClientY(e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging || e.touches.length === 0) return;
      e.preventDefault();
      setTargetFromClientY(e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      dragging = false;
      inputRef.current.targetY = null;
    };
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      unlockAudio();
      dragging = true;
      setTargetFromClientY(e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setTargetFromClientY(e.clientY);
    };
    const onMouseUp = () => {
      dragging = false;
      inputRef.current.targetY = null;
    };

    surface.addEventListener("touchstart", onTouchStart, { passive: false });
    surface.addEventListener("touchmove", onTouchMove, { passive: false });
    surface.addEventListener("touchend", onTouchEnd);
    surface.addEventListener("touchcancel", onTouchEnd);
    surface.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      surface.removeEventListener("touchstart", onTouchStart);
      surface.removeEventListener("touchmove", onTouchMove);
      surface.removeEventListener("touchend", onTouchEnd);
      surface.removeEventListener("touchcancel", onTouchEnd);
      surface.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [setTargetFromClientY]);

  function handleSounds(s: GameState) {
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

  const phaseLabel = (() => {
    if (!state) return "...";
    switch (state.phase) {
      case "WAITING":
        return "ESPERANDO";
      case "COUNTDOWN":
        return "LISTO?";
      case "PLAYING":
        return "JUGAR";
      case "GOAL":
        return "GOL!";
      case "FINISHED":
        return "FIN";
    }
  })();

  return (
    <div className="flex w-full flex-col items-center gap-2">
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
          nick={state?.nicks?.left ?? ""}
          score={state?.scores.left ?? 0}
          you={you === "left"}
          paddleEffects={state ? activeEffects(state, "left") : []}
        />
        <div className="font-press flex flex-col items-center text-center text-[10px] text-white/70">
          <div className="text-xs sm:text-sm">{phaseLabel}</div>
          {mode === "quick" && state?.phase === "WAITING" && (
            <div className="text-[8px] opacity-70">PARTIDA RÁPIDA</div>
          )}
        </div>
        <PlayerCard
          ch={rightCh}
          nick={state?.nicks?.right ?? ""}
          score={state?.scores.right ?? 0}
          you={you === "right"}
          paddleEffects={state ? activeEffects(state, "right") : []}
          right
        />
      </div>

      {/* Game canvas */}
      <div
        ref={surfaceRef}
        className="w-full max-w-[960px] touch-none select-none"
        style={{ cursor: "grab" }}
      >
        <GameCanvas state={state} you={you} />
      </div>

      {/* Bottom panel */}
      <div className="font-press flex w-full max-w-[960px] flex-wrap items-center justify-center gap-3 rounded border border-white/10 bg-black/40 p-2 text-center text-[10px] text-white/70">
        {state?.phase === "WAITING" && (
          <span>
            COMPARTÍ EL CÓDIGO <span className="glow-cyan">{code}</span> O EL
            LINK PARA QUE TU RIVAL ENTRE.
          </span>
        )}
        {playing && (
          <span>
            <span className="opacity-90">DESLIZÁ</span> arriba/abajo en la
            cancha &nbsp;·&nbsp; ↑/↓ o W/S en teclado
          </span>
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
  nick,
  score,
  you,
  paddleEffects,
  right,
}: {
  ch: { id: string; name: string; color: string; emoji: string } | null;
  nick: string;
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
  const display = nick || (you ? "VOS" : "P" + (right ? "2" : "1"));
  return (
    <div
      className={`flex flex-1 items-center gap-2 sm:gap-3 ${
        right ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 sm:h-14 sm:w-14"
        style={{
          borderColor: ch.color,
          boxShadow: `0 0 10px ${ch.color}`,
          background: "rgba(0,0,0,0.6)",
          imageRendering: "pixelated",
        }}
      >
        <span className="text-2xl sm:text-3xl">{ch.emoji}</span>
      </div>
      <div className={`flex flex-col ${right ? "items-end" : "items-start"}`}>
        <div
          className="font-press text-[8px] sm:text-[9px]"
          style={{ color: ch.color }}
        >
          {display}
          {you ? " (VOS)" : ""}
        </div>
        <div
          className="font-press text-[7px] opacity-60 sm:text-[8px]"
          style={{ color: ch.color }}
        >
          {ch.name}
        </div>
        <div className="font-press text-2xl text-white sm:text-3xl">{score}</div>
        <div className="text-base sm:text-lg">{paddleEffects.join(" ")}</div>
      </div>
    </div>
  );
}
