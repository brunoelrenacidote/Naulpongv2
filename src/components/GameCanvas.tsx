"use client";

import { useEffect, useRef } from "react";
import {
  CHARACTERS,
  CharacterId,
  FIELD_H,
  FIELD_W,
  GameState,
  PADDLE_W,
  POWER_GLYPHS,
  POWER_LABELS,
  Side,
} from "@/lib/game-types";
import { Pose, SPRITE_H, SPRITE_W } from "@/lib/character-sprites";
import { drawCharacter, preloadSprites } from "@/lib/sprite-loader";
import { pickTaunt } from "@/lib/taunts";

const DRAW_SCALE = 3;

interface Props {
  state: GameState | null;
  you: Side | "spectator";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // ms remaining
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

interface Star {
  x: number;
  y: number;
  speed: number; // twinkle phase speed
  phase: number;
}

interface Crowdy {
  x: number;
  color: string;
  bobOffset: number; // phase
  hatColor: string;
}

interface Taunt {
  side: Side;
  text: string;
  color: string;
  bornAt: number;
  ttl: number; // ms total
}

interface Anim {
  particles: Particle[];
  trail: TrailPoint[];
  stars: Star[];
  crowd: Crowdy[];
  taunts: Taunt[];
  lastEventT: number;
  lastFrameT: number;
  lastWinner: Side | null;
}

function makeStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * FIELD_W,
      y: Math.random() * (FIELD_H - 16) + 8,
      speed: 0.001 + Math.random() * 0.003,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

function makeCrowd(): Crowdy[] {
  const c: Crowdy[] = [];
  const colors = ["#5cffe0", "#ff5cd1", "#ffd95c", "#5cff8a", "#ff8a3d", "#bb88ff", "#a0e8ff", "#ff5c5c"];
  const hats = ["#ff5cd1", "#ffd95c", "#5cffe0", "#ffffff", "#5cff8a"];
  for (let i = 0; i < 28; i++) {
    c.push({
      x: 4 + i * 11 + (Math.random() * 2 - 1),
      color: colors[i % colors.length],
      bobOffset: Math.random() * Math.PI * 2,
      hatColor: hats[i % hats.length],
    });
  }
  return c;
}

export default function GameCanvas({ state, you }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(state);
  const youRef = useRef<Side | "spectator">(you);
  const rafRef = useRef<number | null>(null);
  const animRef = useRef<Anim>({
    particles: [],
    trail: [],
    stars: makeStars(),
    crowd: makeCrowd(),
    taunts: [],
    lastEventT: 0,
    lastFrameT: 0,
    lastWinner: null,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    youRef.current = you;
  }, [you]);

  useEffect(() => {
    preloadSprites();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = FIELD_W * DRAW_SCALE;
    canvas.height = FIELD_H * DRAW_SCALE;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const loop = (ts: number) => {
      const anim = animRef.current;
      const dt = anim.lastFrameT === 0 ? 16 : Math.min(60, ts - anim.lastFrameT);
      anim.lastFrameT = ts;
      drawFrame(ctx, stateRef.current, youRef.current, anim, ts, dt);
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
  anim: Anim,
  frameT: number,
  dt: number,
) {
  const W = FIELD_W * DRAW_SCALE;
  const H = FIELD_H * DRAW_SCALE;
  ctx.fillStyle = "#050216";
  ctx.fillRect(0, 0, W, H);

  // Field-space drawing
  ctx.save();
  ctx.scale(DRAW_SCALE, DRAW_SCALE);

  // Background stars (twinkle)
  for (const s of anim.stars) {
    const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frameT * s.speed + s.phase));
    ctx.fillStyle = `rgba(255,255,255,${a * 0.6})`;
    ctx.fillRect(s.x | 0, s.y | 0, 1, 1);
  }

  // Side bands hinting players' colors
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
  ctx.fillStyle = "rgba(92,255,224,0.45)";
  for (let y = 0; y < FIELD_H; y += 8) {
    ctx.fillRect(FIELD_W / 2 - 1, y, 2, 4);
  }

  // Subtle dot grid
  ctx.fillStyle = "rgba(92,255,224,0.10)";
  for (let x = 8; x < FIELD_W; x += 16) {
    for (let y = 24; y < FIELD_H; y += 16) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Crowd at top
  drawCrowd(ctx, anim.crowd, frameT);

  // Marquee neon strip just below crowd
  drawMarquee(ctx, frameT);

  if (!state) {
    ctx.restore();
    drawScanlines(ctx, W, H);
    drawCenterText(ctx, W, H, "CONECTANDO...", "#5cffe0");
    return;
  }

  // Spawn event-based particles + taunts
  if (state.lastEvent && state.lastEvent.t !== anim.lastEventT) {
    anim.lastEventT = state.lastEvent.t;
    spawnEventParticles(state, anim);
    queueGoalTaunts(state, anim, frameT);
  }
  // Trigger end-of-match taunts once winner is decided
  if (state.phase === "FINISHED" && state.winner && anim.lastWinner !== state.winner) {
    anim.lastWinner = state.winner;
    queueWinTaunts(state, anim, frameT);
  } else if (state.phase !== "FINISHED" && anim.lastWinner !== null) {
    anim.lastWinner = null;
  }

  // Update + draw particles
  updateParticles(anim.particles, dt);
  drawParticles(ctx, anim.particles);

  // Update trail with current ball pos
  if (state.phase === "PLAYING" || state.phase === "GOAL") {
    anim.trail.push({
      x: state.ball.x + state.ball.size / 2,
      y: state.ball.y + state.ball.size / 2,
      t: frameT,
    });
    if (anim.trail.length > 14) anim.trail.shift();
  } else {
    anim.trail.length = 0;
  }
  drawTrail(ctx, anim.trail, frameT);

  // Power orbs (with rotating ring)
  for (const orb of state.orbs) {
    drawPowerOrb(ctx, orb.x, orb.y, orb.power, frameT);
  }

  // Paddles
  drawPaddle(ctx, "left", state, you, frameT);
  drawPaddle(ctx, "right", state, you, frameT);

  // Balls
  drawBall(ctx, state.ball.x, state.ball.y, state.ball.size, frameT);
  for (const b of state.extraBalls) drawBall(ctx, b.x, b.y, b.size, frameT);

  // Score
  drawScore(ctx, state.scores.left, FIELD_W / 2 - 28, 16, "#5cffe0");
  drawScore(ctx, state.scores.right, FIELD_W / 2 + 28, 16, "#ff5cd1");

  // Nicks under score
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(truncate(state.nicks?.left || "P1", 8), FIELD_W / 2 - 28, 24);
  ctx.fillText(truncate(state.nicks?.right || "P2", 8), FIELD_W / 2 + 28, 24);

  // Taunts (speech bubbles) — drawn in field coords, scaled, so they pixelate
  drawTaunts(ctx, anim.taunts, state, frameT);

  ctx.restore();

  // Scanlines overlay (in screen-pixel space)
  drawScanlines(ctx, W, H);

  // Phase overlays
  if (state.phase === "WAITING") {
    drawCenterText(ctx, W, H, "ESPERANDO RIVAL...", "#ffd95c");
    drawWaitingMascots(ctx, W, H, state, frameT);
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
    drawWinnerMascot(ctx, W, H, state, frameT);
    drawCenterText(ctx, W, H, "GAME OVER", "#ff5cd1", 28, 0.62);
    drawSubText(ctx, W, H, `GANA ${winnerNick.toUpperCase()}`, ch.color, 0.62, 30);
  }

  // Recent power activation banner
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
      POWER_LABELS[state.lastEvent.power],
      W / 2,
      H - 36,
    );
    ctx.restore();
  }
}

function spawnEventParticles(state: GameState, anim: Anim) {
  const ev = state.lastEvent!;
  switch (ev.kind) {
    case "hit": {
      const side = ev.side!;
      const ch = CHARACTERS[state.characters[side]];
      const x = side === "left" ? PADDLE_W + 4 : FIELD_W - 4 - PADDLE_W;
      const y = state.paddles[side].y + state.paddles[side].height / 2;
      const dir = side === "left" ? 1 : -1;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.random() - 0.5) * 1.4;
        const speed = 60 + Math.random() * 80;
        anim.particles.push({
          x,
          y: y + (Math.random() - 0.5) * 18,
          vx: Math.cos(angle) * speed * dir,
          vy: Math.sin(angle) * speed,
          life: 350,
          maxLife: 350,
          size: 1 + Math.random() * 1,
          color: i % 2 === 0 ? "#ffffff" : ch.color,
          gravity: 0,
        });
      }
      break;
    }
    case "wall": {
      const b = state.ball;
      const wallTop = b.y < FIELD_H / 2;
      for (let i = 0; i < 5; i++) {
        const angle = (Math.random() - 0.5) * 1.0;
        const speed = 30 + Math.random() * 50;
        anim.particles.push({
          x: b.x + b.size / 2,
          y: wallTop ? 1 : FIELD_H - 1,
          vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
          vy: (wallTop ? 1 : -1) * Math.abs(Math.sin(angle) * speed),
          life: 280,
          maxLife: 280,
          size: 1,
          color: "#5cffe0",
          gravity: 0,
        });
      }
      break;
    }
    case "goal": {
      const scorer = ev.side!;
      const ch = CHARACTERS[state.characters[scorer]];
      const opponent: Side = scorer === "left" ? "right" : "left";
      const x = opponent === "left" ? 0 : FIELD_W;
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 160;
        anim.particles.push({
          x,
          y: FIELD_H / 2 + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 700 + Math.random() * 400,
          maxLife: 1100,
          size: 1 + Math.floor(Math.random() * 2),
          color: i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? ch.color : "#ffd95c",
          gravity: 80,
        });
      }
      break;
    }
    case "power": {
      const color = ev.power ? colorForPower(ev.power) : "#fff";
      const b = state.ball;
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const speed = 40 + Math.random() * 80;
        anim.particles.push({
          x: b.x + b.size / 2,
          y: b.y + b.size / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 600,
          maxLife: 600,
          size: 1 + Math.random() * 1,
          color: i % 2 === 0 ? "#ffffff" : color,
          gravity: 0,
        });
      }
      break;
    }
    case "spawn": {
      // small twinkle when orb appears
      if (state.orbs.length > 0) {
        const orb = state.orbs[state.orbs.length - 1];
        const color = colorForPower(orb.power);
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 20 + Math.random() * 30;
          anim.particles.push({
            x: orb.x,
            y: orb.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 400,
            maxLife: 400,
            size: 1,
            color,
            gravity: 0,
          });
        }
      }
      break;
    }
  }
}

