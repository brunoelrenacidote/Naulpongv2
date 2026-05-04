"use client";

import { useEffect, useRef } from "react";
import {
  CHARACTERS,
  FIELD_H,
  FIELD_W,
  GameState,
  PADDLE_W,
  POWER_EMOJIS,
  POWER_LABELS,
  Side,
} from "@/lib/game-types";

const DRAW_SCALE = 3; // 320*3 = 960 px wide canvas; we'll fit-to-container with CSS.

interface Props {
  state: GameState | null;
  you: Side | "spectator";
}

export default function GameCanvas({ state, you }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(state);
  const youRef = useRef<Side | "spectator">(you);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    youRef.current = you;
  }, [you]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = FIELD_W * DRAW_SCALE;
    canvas.height = FIELD_H * DRAW_SCALE;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const loop = () => {
      drawFrame(ctx, stateRef.current, youRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="pixel-img mx-auto block w-full max-w-[960px] rounded-md border-2 border-[var(--neon-cyan)]"
        style={{
          aspectRatio: `${FIELD_W} / ${FIELD_H}`,
          boxShadow:
            "0 0 24px rgba(92,255,224,0.4), inset 0 0 30px rgba(92,255,224,0.1)",
          background: "#000",
        }}
      />
    </div>
  );
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState | null,
  you: Side | "spectator",
) {
  const W = FIELD_W * DRAW_SCALE;
  const H = FIELD_H * DRAW_SCALE;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // Background draw (in field-space)
  ctx.save();
  ctx.scale(DRAW_SCALE, DRAW_SCALE);

  // Side bands hinting players' colors (super faint)
  if (state) {
    const leftCh = CHARACTERS[state.characters.left];
    const rightCh = CHARACTERS[state.characters.right];
    const grdL = ctx.createLinearGradient(0, 0, FIELD_W / 2, 0);
    grdL.addColorStop(0, hexToRgba(leftCh.color, 0.07));
    grdL.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grdL;
    ctx.fillRect(0, 0, FIELD_W / 2, FIELD_H);
    const grdR = ctx.createLinearGradient(FIELD_W / 2, 0, FIELD_W, 0);
    grdR.addColorStop(0, "rgba(0,0,0,0)");
    grdR.addColorStop(1, hexToRgba(rightCh.color, 0.07));
    ctx.fillStyle = grdR;
    ctx.fillRect(FIELD_W / 2, 0, FIELD_W / 2, FIELD_H);
  }

  // Center dashed line
  ctx.fillStyle = "rgba(92,255,224,0.55)";
  for (let y = 0; y < FIELD_H; y += 8) {
    ctx.fillRect(FIELD_W / 2 - 1, y, 2, 4);
  }

  // Subtle grid (dot-grid for blocky retro feel)
  ctx.fillStyle = "rgba(92,255,224,0.10)";
  for (let x = 8; x < FIELD_W; x += 16) {
    for (let y = 8; y < FIELD_H; y += 16) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  if (!state) {
    ctx.restore();
    drawScanlines(ctx, W, H);
    drawCenterText(ctx, W, H, "CONECTANDO...", "#5cffe0");
    return;
  }

  // Power orbs
  for (const orb of state.orbs) {
    const t = state.now / 200;
    const r = 6 + Math.sin(t + orb.x) * 0.8;
    const grd = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * 2);
    grd.addColorStop(0, colorForPower(orb.power));
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colorForPower(orb.power);
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, r * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(POWER_EMOJIS[orb.power], orb.x, orb.y);
  }

  // Paddles
  drawPaddle(ctx, "left", state, you);
  drawPaddle(ctx, "right", state, you);

  // Balls
  drawBall(ctx, state.ball.x, state.ball.y, state.ball.size);
  for (const b of state.extraBalls) drawBall(ctx, b.x, b.y, b.size);

  // Score (chunky retro)
  drawScore(ctx, state.scores.left, FIELD_W / 2 - 28, 16, "#5cffe0");
  drawScore(ctx, state.scores.right, FIELD_W / 2 + 28, 16, "#ff5cd1");

  // Nicks under score
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    truncate(state.nicks?.left || "P1", 8),
    FIELD_W / 2 - 28,
    24,
  );
  ctx.fillText(
    truncate(state.nicks?.right || "P2", 8),
    FIELD_W / 2 + 28,
    24,
  );

  ctx.restore();

  // Scanlines + vignette overlay (in screen space)
  drawScanlines(ctx, W, H);

  // Phase overlays in screen-pixel space
  if (state.phase === "WAITING") {
    drawCenterText(ctx, W, H, "ESPERANDO RIVAL...", "#ffd95c");
  } else if (state.phase === "COUNTDOWN") {
    const remaining = Math.max(0, state.countdownEndsAt - state.now);
    const n = Math.ceil(remaining / 1000);
    drawCenterText(ctx, W, H, n > 0 ? `${n}` : "GO!", "#5cffe0", 64);
  } else if (state.phase === "GOAL" && state.lastEvent?.kind === "goal") {
    const scorer = state.lastEvent.side ?? "left";
    const ch = CHARACTERS[state.characters[scorer]];
    drawCenterText(ctx, W, H, "¡GOL!", "#ffd95c", 48);
    const scorerNick = state.nicks?.[scorer] || ch.name;
    drawSubText(ctx, W, H, scorerNick.toUpperCase(), ch.color);
  } else if (state.phase === "FINISHED" && state.winner) {
    const ch = CHARACTERS[state.characters[state.winner]];
    const winnerNick = state.nicks?.[state.winner] || ch.name;
    drawCenterText(ctx, W, H, "GAME OVER", "#ff5cd1", 36);
    drawSubText(ctx, W, H, `GANA ${winnerNick.toUpperCase()}`, ch.color);
  }

  // Recent power activation flash
  if (
    state.lastEvent?.kind === "power" &&
    state.now - state.lastEvent.t < 1500 &&
    state.lastEvent.power
  ) {
    const fade = 1 - (state.now - state.lastEvent.t) / 1500;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.font = 'bold 18px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.shadowColor = colorForPower(state.lastEvent.power);
    ctx.shadowBlur = 24;
    ctx.fillStyle = colorForPower(state.lastEvent.power);
    ctx.fillText(
      `${POWER_EMOJIS[state.lastEvent.power]}  ${POWER_LABELS[state.lastEvent.power]}  ${POWER_EMOJIS[state.lastEvent.power]}`,
      W / 2,
      H - 36,
    );
    ctx.restore();
  }
}

