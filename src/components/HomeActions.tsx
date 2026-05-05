"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PartySocket from "partysocket";
import ModeCard from "@/components/ModeCard";
import { LobbyServerMessage } from "@/lib/game-types";
import { partyHost } from "@/lib/party-host";

const NICK_KEY = "naulpong:nick";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

type Screen = "menu" | "queue" | "bot" | "private" | "join";

/**
 * Hub de modos. La home no es más un formulario:
 *  - "menu": tarjetas grandes de modos (Partida Rápida / VS Bot / Sala Privada).
 *  - "bot": tarjetas de dificultad.
 *  - "private": Crear / Unirse.
 *  - "join": ingreso de código.
 *  - "queue": pantalla "buscando rival".
 *
 * El nombre del jugador ya viene resuelto por el componente Onboarding,
 * así que acá no se pide.
 */
export default function HomeActions({ nick }: { nick: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("menu");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<{ position: number; total: number }>({
    position: 0,
    total: 0,
  });
  const [elapsed, setElapsed] = useState(0);
  const lobbyRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    if (screen !== "queue") return;
    const start = Date.now();
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 250);
    return () => clearInterval(t);
  }, [screen]);

  function ensure(): boolean {
    const n = (nick ?? localStorage.getItem(NICK_KEY) ?? "").trim();
    if (!n) {
      setError("PRIMERO PONÉ TU NOMBRE EN PERFIL");
      return false;
    }
    return true;
  }

  function startQuickMatch() {
    setError(null);
    if (!ensure()) return;
    setScreen("queue");
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
        /* ignore */
      }
    });
    ws.addEventListener("error", () => {
      setError("No se pudo conectar al matchmaking. Probá de nuevo.");
    });
  }

  function cancelQueue() {
    lobbyRef.current?.close();
    lobbyRef.current = null;
    setScreen("menu");
  }

  function createRoom() {
    setError(null);
    if (!ensure()) return;
    const c = generateCode();
    router.push(`/play/${c}?host=1`);
  }

  function joinRoom() {
    if (!ensure()) return;
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      setError("CÓDIGO INVÁLIDO");
      return;
    }
    router.push(`/play/${c}`);
  }

  function startBot(diff: "easy" | "medium" | "hard") {
    setError(null);
    if (!ensure()) return;
    const c = generateCode();
    router.push(`/play/${c}?host=1&bot=1&diff=${diff}`);
  }

  if (screen === "queue") {
    return (
      <div className="font-press flex w-full max-w-md flex-col items-center gap-5 text-center">
        <p className="glow-yellow blink text-base">BUSCANDO RIVAL</p>
        <p className="font-vt text-5xl text-white">
          {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
          {String(elapsed % 60).padStart(2, "0")}
        </p>
        <p className="text-[10px] text-white/70">
          POSICIÓN: {queueState.position} / {queueState.total}
        </p>
        <p className="glow-cyan text-[10px]">JUGADOR: {nick}</p>
        <button className="btn-chunky pink" onClick={cancelQueue}>
          CANCELAR
        </button>
      </div>
    );
  }

  if (screen === "bot") {
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <BackHeader onBack={() => setScreen("menu")} title="VS BOT" />
        <ModeCard
          glyph="🟢"
          title="FÁCIL"
          subtitle="Tranqui, calentamiento."
          color="#5cff8a"
          onClick={() => startBot("easy")}
        />
        <ModeCard
          glyph="🟡"
          title="MEDIO"
          subtitle="Te pelea cada bola."
          color="#ffd95c"
          onClick={() => startBot("medium")}
        />
        <ModeCard
          glyph="🔴"
          title="DIFÍCIL"
          subtitle="Casi no falla. Suerte."
          color="#ff5c8a"
          onClick={() => startBot("hard")}
        />
        {error && (
          <p className="font-press glow-pink text-center text-[10px]">! {error}</p>
        )}
      </div>
    );
  }

  if (screen === "private") {
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <BackHeader onBack={() => setScreen("menu")} title="SALA PRIVADA" />
        <ModeCard
          glyph="🎮"
          title="CREAR SALA"
          subtitle="Generás un código y se lo pasás a un amigo."
          color="#5cffc8"
          onClick={createRoom}
        />
        <ModeCard
          glyph="🔑"
          title="UNIRSE CON CÓDIGO"
          subtitle="Entrá a una sala existente."
          color="#ff5c8a"
          onClick={() => setScreen("join")}
        />
        {error && (
          <p className="font-press glow-pink text-center text-[10px]">! {error}</p>
        )}
      </div>
    );
  }

  if (screen === "join") {
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <BackHeader onBack={() => setScreen("private")} title="UNIRSE" />
        <p className="font-press glow-cyan text-center text-xs">
          INGRESÁ EL CÓDIGO
        </p>
        <input
          autoFocus
          maxLength={6}
          className="input-arcade text-center"
          placeholder="XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") joinRoom();
          }}
        />
        {error && (
          <p className="font-press glow-pink text-center text-[10px]">! {error}</p>
        )}
        <button className="btn-mega" onClick={joinRoom}>
          ENTRAR
        </button>
      </div>
    );
  }

  // menu
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ModeCard
        glyph="⚡"
        title="PARTIDA RÁPIDA"
        subtitle="1v1 online contra un random."
        color="#ffd95c"
        hero
        onClick={startQuickMatch}
      />
      <ModeCard
        glyph="🤖"
        title="VS BOT"
        subtitle="Practicá en 3 dificultades."
        color="#5cff8a"
        onClick={() => setScreen("bot")}
      />
      <ModeCard
        glyph="🎮"
        title="SALA PRIVADA"
        subtitle="Crear o unirte con código."
        color="#5cffc8"
        onClick={() => setScreen("private")}
      />
      {error && (
        <p className="font-press glow-pink mt-1 text-center text-[10px]">
          ! {error}
        </p>
      )}
    </div>
  );
}

function BackHeader({
  onBack,
  title,
}: {
  onBack: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onBack}
        className="font-press flex items-center gap-1 text-[10px] tracking-widest text-white/55 transition hover:text-white"
        aria-label="Volver"
      >
        <span aria-hidden>←</span>
        VOLVER
      </button>
      <p className="font-press text-[10px] tracking-[0.3em] text-white/55">
        {title}
      </p>
      <span className="w-12" aria-hidden />
    </div>
  );
}