function queueGoalTaunts(state: GameState, anim: Anim, frameT: number) {
  const ev = state.lastEvent;
  if (!ev || ev.kind !== "goal" || !ev.side) return;
  const scorer = ev.side;
  const loser: Side = scorer === "left" ? "right" : "left";
  // Limit one taunt per side at a time
  anim.taunts = anim.taunts.filter((t) => t.side !== scorer && t.side !== loser);
  const scorerCh = CHARACTERS[state.characters[scorer]];
  const loserCh = CHARACTERS[state.characters[loser]];
  anim.taunts.push({
    side: scorer,
    text: pickTaunt(state.characters[scorer], "goal"),
    color: scorerCh.color,
    bornAt: frameT,
    ttl: 2400,
  });
  anim.taunts.push({
    side: loser,
    text: pickTaunt(state.characters[loser], "takeGoal"),
    color: loserCh.color,
    bornAt: frameT + 250, // slight delay so they don't both pop at once
    ttl: 2200,
  });
}

function queueWinTaunts(state: GameState, anim: Anim, frameT: number) {
  if (!state.winner) return;
  const winner = state.winner;
  const loser: Side = winner === "left" ? "right" : "left";
  anim.taunts = anim.taunts.filter((t) => t.side !== winner && t.side !== loser);
  const winnerCh = CHARACTERS[state.characters[winner]];
  const loserCh = CHARACTERS[state.characters[loser]];
  anim.taunts.push({
    side: winner,
    text: pickTaunt(state.characters[winner], "win"),
    color: winnerCh.color,
    bornAt: frameT + 400,
    ttl: 4000,
  });
  anim.taunts.push({
    side: loser,
    text: pickTaunt(state.characters[loser], "lose"),
    color: loserCh.color,
    bornAt: frameT + 800,
    ttl: 3600,
  });
}