function drawPaddle(
  ctx: CanvasRenderingContext2D,
  side: Side,
  state: GameState,
  you: Side | "spectator",
) {
  const p = state.paddles[side];
  const x = side === "left" ? 4 : FIELD_W - 4 - PADDLE_W;
  const ch = CHARACTERS[state.characters[side]];
  const color = ch.color;
  const isYou = you === side;

  // glow
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillRect(x, p.y, PADDLE_W, p.height);
  // inner highlight (lighter shade)
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x, p.y, PADDLE_W, 2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x, p.y + p.height - 2, PADDLE_W, 2);
  ctx.restore();

  // shield indicator
  if (p.shield) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1;
    const cy = p.y + p.height / 2;
    ctx.beginPath();
    ctx.arc(x + PADDLE_W / 2, cy, p.height / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // freeze indicator
  if (p.frozenUntil > state.now) {
    ctx.save();
    ctx.fillStyle = "rgba(120,200,255,0.5)";
    ctx.fillRect(x - 1, p.y - 1, PADDLE_W + 2, p.height + 2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("❄", x + PADDLE_W / 2, p.y - 2);
    ctx.restore();
  }

  // "VOS" indicator (your paddle)
  if (isYou) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText("▼", x + PADDLE_W / 2, p.y - 2);
    ctx.restore();
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  // outer glow
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, size, size);
  // pixel highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(x, y, 1, 1);
  ctx.restore();
}

// Chunky pixel score using 5x7 retro digits
function drawScore(
  ctx: CanvasRenderingContext2D,
  n: number,
  cx: number,
  cy: number,
  color: string,
) {
  ctx.save();
  ctx.font = 'bold 14px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillText(String(n), cx, cy);
  ctx.restore();
}

function drawScanlines(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#000";
  // horizontal scanlines every 2 device pixels
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

function drawCenterText(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  color: string,
  size = 28,
) {
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillStyle = color;
  ctx.fillText(text, W / 2, H / 2 - 4);
  ctx.restore();
}

function drawSubText(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  color: string,
) {
  ctx.save();
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fillText(text, W / 2, H / 2 + 36);
  ctx.restore();
}

function colorForPower(p: string): string {
  switch (p) {
    case "slowmo":
      return "#5cb1ff";
    case "paddleXL":
      return "#5cff8a";
    case "paddleMini":
      return "#ff5c5c";
    case "turbo":
      return "#ff8a3d";
    case "shield":
      return "#ffd95c";
    case "freeze":
      return "#a0e8ff";
    case "curve":
      return "#bb88ff";
    case "invert":
      return "#ff5cd1";
    default:
      return "#fff";
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.replace("#", ""));
  if (!m) return `rgba(255,255,255,${alpha})`;
  const v = parseInt(m[1], 16);
  const r = (v >> 16) & 0xff;
  const g = (v >> 8) & 0xff;
  const b = v & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}
