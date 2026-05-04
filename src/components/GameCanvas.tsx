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

  // Grid background
  ctx.save();
  ctx.scale(DRAW_SCALE, DRAW_SCALE);

  // Center dashed line
  ctx.fillStyle = "rgba(92,255,224,0.55)";
  for (let y = 0; y < FIELD_H; y += 8) {
    ctx.fillRect(FIELD_W / 2 - 1, y, 2, 4);
  }

  // Subtle grid
  ctx.fillStyle = "rgba(92,255,224,0.08)";
  for (let x = 16; x < FIELD_W; x += 32) {
    ctx.fillRect(x, 0, 1, FIELD_H);
  }
  for (let y = 16; y < FIELD_H; y += 32) {
    ctx.fillRect(0, y, FIELD_W, 1);
  }

  if (!state) {
    ctx.restore();
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

  // Score
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = 'bold 18px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.fillText(`${state.scores.left}`, FIELD_W / 2 - 28, 22);
  ctx.fillText(`${state.scores.right}`, FIELD_W / 2 + 28, 22);

  ctx.restore();

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
    drawSubText(ctx, W, H, ch.name, ch.color);
  } else if (state.phase === "FINISHED" && state.winner) {
    const ch = CHARACTERS[state.characters[state.winner]];
    drawCenterText(ctx, W, H, "GAME OVER", "#ff5cd1", 36);
    drawSubText(ctx, W, H, `GANA ${ch.name}`, ch.color);
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
    ctx.fillStyle = "#fff";
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

  // "YOU" indicator
  if (isYou) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText(
      "VOS",
      x + PADDLE_W / 2,
      side === "left" ? p.y - 4 : p.y - 4,
    );
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
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, size, size);
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
