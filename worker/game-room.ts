/// <reference types="@cloudflare/workers-types" />

import {
  ClientMessage,
  FIELD_H,
  FIELD_W,
  GameState,
  PADDLE_W,
  ServerMessage,
  Side,
  TICK_MS,
} from "../src/lib/game-types";
import {
  Inputs,
  createInitialState,
  startCountdown,
  tick as gameTick,
} from "../src/lib/game-logic";

type BotDifficulty = "easy" | "medium" | "hard";

interface PlayerSlot {
  id: string;
  ws: WebSocket;
  side: Side;
  input: { up: boolean; down: boolean; targetY: number | null };
  nick: string;
}

function sanitizeNick(nick: unknown): string {
  if (typeof nick !== "string") return "";
  // strip control chars, normalize whitespace, cap length, uppercase for arcade vibe
  const cleaned = nick
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12)
    .toUpperCase();
  return cleaned;
}

export class GameRoom implements DurableObject {
  state: GameState;
  players = new Map<string, PlayerSlot>();
  spectators = new Map<string, WebSocket>();
  loopInterval: ReturnType<typeof setInterval> | null = null;
  lastTick = 0;
  botEnabled = false;
  botDifficulty: BotDifficulty = "medium";
  botSide: Side | null = null;
  botInput = { up: false, down: false, targetY: null as number | null };
  botJitterPhase = Math.random() * Math.PI * 2;

  constructor(_ctx: DurableObjectState, _env: unknown) {
    this.state = createInitialState(Date.now());
  }

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    // Bot mode: opt in via ?bot=1 (and optional ?difficulty=easy|medium|hard).
    // The flag sticks for the lifetime of the DO instance.
    const url = new URL(request.url);
    if (url.searchParams.get("bot") === "1") {
      this.botEnabled = true;
      const d = url.searchParams.get("difficulty");
      if (d === "easy" || d === "medium" || d === "hard") this.botDifficulty = d;
    }
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  handleSession(ws: WebSocket) {
    ws.accept();
    const id = crypto.randomUUID();

    const sides: Side[] = ["left", "right"];
    const taken = new Set(Array.from(this.players.values()).map((p) => p.side));
    const free = sides.find((s) => !taken.has(s));

    if (free) {
      const slot: PlayerSlot = {
        id,
        ws,
        side: free,
        input: { up: false, down: false, targetY: null },
        nick: "",
      };
      this.players.set(id, slot);
      this.send(ws, { type: "assign", you: free, playerId: id });

      if (this.botEnabled && !this.botSide) {
        this.attachBot();
      }

      this.broadcastState();

      const enoughToStart =
        this.players.size === 2 || (this.botEnabled && this.botSide);
      if (enoughToStart && this.state.phase === "WAITING") {
        startCountdown(this.state, Date.now());
        this.startLoop();
      }
    } else {
      this.spectators.set(id, ws);
      this.send(ws, { type: "assign", you: "left", playerId: id });
      this.broadcastState();
    }

    ws.addEventListener("message", (event) => {
      this.handleMessage(id, ws, event.data);
    });

    const cleanup = () => this.handleClose(id);
    ws.addEventListener("close", cleanup);
    ws.addEventListener("error", cleanup);
  }

  handleMessage(id: string, ws: WebSocket, raw: string | ArrayBuffer) {
    let data: string;
    if (typeof raw === "string") data = raw;
    else data = new TextDecoder().decode(raw);

    let msg: ClientMessage;
    try {
      msg = JSON.parse(data) as ClientMessage;
    } catch {
      return;
    }

    const slot = this.players.get(id);
    if (!slot) return;

    if (msg.type === "input") {
      slot.input = {
        up: !!msg.up,
        down: !!msg.down,
        targetY:
          typeof msg.targetY === "number" && Number.isFinite(msg.targetY)
            ? msg.targetY
            : null,
      };
    } else if (msg.type === "nick") {
      slot.nick = sanitizeNick(msg.nick);
      this.state.nicks[slot.side] = slot.nick;
      this.broadcastState();
    } else if (msg.type === "rematch") {
      if (this.state.phase !== "FINISHED") return;
      this.state.rematchVotes[slot.side] = true;
      // Auto-confirm bot's rematch vote
      if (this.botEnabled && this.botSide) {
        this.state.rematchVotes[this.botSide] = true;
      }
      if (this.state.rematchVotes.left && this.state.rematchVotes.right) {
        startCountdown(this.state, Date.now());
        this.startLoop();
      }
      this.broadcastState();
    } else if (msg.type === "ping") {
      this.send(ws, { type: "pong", t: msg.t });
    }
  }

  handleClose(id: string) {
    if (this.players.delete(id)) {
      if (this.state.phase !== "WAITING" && this.state.phase !== "FINISHED") {
        this.state.phase = "WAITING";
        this.stopLoop();
      }
      // If the human leaves a bot match, drop the bot too
      if (this.botEnabled && this.players.size === 0) {
        this.detachBot();
      }
      this.broadcastState();
    }
    this.spectators.delete(id);
  }

