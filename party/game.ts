import type * as Party from "partykit/server";
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
  connId: string;
  side: Side;
  input: { up: boolean; down: boolean };
}

export default class GameServer implements Party.Server {
  state: GameState;
  players: Map<string, PlayerSlot> = new Map();
  loopInterval: ReturnType<typeof setInterval> | null = null;
  lastTick: number = 0;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState(Date.now());
  }

  onConnect(conn: Party.Connection) {
    // Assign side
    const sides: Side[] = ["left", "right"];
    const taken = new Set(Array.from(this.players.values()).map((p) => p.side));
    const free = sides.find((s) => !taken.has(s));
    if (free) {
      const slot: PlayerSlot = {
        connId: conn.id,
        side: free,
        input: { up: false, down: false },
      };
      this.players.set(conn.id, slot);
      this.send(conn, { type: "assign", you: free, playerId: conn.id });
      this.broadcastState();

      if (this.players.size === 2 && this.state.phase === "WAITING") {
        startCountdown(this.state, Date.now());
        this.startLoop();
      }
    } else {
      // spectator
      this.send(conn, { type: "assign", you: "left", playerId: conn.id });
      this.broadcastState();
    }
  }

  onClose(conn: Party.Connection) {
    const slot = this.players.get(conn.id);
    if (!slot) return;
    this.players.delete(conn.id);
    if (this.state.phase !== "WAITING" && this.state.phase !== "FINISHED") {
      // back to waiting
      this.state.phase = "WAITING";
      this.stopLoop();
    }
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    const slot = this.players.get(sender.id);
    if (!slot) return;

    if (msg.type === "input") {
      slot.input = { up: !!msg.up, down: !!msg.down };
    } else if (msg.type === "rematch") {
      if (this.state.phase !== "FINISHED") return;
      this.state.rematchVotes[slot.side] = true;
      if (this.state.rematchVotes.left && this.state.rematchVotes.right) {
        startCountdown(this.state, Date.now());
        this.startLoop();
      }
      this.broadcastState();
    } else if (msg.type === "ping") {
      this.send(sender, { type: "pong", t: msg.t });
    }
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
      left: { up: false, down: false },
      right: { up: false, down: false },
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
    Array.from(this.room.getConnections()).forEach((conn) => {
      const slot = this.players.get(conn.id);
      const you: Side | "spectator" = slot ? slot.side : "spectator";
      this.send(conn, { type: "state", state: this.state, you });
    });
  }

  send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }
}

GameServer satisfies Party.Worker;