function drawTaunts(
  ctx: CanvasRenderingContext2D,
  taunts: Taunt[],
  state: GameState,
  frameT: number,
) {
  for (let i = taunts.length - 1; i >= 0; i--) {
    const t = taunts[i];
    const age = frameT - t.bornAt;
    if (age < 0) continue;
    if (age > t.ttl) {
      taunts.splice(i, 1);
      continue;
    }
    // fade in fast, fade out last 400ms
    let alpha = 1;
    if (age < 100) alpha = age / 100;
    else if (age > t.ttl - 400) alpha = Math.max(0, (t.ttl - age) / 400);
    drawSpeechBubble(ctx, state, t.side, t.text, t.color, alpha, frameT);
  }
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  side: Side,
  text: string,
  color: string,
  alpha: number,
  frameT: number,
) {
  if (!text) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  // Wrap text to roughly fit
  const maxCharsPerLine = 14;
  const lines: string[] = [];
  const words = text.split(" ");
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxCharsPerLine && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur ? cur + " " : "") + w;
    }
  }
  if (cur) lines.push(cur);

  const lineH = 9;
  const padX = 4;
  const padY = 4;
  const textW =
    Math.max(...lines.map((l) => l.length)) * 5 + 1; // ~5px per char at 6px font
  const w = textW + padX * 2;
  const h = lines.length * lineH + padY * 2 - 2;

  // Anchor near the paddle — bubble floats above/middle area
  const paddle = state.paddles[side];
  const bob = Math.sin(frameT * 0.01) * 1;
  let bx: number;
  if (side === "left") {
    bx = Math.max(2, PADDLE_W + 4);
  } else {
    bx = Math.min(FIELD_W - w - 2, FIELD_W - PADDLE_W - 4 - w);
  }
  const py = paddle.y + paddle.height / 2;
  let by = Math.round(py - h / 2 - 14 + bob);
  if (by < 32) by = 32;
  if (by > FIELD_H - h - 4) by = FIELD_H - h - 4;

  // Background fill (dark) + colored border
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(bx, by, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, h - 1);
  ctx.shadowBlur = 0;

  // Tail pointing toward paddle
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  if (side === "left") {
    ctx.fillRect(bx - 2, by + h / 2 - 1, 2, 2);
    ctx.fillRect(bx - 4, by + h / 2 - 1, 2, 1);
  } else {
    ctx.fillRect(bx + w, by + h / 2 - 1, 2, 2);
    ctx.fillRect(bx + w + 2, by + h / 2 - 1, 2, 1);
  }

  // Text
  ctx.fillStyle = color;
  ctx.shadowBlur = 0;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], bx + padX, by + padY + i * lineH);
  }
  ctx.restore();
}

