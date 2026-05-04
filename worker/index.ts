/// <reference types="@cloudflare/workers-types" />

import { GameRoom } from "./game-room";
import { LobbyRoom } from "./lobby-room";

export { GameRoom, LobbyRoom };

export interface Env {
  GAME: DurableObjectNamespace;
  LOBBY: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight (allow any origin since we use simple Origin checks elsewhere)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response("NauLPong worker OK", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Expected URL pattern: /parties/<partyName>/<roomId>
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "parties" || parts.length < 3) {
      return new Response("Not found", { status: 404 });
    }
    const partyName = parts[1].toLowerCase();
    const roomId = parts.slice(2).join("/");

    let ns: DurableObjectNamespace;
    if (partyName === "main" || partyName === "naulpong" || partyName === "game") {
      ns = env.GAME;
    } else if (partyName === "lobby") {
      ns = env.LOBBY;
    } else {
      return new Response(`Unknown party: ${partyName}`, { status: 404 });
    }

    const id = ns.idFromName(roomId);
    const stub = ns.get(id);
    return stub.fetch(request);
  },
};
