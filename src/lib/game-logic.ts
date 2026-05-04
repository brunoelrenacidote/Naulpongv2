import {
  ActiveBuff,
  BALL_MAX_SPEED,
  BALL_SPEED_INC,
  BallState,
  FIELD_H,
  FIELD_W,
  GameState,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PaddleState,
  PowerId,
  POWER_IDS,
  PowerOrbState,
  Side,
  WIN_SCORE,
  newBall,
  newPaddle,
  pickRandomCharacters,
} from "./game-types";

export function createInitialState(now: number): GameState {
  return {
    tick: 0,
    now,
    phase: "WAITING",
    countdownEndsAt: 0,
    goalEndsAt: 0,
    scores: { left: 0, right: 0 },
    paddles: { left: newPaddle(), right: newPaddle() },
    ball: newBall("right"),
    extraBalls: [],
    orbs: [],
    characters: pickRandomCharacters(),
    speedMul: 1,
    speedMulUntil: 0,
    winner: null,
    rematchVotes: { left: false, right: false },
  };
}

export function startCountdown(state: GameState, now: number) {
  state.phase = "COUNTDOWN";
  state.countdownEndsAt = now + 3000;
  state.scores = { left: 0, right: 0 };
  state.paddles = { left: newPaddle(), right: newPaddle() };
  state.ball = newBall(Math.random() < 0.5 ? "left" : "right");
  state.extraBalls = [];
  state.orbs = [];
  state.speedMul = 1;
  state.speedMulUntil = 0;
  state.winner = null;
  state.rematchVotes = { left: false, right: false };
  state.characters = pickRandomCharacters();
}

export function setPlaying(state: GameState) {
  state.phase = "PLAYING";
  state.countdownEndsAt = 0;
}

export interface Inputs {
  left: { up: boolean; down: boolean };
  right: { up: boolean; down: boolean };
}

export function tick(state: GameState, inputs: Inputs, dt: number, now: number) {
  state.now = now;
  state.tick++;

  // expire active buffs
  expireBuffs(state.paddles.left, now);
  expireBuffs(state.paddles.right, now);
  if (state.speedMulUntil > 0 && now > state.speedMulUntil) {
    state.speedMul = 1;
    state.speedMulUntil = 0;
  }

  if (state.phase === "COUNTDOWN") {
    if (now >= state.countdownEndsAt) {
      state.phase = "PLAYING";
      state.countdownEndsAt = 0;
    }
    return;
  }

  if (state.phase === "GOAL") {
    if (now >= state.goalEndsAt) {
      // check winner
      if (state.scores.left >= WIN_SCORE) {
        state.phase = "FINISHED";
        state.winner = "left";
      } else if (state.scores.right >= WIN_SCORE) {
        state.phase = "FINISHED";
        state.winner = "right";
      } else {
        state.phase = "PLAYING";
      }
      state.goalEndsAt = 0;
    }
    return;
  }

  if (state.phase !== "PLAYING") return;

  // Move paddles
  movePaddle(state.paddles.left, inputs.left, now, dt);
  movePaddle(state.paddles.right, inputs.right, now, dt);

  // Move balls
  const balls = [state.ball, ...state.extraBalls];
  const ballsToKeep: BallState[] = [];
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    const result = moveBall(state, b, dt, now);
    if (result === "removed") {
      // an extra ball that scored or was removed; primary ball respawns instead
      if (i === 0) {
        ballsToKeep.push(b);
      }
    } else {
      ballsToKeep.push(b);
    }
  }
  state.ball = ballsToKeep[0];
  state.extraBalls = ballsToKeep.slice(1);

  // Maybe spawn power orbs
  maybeSpawnOrb(state, now);

  // Orb collision with balls
  collectOrbs(state, now);
}

