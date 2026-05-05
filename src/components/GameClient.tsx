"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PartySocket from "partysocket";
import GameCanvas from "@/components/GameCanvas";
import CharacterPreview from "@/components/CharacterPreview";
import AchievementToast from "@/components/AchievementToast";
import {
  CHARACTERS,
  CharacterId,
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
import { Achievement, recordMatch } from "@/lib/stats";

interface Props {
  code: string;
  isHost: boolean;
  mode: "quick" | "private" | "bot";
  botDifficulty?: "easy" | "medium" | "hard";
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

export default function GameClient({ code, mode, botDifficulty }: Props) {
  const [state, setState] = useState<GameState | null>(null);
  const [you, setYou] = useState<Side | "spectator">("spectator");
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPowers, setShowPowers] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    Achievement[]
  >([]);
  const matchStartRef = useRef<number | null>(null);
  const matchEndedRef = useRef<boolean>(false);
  const powerUpsTakenRef = useRef<number>(0);
  const powerEventRef = useRef<number>(0);
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
      query:
        mode === "bot"
          ? { bot: "1", difficulty: botDifficulty ?? "medium" }
          : undefined,
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
          handleStatsTracking(msg.state, msg.you);
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

  function handleStatsTracking(s: GameState, side: Side | "spectator") {
    // Reset counters on a new match (whenever a fresh COUNTDOWN starts).
    if (s.phase === "COUNTDOWN" && matchEndedRef.current) {
      matchEndedRef.current = false;
      matchStartRef.current = null;
      powerUpsTakenRef.current = 0;
    }
    // Lock in the start time when play actually begins.
    if (s.phase === "PLAYING" && matchStartRef.current == null) {
      matchStartRef.current = Date.now();
    }
    // Count power-ups picked up on our side.
    if (
      s.lastEvent?.kind === "power" &&
      s.lastEvent.t !== powerEventRef.current &&
      side !== "spectator" &&
      s.lastEvent.side === side
    ) {
      powerEventRef.current = s.lastEvent.t;
      powerUpsTakenRef.current += 1;
    }
    // Record once when the match finishes.
    if (
      s.phase === "FINISHED" &&
      !matchEndedRef.current &&
      side !== "spectator" &&
      s.winner != null
    ) {
      matchEndedRef.current = true;
      const start = matchStartRef.current ?? Date.now();
      const durationMs = Math.max(0, Date.now() - start);
      const won = s.winner === side;
      const goalsFor = s.scores[side];
      const goalsAgainst =
        s.scores[side === "left" ? "right" : "left"];
      const result = recordMatch({
        won,
        goalsFor,
        goalsAgainst,
        durationMs,
        powerUpsTaken: powerUpsTakenRef.current,
        vsBot: mode === "bot" ? (botDifficulty ?? "medium") : null,
        vsHuman: mode !== "bot",
      });
      if (result.unlocked.length > 0) {
        setUnlockedAchievements((prev) => [...prev, ...result.unlocked]);
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

  const modeLabel: string = (() => {
    if (mode === "bot") {
      const d =
        botDifficulty === "easy"
          ? "FÁCIL"
          : botDifficulty === "hard"
            ? "DIFÍCIL"
            : "MEDIO";
      return `BOT · ${d}`;
    }
    if (mode === "quick") return "PARTIDA RÁPIDA";
    return "SALA PRIVADA";
  })();

  const leftEffects = state ? activeEffects(state, "left") : [];
  const rightEffects = state ? activeEffects(state, "right") : [];
  const finished = state?.phase === "FINISHED";

  return (
    <div className="flex w-full flex-col items-center gap-2 sm:gap-3">
      <AchievementToast
        achievements={unlockedAchievements}
        onDone={(id) =>
          setUnlockedAchievements((prev) => prev.filter((a) => a.id !== id))
        }
      />

      {/* Top bar — compacto, una sola fila en mobile */}
      <div className="flex w-full max-w-[960px] items-center justify-between gap-2 px-1">
        <Link
          href="/"
          className="font-press flex items-center gap-1 text-[10px] tracking-widest text-white/55 hover:text-white"
          aria-label="Volver al menú"
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">MENÚ</span>
        </Link>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="pixel-pill" title={modeLabel}>
            {modeLabel}
          </span>
          {mode !== "bot" && (
            <button
              onClick={copyLink}
              className="pixel-pill"
              style={{
                color: "var(--neon-cyan)",
                borderColor: "rgba(92,255,224,0.55)",
              }}
              aria-label={`Copiar link de la sala ${code}`}
            >
              {copied ? "¡COPIADO!" : `SALA ${code}`}
            </button>
          )}
        </div>
        <span
          className={`pixel-pill ${connected ? "" : "opacity-60"}`}
          style={{
            color: connected ? "var(--neon-green)" : "rgba(255,255,255,0.5)",
            borderColor: connected
              ? "rgba(92,255,138,0.55)"
              : "rgba(255,255,255,0.18)",
          }}
        >
          {connected ? "● ON" : "○ OFF"}
        </span>
      </div>

      {/* HUD compacto: portraits + scores + VS */}
      <div className="pixel-frame flex w-full max-w-[960px] items-center justify-between gap-2 px-2 py-2 sm:px-3">
        <PlayerCard
          ch={leftCh}
          nick={state?.nicks?.left ?? ""}
          score={state?.scores.left ?? 0}
          you={you === "left"}
        />
        <div className="font-press flex flex-col items-center justify-center px-1 text-center">
          <div className="text-[8px] tracking-widest text-white/40 sm:text-[10px]">
            {phaseLabel}
          </div>
          <div className="font-vt text-[18px] leading-none text-white/60 sm:text-2xl">
            VS
          </div>
        </div>
        <PlayerCard
          ch={rightCh}
          nick={state?.nicks?.right ?? ""}
          score={state?.scores.right ?? 0}
          you={you === "right"}
          right
        />
      </div>

      {/* Game canvas + overlays */}
      <div className="relative w-full max-w-[960px]">
        <div
          ref={surfaceRef}
          className="touch-none select-none"
          style={{ cursor: "grab" }}
        >
          <GameCanvas state={state} you={you} />
        </div>

        {/* Power chips flotantes encima del canvas */}
        {leftEffects.length > 0 && (
          <div
            className="pointer-events-none absolute left-2 top-2 flex max-w-[45%] flex-wrap gap-1"
            aria-label="Poderes activos jugador izquierdo"
          >
            {leftEffects.map((e, i) => (
              <span key={`L-${i}`} className="power-chip">
                {e}
              </span>
            ))}
          </div>
        )}
        {rightEffects.length > 0 && (
          <div
            className="pointer-events-none absolute right-2 top-2 flex max-w-[45%] flex-wrap justify-end gap-1"
            aria-label="Poderes activos jugador derecho"
          >
            {rightEffects.map((e, i) => (
              <span key={`R-${i}`} className="power-chip">
                {e}
              </span>
            ))}
          </div>
        )}

        {/* Hint de drag — solo cuando no se está jugando */}
        {state &&
          (state.phase === "WAITING" || state.phase === "COUNTDOWN") &&
          you !== "spectator" && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center"
              aria-hidden
            >
              <span className="drag-pulse pixel-pill text-[8px] sm:text-[9px]">
                ↕ DESLIZÁ PARA MOVER ↕
              </span>
            </div>
          )}

        {/* Botón flotante "?" — abre la leyenda de poderes */}
        <button
          type="button"
          onClick={() => setShowPowers(true)}
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--neon-yellow)] bg-black/70 font-press text-[14px] text-[var(--neon-yellow)] shadow-[0_0_10px_rgba(255,217,92,0.55)] transition hover:bg-[var(--neon-yellow)]/15 active:translate-y-[1px]"
          aria-label="Ver lista de poderes"
        >
          ?
        </button>

        {/* Overlay FINISHED a pantalla del canvas */}
        {finished && state && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <div className="pixel-frame mx-3 flex max-w-sm flex-col items-center gap-4 px-5 py-5 text-center sm:gap-5 sm:px-7 sm:py-6">
              {you === "spectator" ? (
                <p className="font-press text-base tracking-widest text-white/80">
                  PARTIDA
                  <br />
                  TERMINADA
                </p>
              ) : state.winner === you ? (
                <>
                  <span className="crown-bob text-3xl sm:text-4xl" aria-hidden>
                    👑
                  </span>
                  <p
                    className="pixel-headline glow-yellow"
                    style={{ color: "var(--neon-yellow)" }}
                  >
                    ¡GANASTE!
                  </p>
                  <p className="font-press text-[9px] tracking-widest text-white/55">
                    {state.scores.left} - {state.scores.right}
                  </p>
                </>
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl" aria-hidden>
                    💀
                  </span>
                  <p
                    className="pixel-headline glow-pink"
                    style={{ color: "var(--neon-pink)" }}
                  >
                    PERDISTE
                  </p>
                  <p className="font-press text-[9px] tracking-widest text-white/55">
                    {state.scores.left} - {state.scores.right}
                  </p>
                </>
              )}
              <div className="flex w-full flex-col gap-3">
                <button className="btn-chunky yellow" onClick={rematch}>
                  🔁 REVANCHA
                </button>
                <Link href="/" className="btn-chunky pink text-center">
                  🏠 MENÚ
                </Link>
              </div>
              {state.rematchVotes && mode !== "bot" && (
                <div className="font-press text-[8px] tracking-widest text-white/40">
                  {state.rematchVotes.left ? "✓" : "○"} P1 · {" "}
                  {state.rematchVotes.right ? "✓" : "○"} P2
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help text bar — solo en estados no-PLAYING */}
      {!playing && !finished && (
        <div className="font-press flex w-full max-w-[960px] items-center justify-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-center text-[9px] tracking-wider text-white/70 sm:text-[10px]">
          {state?.phase === "WAITING" && mode !== "bot" && (
            <span>
              COMPARTÍ EL CÓDIGO{" "}
              <span className="glow-cyan">{code}</span> CON TU RIVAL.
            </span>
          )}
          {state?.phase === "WAITING" && mode === "bot" && (
            <span className="opacity-80">PREPARANDO BOT…</span>
          )}
        </div>
      )}

      {/* Modal de poderes */}
      {showPowers && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setShowPowers(false)}
        >
          <div
            className="pixel-frame relative w-full max-w-md p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-press glow-yellow text-xs tracking-widest sm:text-sm">
                LOS 8 PODERES
              </p>
              <button
                type="button"
                onClick={() => setShowPowers(false)}
                className="font-press flex h-7 w-7 items-center justify-center rounded border border-white/30 text-[12px] text-white/80 transition hover:bg-white/10"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
              {Object.entries(POWER_LABELS).map(([id, label]) => (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-2 font-press text-[9px] tracking-wider text-white/80"
                >
                  <span className="text-lg">
                    {POWER_EMOJIS[id as keyof typeof POWER_EMOJIS]}
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
  right,
}: {
  ch: { id: CharacterId; name: string; color: string; emoji: string } | null;
  nick: string;
  score: number;
  you: boolean;
  right?: boolean;
}) {
  if (!ch) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <div className="font-press text-[10px] text-white/40">…</div>
      </div>
    );
  }
  const display = nick || (you ? "VOS" : right ? "P2" : "P1");
  return (
    <div
      className={`flex flex-1 items-center gap-2 sm:gap-3 ${
        right ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md sm:h-16 sm:w-16"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.55))",
          border: `1px solid ${ch.color}55`,
          boxShadow: `inset 0 0 12px ${ch.color}22, 0 0 8px ${ch.color}55`,
        }}
      >
        <CharacterPreview id={ch.id} scale={2} glow={ch.color} />
      </div>
      <div
        className={`flex min-w-0 flex-col ${right ? "items-end" : "items-start"}`}
      >
        <div
          className="font-press max-w-[110px] truncate text-[8px] tracking-widest sm:max-w-[200px] sm:text-[10px]"
          style={{ color: ch.color }}
          title={display}
        >
          {display}
          {you ? " · TÚ" : ""}
        </div>
        <div
          className="font-press mt-0.5 hidden max-w-[140px] truncate text-[7px] tracking-wider opacity-60 sm:block sm:max-w-[200px] sm:text-[8px]"
          style={{ color: ch.color }}
          title={ch.name}
        >
          {ch.name}
        </div>
        <div className="font-press mt-0.5 text-2xl leading-none text-white sm:mt-1 sm:text-4xl">
          {score}
        </div>
      </div>
    </div>
  );
}
