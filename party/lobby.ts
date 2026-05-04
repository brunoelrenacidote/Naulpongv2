import type * as Party from "partykit/server";
import { LobbyServerMessage } from "../src/lib/game-types";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export default class LobbyServer implements Party.Server {
  queue: string[] = [];

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    this.queue.push(conn.id);
    this.tryMatch();
    this.broadcastQueue();
  }

  onClose(conn: Party.Connection) {
    this.queue = this.queue.filter((id) => id !== conn.id);
    this.broadcastQueue();
  }

  tryMatch() {
    while (this.queue.length >= 2) {
      const aId = this.queue.shift()!;
      const bId = this.queue.shift()!;
      const a = this.getConn(aId);
      const b = this.getConn(bId);
      if (!a || !b) continue;
      const code = generateCode();
      const msg: LobbyServerMessage = { type: "match", roomCode: code };
      a.send(JSON.stringify(msg));
      b.send(JSON.stringify(msg));
      // close them out of the lobby
      a.close();
      b.close();
    }
  }

  broadcastQueue() {
    const total = this.queue.length;
    this.queue.forEach((id, idx) => {
      const conn = this.getConn(id);
      if (!conn) return;
      const msg: LobbyServerMessage = { type: "queue", position: idx + 1, total };
      conn.send(JSON.stringify(msg));
    });
  }

  getConn(id: string): Party.Connection | null {
    return this.room.getConnection(id) ?? null;
  }
}

LobbyServer satisfies Party.Worker;
