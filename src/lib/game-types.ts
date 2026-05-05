export const FIELD_W = 320;
export const FIELD_H = 180;
export const PADDLE_W = 4;
export const PADDLE_H = 28;
export const BALL_SIZE = 4;
export const TICK_HZ = 30;
export const TICK_MS = 1000 / TICK_HZ;
export const WIN_SCORE = 7;
export const PADDLE_SPEED = 260; // px/s — faster, more responsive
export const PADDLE_DRAG_SPEED = 720; // px/s — drag/touch follows finger fast
export const BALL_BASE_SPEED = 150; // px/s
export const BALL_MAX_SPEED = 320;
export const BALL_SPEED_INC = 8; // per paddle hit

export type Side = "left" | "right";

export type PowerId =
  | "slowmo"
  | "paddleXL"
  | "paddleMini"
  | "turbo"
  | "shield"
  | "freeze"
  | "curve"
  | "invert";

export const POWER_IDS: PowerId[] = [
  "slowmo",
  "paddleXL",
  "paddleMini",
  "turbo",
  "shield",
  "freeze",
  "curve",
  "invert",
];

export const POWER_LABELS: Record<PowerId, string> = {
  slowmo: "SLOW MO",
  paddleXL: "PADDLE XL",
  paddleMini: "MINI ENEMIGA",
  turbo: "TURBO BALL",
  shield: "ESCUDO",
  freeze: "CONGELAR",
  curve: "CURVA",
  invert: "INVERTIR",
};

export const POWER_EMOJIS: Record<PowerId, string> = {
  slowmo: "🐢",
  paddleXL: "📏",
  paddleMini: "🔪",
  turbo: "🚀",
  shield: "🛡️",
  freeze: "❄️",
  curve: "🌀",
  invert: "🔄",
};

// Single-letter pixel-friendly codes used inside the canvas
// (emojis don't render cleanly in the 320×180 pixel-art viewport).
export const POWER_GLYPHS: Record<PowerId, string> = {
  slowmo: "S",
  paddleXL: "X",
  paddleMini: "M",
  turbo: "T",
  shield: "D",
  freeze: "F",
  curve: "C",
  invert: "I",
};

export type CharacterId = "hijo-fiesta" | "clavel";

export const CHARACTERS: Record<
  CharacterId,
  { id: CharacterId; name: string; color: string; emoji: string }
> = {
  "hijo-fiesta": {
    id: "hijo-fiesta",
    name: "EL WEY QUE VA POR SU HIJO A LAS FIESTAS",
    color: "#5cffc8",
    emoji: "👨‍🦱",
  },
  clavel: {
    id: "clavel",
    name: "EL CLAVEL",
    color: "#ff5c8a",
    emoji: "🌹",
  },
};

export type Phase =
  | "WAITING"
  | "COUNTDOWN"
  | "PLAYING"
  | "GOAL"
  | "FINISHED";

export type StageId = "barrio" | "espacio" | "disco" | "subte";

export const STAGE_IDS: StageId[] = ["barrio", "espacio", "disco", "subte"];

export const STAGE_LABELS: Record<StageId, string> = {
  barrio: "BARRIO",
  espacio: "ESPACIO",
  disco: "DISCO",
  subte: "SUBTE",
};

export interface PaddleState {
  y: number;
  height: number;
  speedMul: number;
  frozenUntil: number; // ms timestamp
  invertedUntil: number;
  shield: boolean;
  activeBuffs: ActiveBuff[];
}

export interface ActiveBuff {
  power: PowerId;
  expiresAt: number; // ms timestamp; 0 = passive (until consumed)
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  curveUntil: number; // ms
  curveSign: 1 | -1;
  lastTouchedBy: Side | null;
}

export interface PowerOrbState {
  id: string;
  power: PowerId;
  x: number;
  y: number;
}

export interface GameState {
  tick: number;
  now: number; // ms timestamp
  phase: Phase;
  countdownEndsAt: number;
  goalEndsAt: number;
  scores: { left: number; right: number };
  paddles: { left: PaddleState; right: PaddleState };
  ball: BallState;
  extraBalls: BallState[];
  orbs: PowerOrbState[];
  characters: { left: CharacterId; right: CharacterId };
  nicks: { left: string; right: string };
  speedMul: number; // global ball speed multiplier (slow mo)
  speedMulUntil: number;
  winner: Side | null;
  rematchVotes: { left: boolean; right: boolean };
  stage: StageId;
  lastEvent?: { kind: "hit" | "goal" | "power" | "wall" | "spawn"; side?: Side; power?: PowerId; t: number };
}

export type ClientMessage =
  | { type: "input"; up: boolean; down: boolean; targetY?: number | null }
  | { type: "nick"; nick: string }
  | { type: "rematch" }
  | { type: "ready" }
  | { type: "ping"; t: number };

export type ServerMessage =
  | { type: "state"; state: GameState; you: Side | "spectator" }
  | { type: "assign"; you: Side; playerId: string }
  | { type: "fullPing"; t: number }
  | { type: "pong"; t: number };

// Lobby protocol
export type LobbyClientMessage = { type: "join"; nick: string } | { type: "leave" };
export type LobbyServerMessage =
  | { type: "queue"; position: number; total: number }
  | { type: "match"; roomCode: string };

export function newPaddle(): PaddleState {
  return {
    y: FIELD_H / 2 - PADDLE_H / 2,
    height: PADDLE_H,
    speedMul: 1,
    frozenUntil: 0,
    invertedUntil: 0,
    shield: false,
    activeBuffs: [],
  };
}

export function newBall(serveTo: Side): BallState {
  const dir = serveTo === "right" ? 1 : -1;
  const angle = (Math.random() - 0.5) * 0.35; // gentle initial angle so first volleys are catchable
  const speed = BALL_BASE_SPEED;
  return {
    x: FIELD_W / 2 - BALL_SIZE / 2,
    y: FIELD_H / 2 - BALL_SIZE / 2,
    vx: dir * speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    size: BALL_SIZE,
    curveUntil: 0,
    curveSign: 1,
    lastTouchedBy: null,
  };
}

export function pickRandomCharacters(): { left: CharacterId; right: CharacterId } {
  const ids: CharacterId[] = ["hijo-fiesta", "clavel"];
  if (Math.random() < 0.5) ids.reverse();
  return { left: ids[0], right: ids[1] };
}

export function pickRandomStage(): StageId {
  return STAGE_IDS[Math.floor(Math.random() * STAGE_IDS.length)];
}