function updateParticles(particles: Particle[], dt: number) {
  const ds = dt / 1000;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * ds;
    p.x += p.vx * ds;
    p.y += p.vy * ds;
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const a = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    ctx.restore();
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, trail: TrailPoint[], frameT: number) {
  if (trail.length < 2) return;
  const len = trail.length;
  for (let i = 0; i < len; i++) {
    const p = trail[i];
    const age = (frameT - p.t) / 200; // ~200ms fade
    const a = Math.max(0, 1 - age);
    if (a <= 0) continue;
    ctx.save();
    ctx.globalAlpha = a * 0.6;
    ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#ffd95c";
    const sz = Math.max(1, Math.floor(2 * (i / len)));
    ctx.fillRect((p.x - sz / 2) | 0, (p.y - sz / 2) | 0, sz, sz);
    ctx.restore();
  }
}

function drawCrowd(ctx: CanvasRenderingContext2D, crowd: Crowdy[], frameT: number) {
  // crowd lives in y=0..6, very thin row of "heads"
  for (const c of crowd) {
    const bob = Math.sin(frameT * 0.006 + c.bobOffset) > 0 ? 0 : 1;
    const baseY = 1 + bob;
    // hat
    ctx.fillStyle = c.hatColor;
    ctx.fillRect(c.x, baseY, 4, 1);
    // head
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, baseY + 1, 4, 3);
    // eyes (single pixel)
    ctx.fillStyle = "#000";
    ctx.fillRect(c.x + 1, baseY + 2, 1, 1);
    ctx.fillRect(c.x + 2, baseY + 2, 1, 1);
  }
}

