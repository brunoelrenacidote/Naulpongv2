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

type Mode = "menu" | "queue" | "join" | "bot";

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

  function startBot(diff: "easy" | "medium" | "hard") {
    setError(null);
    if (!ensureNick()) return;
    const c = generateCode();
    router.push(`/play/${c}?host=1&bot=1&diff=${diff}`);
  }

  if (mode === "queue") {
    return (
      <div className="font-press flex w-full max-w-md flex-col items-center gap-5 text-center">
        <p className="glow-yellow blink text-base sm:text-lg">BUSCANDO RIVAL</p>
        <p className="font-vt text-4xl text-white sm:text-5xl">
          {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
          {String(elapsed % 60).padStart(2, "0")}
        </p>
        <p className="text-[10px] text-white/70 sm:text-xs">
          POSICIÓN EN COLA: {queueState.position} / {queueState.total}
        </p>
        <p className="glow-cyan text-[10px] sm:text-xs">JUGADOR: {nick}</p>
        <button className="btn-chunky pink" onClick={cancelQueue}>
          CANCELAR
        </button>
      </div>
    );
  }

  if (mode === "bot") {
    return (
      <div className="flex w-full max-w-md flex-col items-stretch gap-3">
        <p className="font-press glow-cyan text-center text-xs">
          ELEGÍ DIFICULTAD
        </p>
        <button className="btn-chunky green" onClick={() => startBot("easy")}>
          🟢 FÁCIL
        </button>
        <button className="btn-chunky yellow" onClick={() => startBot("medium")}>
          🟡 MEDIO
        </button>
        <button className="btn-chunky pink" onClick={() => startBot("hard")}>
          🔴 DIFÍCIL
        </button>
        {error && (
          <p className="font-press glow-pink text-center text-[10px]">
            ! {error}
          </p>
        )}
        <button
          className="btn-chunky mt-2"
          onClick={() => setMode("menu")}
        >
          ← VOLVER
        </button>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="flex w-full max-w-md flex-col items-stretch gap-3">
        <p className="font-press glow-cyan text-center text-xs">
          INGRESÁ EL CÓDIGO
        </p>
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
          <p className="font-press glow-pink text-center text-[10px]">
            ! {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-chunky pink" onClick={() => setMode("menu")}>
            ← VOLVER
          </button>
          <button className="btn-chunky" onClick={joinRoom}>
            ENTRAR →
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
      <button
        className="btn-mega"
        onClick={startQuickMatch}
        aria-label="Partida rápida"
      >
        <span aria-hidden>⚡</span>
        <span>PARTIDA RÁPIDA</span>
        <span aria-hidden>⚡</span>
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-chunky" onClick={createRoom}>
          🎮 CREAR
          <br />
          SALA
        </button>
        <button className="btn-chunky pink" onClick={() => setMode("join")}>
          🔑 UNIRSE
          <br />
          CON CÓDIGO
        </button>
      </div>
      <button
        className="btn-chunky green"
        onClick={() => {
          setError(null);
          if (ensureNick()) setMode("bot");
        }}
      >
        🤖 PRÁCTICA VS BOT
      </button>
      {error && (
        <p className="font-press glow-pink mt-2 text-center text-[10px]">
          ! {error}
        </p>
      )}
    </div>
  );
}
