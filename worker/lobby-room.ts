/// <reference types="@cloudflare/workers-types" />

import { LobbyServerMessage } from "../src/lib/game-types";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

interface Waiter {
  id: string;
  ws: WebSocket;
}

export class LobbyRoom implements DurableObject {
  queue: Waiter[] = [];

  constructor(_ctx: DurableObjectState, _env: unknown) {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
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
    this.queue.push({ id, ws });
    this.tryMatch();
    this.broadcastQueue();

    const remove = () => {
      this.queue = this.queue.filter((w) => w.id !== id);
      this.broadcastQueue();
    };
    ws.addEventListener("close", remove);
    ws.addEventListener("error", remove);
  }

  tryMatch() {
    while (this.queue.length >= 2) {
      const a = this.queue.shift()!;
      const b = this.queue.shift()!;
      const code = generateCode();
      const msg: LobbyServerMessage = { type: "match", roomCode: code };
      const payload = JSON.stringify(msg);
      try {
        a.ws.send(payload);
        b.ws.send(payload);
      } catch {
        // ignore
      }
      try {
        a.ws.close();
        b.ws.close();
      } catch {
        // ignore
      }
    }
  }

  broadcastQueue() {
    const total = this.queue.length;
    this.queue.forEach((w, idx) => {
      const msg: LobbyServerMessage = {
        type: "queue",
        position: idx + 1,
        total,
      };
      try {
        w.ws.send(JSON.stringify(msg));
      } catch {
        // ignore
      }
    });
  }
}