function drawMarquee(ctx: CanvasRenderingContext2D, frameT: number) {
  // alternating neon dots that scroll across the top, just under crowd
  const y = 6;
  for (let x = 0; x < FIELD_W; x += 6) {
    const phase = ((x / 6) + frameT * 0.004) % 4;
    const colors = ["#ffd95c", "#ff5cd1", "#5cffe0", "#5cff8a"];
    ctx.fillStyle = colors[Math.floor(phase) % colors.length];
    ctx.fillRect(x, y, 2, 1);
  }
}

function drawPowerOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  power: keyof typeof POWER_GLYPHS,
  frameT: number,
) {
  const color = colorForPower(power);
  const t = frameT * 0.005;

  // pulsing glow
  const glowR = 9 + Math.sin(frameT * 0.008) * 1.2;
  const grd = ctx.createRadialGradient(x, y, 0, x, y, glowR);
  grd.addColorStop(0, color);
  grd.addColorStop(0.5, hexToRgba(color, 0.5));
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // rotating sparkle ring (4 dots)
  for (let i = 0; i < 4; i++) {
    const ang = t + (i * Math.PI) / 2;
    const rx = x + Math.cos(ang) * 7;
    const ry = y + Math.sin(ang) * 7;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect((rx - 0.5) | 0, (ry - 0.5) | 0, 1, 1);
  }

  // core
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // single-letter glyph on top — pixelated and crisp
  ctx.fillStyle = "#0a0a14";
  ctx.font = 'bold 6px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(POWER_GLYPHS[power], x, y + 0.5);
}

function drawPaddle(
  ctx: CanvasRenderingContext2D,
  side: Side,
  state: GameState,
  you: Side | "spectator",
  frameT: number,
) {
  const p = state.paddles[side];
  const x = side === "left" ? 4 : FIELD_W - 4 - PADDLE_W;
  const ch = CHARACTERS[state.characters[side]];
  const color = ch.color;
  const isYou = you === side;

  // animated glow that pulses subtly
  const glow = 8 + Math.sin(frameT * 0.005 + (side === "left" ? 0 : Math.PI)) * 2;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.fillRect(x, p.y, PADDLE_W, p.height);
  ctx.shadowBlur = 0;
  // top highlight + bottom shadow
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(x, p.y, PADDLE_W, 2);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x, p.y + p.height - 2, PADDLE_W, 2);
  // center accent
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x + 1, p.y + p.height / 2 - 1, PADDLE_W - 2, 2);
  ctx.restore();

  // shield indicator
  if (p.shield) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1;
    const cy = p.y + p.height / 2;
    const r = p.height / 2 + 4 + Math.sin(frameT * 0.01) * 0.5;
    ctx.beginPath();
    ctx.arc(x + PADDLE_W / 2, cy, r, 0, Math.PI * 2);
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

  // "VOS" indicator (small triangle pointing down at your paddle)
  if (isYou) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    const bob = Math.sin(frameT * 0.008) > 0 ? 0 : 1;
    ctx.fillText("▼", x + PADDLE_W / 2, p.y - 2 - bob);
    ctx.restore();
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  frameT: number,
) {
  ctx.save();
  // pulsing white glow
  const glow = 8 + Math.sin(frameT * 0.012) * 2;
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = glow;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.shadowBlur = 0;
  // pixel highlight (top-left)
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(x, y, 1, 1);
  // shadow corner (bottom-right)
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x + size - 1, y + size - 1, 1, 1);
  ctx.restore();
}

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

