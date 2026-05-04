/// <reference types="@cloudflare/workers-types" />

import {
  ClientMessage,
  GameState,
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

  constructor(_ctx: DurableObjectState, _env: unknown) {
    this.state = createInitialState(Date.now());
  }

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
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
      this.broadcastState();

      if (this.players.size === 2 && this.state.phase === "WAITING") {
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
      this.broadcastState();
    }
    this.spectators.delete(id);
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

    const inputs: Inputs = {
      left: { up: false, down: false, targetY: null },
      right: { up: false, down: false, targetY: null },
    };
    Array.from(this.players.values()).forEach((p) => {
      if (p.side === "left") inputs.left = p.input;
      else inputs.right = p.input;
    });

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
