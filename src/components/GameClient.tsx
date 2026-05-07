"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import PartySocket from "partysocket";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  CircleHelp,
  Crown,
  Gamepad2,
  Hourglass,
  House,
  KeyRound,
  Move,
  Play,
  RefreshCw,
  Repeat,
  Rocket,
  Ruler,
  Scissors,
  Shield,
  Skull,
  Snail,
  Snowflake,
  Sparkles,
  Swords,
  Tornado,
  Users,
  Wifi,
  WifiOff,
  X as IconX,
  Zap,
} from "lucide-react";
import GameCanvas from "@/components/GameCanvas";
import CharacterPreview from "@/components/CharacterPreview";
import AchievementToast from "@/components/AchievementToast";
import {
  CHARACTERS,
  CharacterId,
  FIELD_H,
  GameState,
  POWER_LABELS,
  type PowerId,
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
import { apiPushStats, loadSession } from "@/lib/auth-client";

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
      // Cloud sync best-effort. Si no hay sesión, no pasa nada.
      const session = loadSession();
      if (session) {
        const allUnlocked = (() => {
          try {
            const raw = window.localStorage.getItem(
              "naulpong:achievements:v1",
            );
            return raw ? (JSON.parse(raw) as string[]) : [];
          } catch {
            return [];
          }
        })();
        apiPushStats(
          session.token,
          result.newStats,
          allUnlocked as never,
        ).catch(() => {
          /* offline ok */
        });
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

  const phaseClass = (() => {
    if (!state) return "waiting";
    switch (state.phase) {
      case "PLAYING":
        return "live";
      case "COUNTDOWN":
      case "GOAL":
        return "countdown";
      case "FINISHED":
        return "finished";
      default:
        return "waiting";
    }
  })();

  return (
    <div className="arena-content">
      <AchievementToast
        achievements={unlockedAchievements}
        onDone={(id) =>
          setUnlockedAchievements((prev) => prev.filter((a) => a.id !== id))
        }
      />

      {/* Marquee superior: MENÚ · phase · mode · sala · conexión */}
      <div className="arena-marquee">
        <div className="arena-marquee-side">
          <Link href="/" className="arena-back" aria-label="Volver al menú">
            <ArrowLeft aria-hidden focusable="false" />
            <span className="arena-back-label">MENÚ</span>
          </Link>
          <span
            className={`arena-chip phase ${phaseClass}`}
            aria-live="polite"
          >
            <PhaseIcon phase={state?.phase} />
            <span className="arena-chip-text hide-xs">{phaseLabel}</span>
          </span>
        </div>
        <div className="arena-marquee-side">
          <span className="arena-chip mode" title={modeLabel}>
            <ModeIcon mode={mode} />
            <span className="arena-chip-text hide-xs">{modeLabel}</span>
          </span>
          {mode !== "bot" && (
            <button
              onClick={copyLink}
              className={`arena-chip room ${copied ? "copied" : ""}`}
              aria-label={`Copiar link de la sala ${code}`}
            >
              {copied ? (
                <Check aria-hidden focusable="false" />
              ) : (
                <KeyRound aria-hidden focusable="false" />
              )}
              <span className="arena-chip-text">
                {copied ? "COPIADO" : code}
              </span>
            </button>
          )}
        </div>
        <div className="arena-marquee-side right">
          <span
            className={`arena-chip conn ${connected ? "online" : ""}`}
            aria-label={connected ? "Conectado" : "Desconectado"}
          >
            {connected ? (
              <Wifi aria-hidden focusable="false" />
            ) : (
              <WifiOff aria-hidden focusable="false" />
            )}
            <span className="arena-chip-text hide-xs">
              {connected ? "ONLINE" : "OFFLINE"}
            </span>
          </span>
        </div>
      </div>

      <div className="arena-grid">
        {/* HUD compacto (mobile + tablet) */}
        <div className="arena-hud-mobile">
          <PlayerCardCompact
            ch={leftCh}
            nick={state?.nicks?.left ?? ""}
            score={state?.scores.left ?? 0}
            you={you === "left"}
          />
          <div className="arena-hud-vs" aria-hidden>
            <span className="arena-hud-vs-label">VS</span>
            <div className="arena-hud-vs-icon">
              <Swords aria-hidden focusable="false" />
            </div>
          </div>
          <PlayerCardCompact
            ch={rightCh}
            nick={state?.nicks?.right ?? ""}
            score={state?.scores.right ?? 0}
            you={you === "right"}
            right
          />
        </div>

        {/* Rail izquierdo (desktop) — player card grande P1 */}
        <aside className="arena-rail-left" aria-label="Jugador 1">
          <PlayerCardTall
            ch={leftCh}
            nick={state?.nicks?.left ?? ""}
            score={state?.scores.left ?? 0}
            you={you === "left"}
            buffs={leftEffects}
          />
          <ControlsHelpPanel mode={mode} />
        </aside>

        {/* Columna principal — frame con la cancha */}
        <section className="arena-main">
          <div className="arena-frame">
            <span className="arena-corner tl" aria-hidden />
            <span className="arena-corner tr" aria-hidden />
            <span className="arena-corner bl" aria-hidden />
            <span className="arena-corner br" aria-hidden />
            <div
              ref={surfaceRef}
              className="arena-surface-wrap touch-none select-none"
            >
              <GameCanvas state={state} you={you} />

              {/* Buffs overlay (solo mobile) */}
              {leftEffects.length > 0 && (
                <div
                  className="arena-overlay-buffs left"
                  aria-label="Poderes activos jugador izquierdo"
                >
                  {leftEffects.map((e, i) => (
                    <span
                      key={`L-${e}-${i}`}
                      className="arena-buff"
                      title={POWER_LABELS[e]}
                    >
                      <PowerIcon power={e} />
                    </span>
                  ))}
                </div>
              )}
              {rightEffects.length > 0 && (
                <div
                  className="arena-overlay-buffs right"
                  aria-label="Poderes activos jugador derecho"
                >
                  {rightEffects.map((e, i) => (
                    <span
                      key={`R-${e}-${i}`}
                      className="arena-buff"
                      title={POWER_LABELS[e]}
                    >
                      <PowerIcon power={e} />
                    </span>
                  ))}
                </div>
              )}

              {/* Drag hint */}
              {state &&
                (state.phase === "WAITING" ||
                  state.phase === "COUNTDOWN") &&
                you !== "spectator" && (
                  <span className="arena-drag-hint" aria-hidden>
                    <Move aria-hidden focusable="false" />
                    DESLIZÁ
                  </span>
                )}

              {/* Botón flotante "?" */}
              <button
                type="button"
                onClick={() => setShowPowers(true)}
                className="arena-fab"
                aria-label="Ver lista de poderes"
              >
                <CircleHelp aria-hidden focusable="false" />
              </button>

              {/* Overlay FINISHED */}
              {finished && state && (
                <div className="arena-finished">
                  <div
                    className={`arena-finished-card ${
                      you === "spectator"
                        ? ""
                        : state.winner === you
                          ? "win"
                          : "lose"
                    }`}
                  >
                    {you === "spectator" ? (
                      <>
                        <div className="arena-finished-icon">
                          <Gamepad2 aria-hidden focusable="false" />
                        </div>
                        <p className="arena-finished-headline">
                          PARTIDA
                          <br />
                          TERMINADA
                        </p>
                        <p className="arena-finished-score">
                          {state.scores.left} - {state.scores.right}
                        </p>
                      </>
                    ) : state.winner === you ? (
                      <>
                        <div className="arena-finished-icon">
                          <Crown aria-hidden focusable="false" />
                        </div>
                        <p className="arena-finished-headline">¡GANASTE!</p>
                        <p className="arena-finished-score">
                          {state.scores.left} - {state.scores.right}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="arena-finished-icon">
                          <Skull aria-hidden focusable="false" />
                        </div>
                        <p className="arena-finished-headline">PERDISTE</p>
                        <p className="arena-finished-score">
                          {state.scores.left} - {state.scores.right}
                        </p>
                      </>
                    )}
                    <div className="arena-finished-actions">
                      <button
                        type="button"
                        className="arena-finished-action primary"
                        onClick={rematch}
                      >
                        <Repeat aria-hidden focusable="false" />
                        REVANCHA
                      </button>
                      <Link
                        href="/"
                        className="arena-finished-action secondary"
                      >
                        <House aria-hidden focusable="false" />
                        MENÚ
                      </Link>
                    </div>
                    {state.rematchVotes && mode !== "bot" && (
                      <div className="arena-finished-rematch">
                        {state.rematchVotes.left ? (
                          <Check aria-hidden focusable="false" />
                        ) : (
                          <span aria-hidden>○</span>
                        )}{" "}
                        P1 ·{" "}
                        {state.rematchVotes.right ? (
                          <Check aria-hidden focusable="false" />
                        ) : (
                          <span aria-hidden>○</span>
                        )}{" "}
                        P2
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Help bar bajo el canvas — info contextual */}
          <HelpBar
            phase={state?.phase}
            mode={mode}
            code={code}
            playing={!!playing}
            finished={finished}
          />
        </section>

        {/* Rail derecho (desktop) — player card grande P2 + leyenda de poderes */}
        <aside className="arena-rail-right" aria-label="Jugador 2">
          <PlayerCardTall
            ch={rightCh}
            nick={state?.nicks?.right ?? ""}
            score={state?.scores.right ?? 0}
            you={you === "right"}
            buffs={rightEffects}
          />
          <PowerLegendPanel onOpenAll={() => setShowPowers(true)} />
        </aside>
      </div>

      {/* Modal de poderes */}
      {showPowers && (
        <div
          className="arena-modal-backdrop"
          onClick={() => setShowPowers(false)}
        >
          <div
            className="arena-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Lista de poderes"
          >
            <div className="arena-modal-header">
              <span className="arena-modal-title">LOS 8 PODERES</span>
              <button
                type="button"
                onClick={() => setShowPowers(false)}
                className="arena-modal-close"
                aria-label="Cerrar"
              >
                <IconX aria-hidden focusable="false" />
              </button>
            </div>
            <div className="arena-modal-grid">
              {(Object.keys(POWER_LABELS) as PowerId[]).map((id) => (
                <div key={id} className="arena-power-list-item">
                  <span className="glyph">
                    <PowerIcon power={id} />
                  </span>
                  <span className="label">{POWER_LABELS[id]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function activeEffects(state: GameState, side: Side): PowerId[] {
  const out: PowerId[] = [];
  const p = state.paddles[side];
  if (p.shield) out.push("shield");
  if (p.frozenUntil > state.now) out.push("freeze");
  if (p.invertedUntil > state.now) out.push("invert");
  for (const b of p.activeBuffs) {
    if (b.power === "paddleXL") out.push("paddleXL");
    if (b.power === "paddleMini") out.push("paddleMini");
  }
  if (state.speedMul !== 1 && state.speedMulUntil > state.now) {
    out.push("slowmo");
  }
  return out;
}

const POWER_ICONS: Record<
  PowerId,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  slowmo: Snail,
  paddleXL: Ruler,
  paddleMini: Scissors,
  turbo: Rocket,
  shield: Shield,
  freeze: Snowflake,
  curve: Tornado,
  invert: RefreshCw,
};

function PowerIcon({
  power,
  className,
}: {
  power: PowerId;
  className?: string;
}) {
  const Icon = POWER_ICONS[power];
  return <Icon className={className} aria-hidden focusable="false" />;
}

function ModeIcon({ mode }: { mode: "quick" | "private" | "bot" }) {
  if (mode === "bot") return <Bot aria-hidden focusable="false" />;
  if (mode === "quick") return <Zap aria-hidden focusable="false" />;
  return <Users aria-hidden focusable="false" />;
}

function PhaseIcon({ phase }: { phase?: string }) {
  switch (phase) {
    case "PLAYING":
      return <Play aria-hidden focusable="false" />;
    case "COUNTDOWN":
      return <Hourglass aria-hidden focusable="false" />;
    case "GOAL":
      return <Sparkles aria-hidden focusable="false" />;
    case "FINISHED":
      return <Crown aria-hidden focusable="false" />;
    default:
      return <Gamepad2 aria-hidden focusable="false" />;
  }
}

type CharacterMeta = {
  id: CharacterId;
  name: string;
  color: string;
  emoji: string;
} | null;

function PlayerCardCompact({
  ch,
  nick,
  score,
  you,
  right,
}: {
  ch: CharacterMeta;
  nick: string;
  score: number;
  you: boolean;
  right?: boolean;
}) {
  if (!ch) {
    return (
      <div
        className={`arena-pcard-compact ${right ? "right" : ""}`}
        aria-hidden
      >
        <div
          className="arena-pcard-portrait"
          style={{ ["--pc-color" as string]: "#5cffe0" }}
        />
        <div className="arena-pcard-compact-info">
          <span className="arena-pcard-compact-name opacity-40">…</span>
          <span className="arena-pcard-compact-score opacity-40">0</span>
        </div>
      </div>
    );
  }
  const display = nick || (you ? "VOS" : right ? "P2" : "P1");
  return (
    <div
      className={`arena-pcard-compact ${right ? "right" : ""}`}
      style={{ ["--pc-color" as string]: ch.color }}
    >
      <div className="arena-pcard-portrait">
        <CharacterPreview id={ch.id} scale={2} glow={ch.color} />
      </div>
      <div className="arena-pcard-compact-info">
        <span className="arena-pcard-compact-name" title={display}>
          {display}
          {you ? " · TÚ" : ""}
        </span>
        <span className="arena-pcard-compact-score">{score}</span>
      </div>
    </div>
  );
}

function PlayerCardTall({
  ch,
  nick,
  score,
  you,
  buffs,
}: {
  ch: CharacterMeta;
  nick: string;
  score: number;
  you: boolean;
  buffs: PowerId[];
}) {
  if (!ch) {
    return (
      <div
        className="arena-pcard"
        style={{ ["--pc-color" as string]: "#5cffe0" }}
        aria-hidden
      >
        <div className="arena-pcard-portrait" />
        <div className="arena-pcard-name">…</div>
        <div className="arena-pcard-score">0</div>
      </div>
    );
  }
  const display = nick || (you ? "VOS" : "P?");
  return (
    <div
      className={`arena-pcard ${you ? "you" : ""}`}
      style={{ ["--pc-color" as string]: ch.color }}
    >
      <div className="arena-pcard-portrait">
        <CharacterPreview id={ch.id} scale={3} glow={ch.color} />
      </div>
      <div className="arena-pcard-name" title={display}>
        {display}
      </div>
      <div className="arena-pcard-character" title={ch.name}>
        {ch.name}
      </div>
      <div className="arena-pcard-score">{score}</div>
      <div className="arena-buffs" aria-label="Poderes activos">
        {buffs.length === 0 ? (
          <span className="arena-buffs-empty">SIN PODERES</span>
        ) : (
          buffs.map((b, i) => (
            <span
              key={`${b}-${i}`}
              className="arena-buff"
              title={POWER_LABELS[b]}
            >
              <PowerIcon power={b} />
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function ControlsHelpPanel({
  mode,
}: {
  mode: "quick" | "private" | "bot";
}) {
  return (
    <div className="arena-panel" aria-label="Controles">
      <div className="arena-panel-eyebrow">
        <span>CONTROLES</span>
      </div>
      <div className="arena-controls-rows">
        <div className="arena-controls-row">
          <span>SUBIR</span>
          <span className="arena-controls-keys">
            <span className="arena-key">
              <ArrowUp aria-hidden focusable="false" />
            </span>
            <span className="arena-key">W</span>
          </span>
        </div>
        <div className="arena-controls-row">
          <span>BAJAR</span>
          <span className="arena-controls-keys">
            <span className="arena-key">
              <ArrowDown aria-hidden focusable="false" />
            </span>
            <span className="arena-key">S</span>
          </span>
        </div>
        <div className="arena-controls-row">
          <span>TÁCTIL</span>
          <span className="arena-controls-keys">
            <span className="arena-key">
              <Move aria-hidden focusable="false" />
            </span>
          </span>
        </div>
        <div className="arena-controls-note">
          {mode === "bot"
            ? "Bot con dificultad configurable. Primero a 7 gana."
            : mode === "quick"
              ? "Partida rápida · matchmaking global. Primero a 7 gana."
              : "Invitá a un amigo con el código de sala. Primero a 7 gana."}
        </div>
      </div>
    </div>
  );
}

function PowerLegendPanel({ onOpenAll }: { onOpenAll: () => void }) {
  const entries = Object.entries(POWER_LABELS) as [PowerId, string][];
  return (
    <div className="arena-panel" aria-label="Leyenda de poderes">
      <div className="arena-panel-eyebrow">
        <span>PODERES</span>
        <button
          type="button"
          onClick={onOpenAll}
          className="arena-panel-link"
          aria-label="Ver detalle de los 8 poderes"
        >
          <CircleHelp aria-hidden focusable="false" />
          VER TODOS
        </button>
      </div>
      <div className="arena-power-list">
        {entries.map(([id, label]) => (
          <div key={id} className="arena-power-list-item">
            <span className="glyph">
              <PowerIcon power={id} />
            </span>
            <span className="label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HelpBar({
  phase,
  mode,
  code,
  playing,
  finished,
}: {
  phase?: string;
  mode: "quick" | "private" | "bot";
  code: string;
  playing: boolean;
  finished: boolean;
}) {
  if (finished) return null;

  if (playing) {
    return (
      <div className="arena-help-bar" role="note">
        <Sparkles aria-hidden focusable="false" />
        <span>PRIMERO A 7 · TOCÁ EL ORBE PARA ACTIVAR PODERES</span>
      </div>
    );
  }

  if (phase === "WAITING") {
    if (mode === "bot") {
      return (
        <div className="arena-help-bar cta" role="status">
          <Bot aria-hidden focusable="false" />
          <span>Preparando bot…</span>
        </div>
      );
    }
    return (
      <div className="arena-help-bar cta" role="status">
        <KeyRound aria-hidden focusable="false" />
        <span>
          COMPARTÍ EL CÓDIGO{" "}
          <span className="arena-help-code">{code}</span> CON TU RIVAL
        </span>
      </div>
    );
  }

  if (phase === "COUNTDOWN") {
    return (
      <div className="arena-help-bar" role="status">
        <Hourglass aria-hidden focusable="false" />
        <span>¡A JUGAR EN…!</span>
      </div>
    );
  }

  if (phase === "GOAL") {
    return (
      <div className="arena-help-bar" role="status">
        <Sparkles aria-hidden focusable="false" />
        <span>¡GOL!</span>
      </div>
    );
  }

  return null;
}