function expireBuffs(p: PaddleState, now: number) {
  // size buffs
  let height = PADDLE_H;
  const speedMul = 1;
  const stillActive: ActiveBuff[] = [];
  for (const b of p.activeBuffs) {
    if (b.expiresAt > 0 && now > b.expiresAt) continue;
    stillActive.push(b);
    if (b.power === "paddleXL") height = PADDLE_H * 2;
    if (b.power === "paddleMini") height = PADDLE_H * 0.5;
  }
  p.activeBuffs = stillActive;
  p.height = height;
  p.speedMul = speedMul;

  if (p.frozenUntil > 0 && now > p.frozenUntil) p.frozenUntil = 0;
  if (p.invertedUntil > 0 && now > p.invertedUntil) p.invertedUntil = 0;
}

function movePaddle(
  p: PaddleState,
  input: { up: boolean; down: boolean },
  now: number,
  dt: number,
) {
  if (p.frozenUntil > now) return;
  let up = input.up;
  let down = input.down;
  if (p.invertedUntil > now) {
    [up, down] = [down, up];
  }
  let dy = 0;
  if (up) dy -= 1;
  if (down) dy += 1;
  if (dy === 0) return;
  p.y += dy * PADDLE_SPEED * p.speedMul * dt;
  if (p.y < 0) p.y = 0;
  if (p.y + p.height > FIELD_H) p.y = FIELD_H - p.height;
}

function moveBall(state: GameState, b: BallState, dt: number, now: number): "ok" | "removed" {
  // Curve effect
  if (b.curveUntil > now) {
    // sinusoidal vertical wobble
    const t = (b.curveUntil - now) / 1000;
    const wobble = Math.sin(t * 8) * 30 * b.curveSign;
    b.vy += wobble * dt;
  }

  const mul = state.speedMul;
  const stepX = b.vx * mul * dt;
  const stepY = b.vy * mul * dt;

  // Multi-step subdivision to reduce tunneling
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(stepX), Math.abs(stepY)) / 4));
  const sx = stepX / steps;
  const sy = stepY / steps;

  for (let i = 0; i < steps; i++) {
    b.x += sx;
    b.y += sy;

    // Top/bottom walls
    if (b.y < 0) {
      b.y = 0;
      b.vy = Math.abs(b.vy);
      state.lastEvent = { kind: "wall", t: now };
    } else if (b.y + b.size > FIELD_H) {
      b.y = FIELD_H - b.size;
      b.vy = -Math.abs(b.vy);
      state.lastEvent = { kind: "wall", t: now };
    }

    // Left paddle
    if (b.vx < 0 && b.x <= PADDLE_W + 4 && b.x + b.size >= 4) {
      const p = state.paddles.left;
      if (b.y + b.size >= p.y && b.y <= p.y + p.height) {
        b.x = PADDLE_W + 4;
        bouncePaddle(b, p, "left");
        b.lastTouchedBy = "left";
        state.lastEvent = { kind: "hit", side: "left", t: now };
      }
    }

    // Right paddle
    const rightPx = FIELD_W - 4 - PADDLE_W;
    if (b.vx > 0 && b.x + b.size >= rightPx && b.x <= rightPx + PADDLE_W) {
      const p = state.paddles.right;
      if (b.y + b.size >= p.y && b.y <= p.y + p.height) {
        b.x = rightPx - b.size;
        bouncePaddle(b, p, "right");
        b.lastTouchedBy = "right";
        state.lastEvent = { kind: "hit", side: "right", t: now };
      }
    }

    // Goal check
    if (b.x + b.size < 0) {
      // right scored against left
      onGoal(state, "right", now, b);
      return "ok"; // primary ball; will be reset by onGoal
    } else if (b.x > FIELD_W) {
      onGoal(state, "left", now, b);
      return "ok";
    }
  }

  return "ok";
}

function bouncePaddle(b: BallState, p: PaddleState, side: Side) {
  // Compute impact offset (-1..1)
  const cy = b.y + b.size / 2;
  const pcy = p.y + p.height / 2;
  const offset = (cy - pcy) / (p.height / 2);
  const clamped = Math.max(-1, Math.min(1, offset));
  const speed = Math.min(BALL_MAX_SPEED, Math.hypot(b.vx, b.vy) + BALL_SPEED_INC);
  const angle = clamped * (Math.PI / 3); // up to 60deg
  const dir = side === "left" ? 1 : -1;
  b.vx = dir * speed * Math.cos(angle);
  b.vy = speed * Math.sin(angle);
}