  attachBot() {
    const sides: Side[] = ["left", "right"];
    const taken = new Set<Side>(
      Array.from(this.players.values()).map((p) => p.side),
    );
    const free = sides.find((s) => !taken.has(s));
    if (!free) return;
    this.botSide = free;
    this.state.nicks[free] = "BOT";
    this.botInput = { up: false, down: false, targetY: null };
  }

  detachBot() {
    if (!this.botSide) return;
    this.state.nicks[this.botSide] = "";
    this.botSide = null;
    this.botInput = { up: false, down: false, targetY: null };
  }

  updateBotInput(now: number) {
    const side = this.botSide;
    if (!side) return;
    const paddle = this.state.paddles[side];
    const ball = this.state.ball;
    const ballCx = ball.x + ball.size / 2;
    const ballCy = ball.y + ball.size / 2;
    const paddleX = side === "left" ? PADDLE_W / 2 : FIELD_W - PADDLE_W / 2;
    const ballMovingTowardBot =
      (side === "left" && ball.vx < 0) || (side === "right" && ball.vx > 0);

    let targetCy: number;
    if (ballMovingTowardBot && Math.abs(ball.vx) > 1) {
      // Predict where the ball will be when it reaches the paddle
      const dx = paddleX - ballCx;
      const tHit = dx / ball.vx;
      let predicted = ballCy + ball.vy * tHit;
      // Account for top/bottom wall bounces during prediction
      const top = 0;
      const bottom = FIELD_H;
      const range = bottom - top;
      let bouncedY = predicted - top;
      bouncedY = ((bouncedY % (2 * range)) + 2 * range) % (2 * range);
      if (bouncedY > range) bouncedY = 2 * range - bouncedY;
      predicted = top + bouncedY;
      targetCy = predicted;
    } else {
      // Drift toward center while waiting
      targetCy = FIELD_H / 2;
    }

    // Difficulty modifiers
    let aimNoise = 0;
    let speedScale = 1;
    if (this.botDifficulty === "easy") {
      aimNoise = 32;
      speedScale = 0.55;
    } else if (this.botDifficulty === "medium") {
      aimNoise = 14;
      speedScale = 0.8;
    } else if (this.botDifficulty === "hard") {
      aimNoise = 4;
      speedScale = 1;
    }
    // Wobble so the bot doesn't feel robotic
    targetCy +=
      Math.sin(now / 420 + this.botJitterPhase) * aimNoise * 0.6 +
      (Math.random() - 0.5) * aimNoise * 0.4;

    // Convert center target to paddle.y
    let targetY = targetCy - paddle.height / 2;
    if (targetY < 0) targetY = 0;
    if (targetY > FIELD_H - paddle.height) targetY = FIELD_H - paddle.height;

    // Approach with limited speed by lerping the targetY we send.
    // The game loop already enforces PADDLE_DRAG_SPEED; we slow the bot by
    // not letting its requested target jump faster than its skill allows.
    const cur = paddle.y;
    const maxStep = 240 * speedScale * (TICK_MS / 1000);
    let smoothed: number;
    if (Math.abs(targetY - cur) <= maxStep) smoothed = targetY;
    else smoothed = cur + Math.sign(targetY - cur) * maxStep;

    this.botInput = { up: false, down: false, targetY: smoothed };
  }

  startLoop() {
    if (this.loopInterval) return;
    this.lastTick = Date.now();
    this.loopInterval = setInterval(() => this.loopStep(), TICK_MS);
  }

  stopLoop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  loopStep() {
    const now = Date.now();
    const dt = Math.min(0.1, (now - this.lastTick) / 1000);
    this.lastTick = now;

    if (this.botEnabled && this.botSide) {
      this.updateBotInput(now);
    }

    const inputs: Inputs = {
      left: { up: false, down: false, targetY: null },
      right: { up: false, down: false, targetY: null },
    };
    Array.from(this.players.values()).forEach((p) => {
      if (p.side === "left") inputs.left = p.input;
      else inputs.right = p.input;
    });
    if (this.botEnabled && this.botSide) {
      inputs[this.botSide] = this.botInput;
    }

    gameTick(this.state, inputs, dt, now);
    this.broadcastState();

    if (this.state.phase === "FINISHED") {
      this.stopLoop();
    }
  }

  broadcastState() {
    Array.from(this.players.values()).forEach((p) => {
      this.send(p.ws, { type: "state", state: this.state, you: p.side });
    });
    Array.from(this.spectators.values()).forEach((ws) => {
      this.send(ws, { type: "state", state: this.state, you: "spectator" });
    });
  }

  send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // ignore broken pipes
    }
  }
}
