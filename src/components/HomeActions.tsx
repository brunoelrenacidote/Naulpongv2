"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PartySocket from "partysocket";
import { LobbyServerMessage } from "@/lib/game-types";
import { partyHost } from "@/lib/party-host";

const NICK_KEY = "naulpong:nick";
const NICK_MAX = 12;

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function sanitizeNick(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 _\-]/g, "")
    .toUpperCase()
    .slice(0, NICK_MAX);
}

type Mode = "menu" | "queue" | "join";

export default function HomeActions() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");
  const [code, setCode] = useState("");
  const [nick, setNick] = useState("");
  const [queueState, setQueueState] = useState<{ position: number; total: number }>({
    position: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const lobbyRef = useRef<PartySocket | null>(null);
  const elapsedRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);

  // Load nick from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(NICK_KEY) ?? "";
    setNick(stored);
  }, []);

  function persistNick(value: string) {
    const clean = sanitizeNick(value);
    setNick(clean);
    if (clean) localStorage.setItem(NICK_KEY, clean);
    else localStorage.removeItem(NICK_KEY);
  }

  useEffect(() => {
    if (mode !== "queue") return;
    const start = Date.now();
    elapsedRef.current = 0;
    const t = setInterval(() => {
      const e = Math.floor((Date.now() - start) / 1000);
      elapsedRef.current = e;
      setElapsed(e);
    }, 250);
    return () => clearInterval(t);
  }, [mode]);

  function ensureNick(): boolean {
    if (!nick.trim()) {
      setError("ELEGÍ UN NOMBRE PRIMERO");
      return false;
    }
    return true;
  }

  function startQuickMatch() {
    setError(null);
    if (!ensureNick()) return;
    setMode("queue");
    const ws = new PartySocket({
      host: partyHost(),
      party: "lobby",
      room: "global",
    });
    lobbyRef.current = ws;

    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data) as LobbyServerMessage;
        if (msg.type === "match") {
          ws.close();
          router.push(`/play/${msg.roomCode}?mode=quick`);
        } else if (msg.type === "queue") {
          setQueueState({ position: msg.position, total: msg.total });
        }
      } catch {
        // ignore
      }
    });

    ws.addEventListener("error", () => {
      setError("No se pudo conectar al servidor de matchmaking. Probá de nuevo.");
    });
  }

  function cancelQueue() {
    lobbyRef.current?.close();
    lobbyRef.current = null;
    setMode("menu");
  }

  function createRoom() {
    setError(null);
    if (!ensureNick()) return;
    const c = generateCode();
    router.push(`/play/${c}?host=1`);
  }

  function joinRoom() {
    if (!ensureNick()) return;
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      setError("CÓDIGO INVÁLIDO");
      return;
    }
    router.push(`/play/${c}`);
  }

  if (mode === "queue") {
    return (
      <div className="font-press flex flex-col items-center gap-6 text-center">
        <p className="glow-yellow blink text-base sm:text-lg">BUSCANDO RIVAL</p>
        <p className="font-vt text-3xl text-white sm:text-4xl">
          {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
          {String(elapsed % 60).padStart(2, "0")}
        </p>
        <p className="text-[10px] text-white/70 sm:text-xs">
          POSICIÓN EN COLA: {queueState.position} / {queueState.total}
        </p>
        <p className="glow-cyan text-[10px] sm:text-xs">JUGADOR: {nick}</p>
        <button className="btn-arcade pink" onClick={cancelQueue}>
          CANCELAR
        </button>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <p className="font-press glow-cyan text-xs">INGRESÁ EL CÓDIGO</p>
        <input
          autoFocus
          maxLength={6}
          className="input-arcade"
          placeholder="XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") joinRoom();
          }}
        />
        {error && (
          <p className="font-press glow-pink text-[10px]">! {error}</p>
        )}
        <div className="flex gap-3">
          <button className="btn-arcade pink" onClick={() => setMode("menu")}>
            VOLVER
          </button>
          <button className="btn-arcade" onClick={joinRoom}>
            ENTRAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:gap-4">
      <div className="flex flex-col items-stretch gap-1">
        <label className="font-press glow-cyan text-[10px] sm:text-xs">
          TU NOMBRE
        </label>
        <input
          maxLength={NICK_MAX}
          className="input-arcade text-center"
          placeholder="JUGADOR-1"
          value={nick}
          onChange={(e) => persistNick(e.target.value)}
        />
        <p className="font-press text-[8px] text-white/40 sm:text-[9px]">
          MÁX {NICK_MAX} CARACTERES · A-Z 0-9
        </p>
      </div>
      <button className="btn-arcade yellow" onClick={startQuickMatch}>
        ⚡ PARTIDA RÁPIDA
      </button>
      <button className="btn-arcade" onClick={createRoom}>
        🎮 CREAR SALA
      </button>
      <button className="btn-arcade pink" onClick={() => setMode("join")}>
        🔑 UNIRSE CON CÓDIGO
      </button>
      {error && (
        <p className="font-press glow-pink mt-2 text-center text-[10px]">
          ! {error}
        </p>
      )}
    </div>
  );
}