function onGoal(state: GameState, scorer: Side, now: number, ball: BallState) {
  const opponent: Side = scorer === "left" ? "right" : "left";
  // Shield consumes the goal
  if (state.paddles[opponent].shield) {
    state.paddles[opponent].shield = false;
    // bounce ball back instead
    ball.x = opponent === "left" ? PADDLE_W + 4 : FIELD_W - 4 - PADDLE_W - ball.size;
    ball.vx = (opponent === "left" ? 1 : -1) * Math.abs(ball.vx);
    state.lastEvent = { kind: "power", side: opponent, power: "shield", t: now };
    return;
  }

  state.scores[scorer]++;
  state.lastEvent = { kind: "goal", side: scorer, t: now };

  // Reset main ball; remove extras
  state.extraBalls = [];
  state.ball = newBall(opponent);
  state.orbs = [];
  // tiny pause
  state.phase = "GOAL";
  state.goalEndsAt = now + 1200;
}

function maybeSpawnOrb(state: GameState, now: number) {
  if (state.orbs.length >= 2) return;
  // Spawn probability tuned to ~ 1 per 5-9s
  if (Math.random() > 0.005) return;

  const id = `orb-${state.tick}-${Math.floor(Math.random() * 9999)}`;
  const power = POWER_IDS[Math.floor(Math.random() * POWER_IDS.length)];
  // Avoid spawning right next to paddles
  const x = 60 + Math.random() * (FIELD_W - 120);
  const y = 20 + Math.random() * (FIELD_H - 40);
  const orb: PowerOrbState = { id, power, x, y };
  state.orbs.push(orb);
  state.lastEvent = { kind: "spawn", power, t: now };
}

function collectOrbs(state: GameState, now: number) {
  if (state.orbs.length === 0) return;
  const balls = [state.ball, ...state.extraBalls];
  const remaining: PowerOrbState[] = [];
  for (const orb of state.orbs) {
    let collected = false;
    let by: Side | null = null;
    for (const b of balls) {
      if (
        b.x + b.size >= orb.x - 6 &&
        b.x <= orb.x + 6 &&
        b.y + b.size >= orb.y - 6 &&
        b.y <= orb.y + 6
      ) {
        if (b.lastTouchedBy) {
          collected = true;
          by = b.lastTouchedBy;
          break;
        }
      }
    }
    if (collected && by) {
      applyPower(state, by, orb.power, now);
    } else {
      remaining.push(orb);
    }
  }
  state.orbs = remaining;
}

export function applyPower(state: GameState, side: Side, power: PowerId, now: number) {
  const me = state.paddles[side];
  const opp = state.paddles[side === "left" ? "right" : "left"];
  state.lastEvent = { kind: "power", side, power, t: now };

  switch (power) {
    case "slowmo":
      state.speedMul = 0.55;
      state.speedMulUntil = now + 4000;
      break;
    case "paddleXL":
      me.activeBuffs.push({ power: "paddleXL", expiresAt: now + 5000 });
      break;
    case "paddleMini":
      opp.activeBuffs.push({ power: "paddleMini", expiresAt: now + 5000 });
      break;
    case "turbo": {
      const speed = Math.hypot(state.ball.vx, state.ball.vy);
      const newSpeed = Math.min(BALL_MAX_SPEED, speed * 1.5);
      const k = newSpeed / Math.max(1, speed);
      state.ball.vx *= k;
      state.ball.vy *= k;
      break;
    }
    case "shield":
      me.shield = true;
      break;
    case "freeze":
      opp.frozenUntil = Math.max(opp.frozenUntil, now + 2000);
      break;
    case "curve": {
      state.ball.curveUntil = now + 5000;
      state.ball.curveSign = Math.random() < 0.5 ? 1 : -1;
      break;
    }
    case "invert":
      opp.invertedUntil = Math.max(opp.invertedUntil, now + 4000);
      break;
  }
}