function drawScanlines(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#000";
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
  yFactor = 0.5,
) {
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillStyle = color;
  ctx.fillText(text, W / 2, H * yFactor);
  ctx.restore();
}

function drawSubText(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  color: string,
  yFactor = 0.5,
  offset = 36,
) {
  ctx.save();
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fillText(text, W / 2, H * yFactor + offset);
  ctx.restore();
}

function poseFor(
  side: Side,
  state: GameState,
  frameT: number,
): Pose {
  // Recent goal flash → winner happy, loser sad (for ~1500ms)
  if (
    state.lastEvent?.kind === "goal" &&
    state.now - state.lastEvent.t < 1500
  ) {
    const scorer = state.lastEvent.side;
    if (scorer) return scorer === side ? "happy" : "sad";
  }
  if (state.phase === "FINISHED" && state.winner) {
    return state.winner === side ? "happy" : "sad";
  }
  // periodic blink
  const blinkPhase = Math.floor(frameT / 180) % 32;
  if (blinkPhase === 0 || blinkPhase === 1) return "blink";
  return "idle";
}

function drawSpriteWithFrame(
  ctx: CanvasRenderingContext2D,
  id: CharacterId,
  pose: Pose,
  cx: number,
  cy: number,
  scale: number,
  glowColor: string,
) {
  const w = SPRITE_W * scale;
  const h = SPRITE_H * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;

  // arcade frame around sprite
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  ctx.shadowBlur = 0;
  // corner blocks for arcade vibe
  ctx.fillStyle = glowColor;
  ctx.fillRect(x - 4, y - 4, 4, 4);
  ctx.fillRect(x + w, y - 4, 4, 4);
  ctx.fillRect(x - 4, y + h, 4, 4);
  ctx.fillRect(x + w, y + h, 4, 4);
  ctx.restore();

  drawCharacter(ctx, id, pose, x, y, scale);
}

function drawWaitingMascots(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: GameState,
  frameT: number,
) {
  const left = CHARACTERS[state.characters.left];
  const right = CHARACTERS[state.characters.right];
  const bobL = Math.sin(frameT * 0.005) * 6;
  const bobR = Math.sin(frameT * 0.005 + Math.PI) * 6;
  const scale = 4;
  drawSpriteWithFrame(
    ctx,
    state.characters.left,
    poseFor("left", state, frameT),
    W * 0.25,
    H * 0.65 + bobL,
    scale,
    left.color,
  );
  drawSpriteWithFrame(
    ctx,
    state.characters.right,
    poseFor("right", state, frameT),
    W * 0.75,
    H * 0.65 + bobR,
    scale,
    right.color,
  );
  // VS divider
  ctx.save();
  ctx.font = '20px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#ffd95c";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffd95c";
  ctx.fillText("VS", W / 2, H * 0.65 + Math.sin(frameT * 0.01) * 2);
  ctx.restore();
}

function drawWinnerMascot(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: GameState,
  frameT: number,
) {
  const winner = state.winner;
  if (!winner) return;
  const ch = CHARACTERS[state.characters[winner]];
  const bob = Math.sin(frameT * 0.008) * 6;
  drawSpriteWithFrame(
    ctx,
    state.characters[winner],
    "happy",
    W / 2,
    H * 0.28 + bob,
    5,
    ch.color,
  );
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
