"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PartySocket from "partysocket";
import EventsRail from "./EventsRail";
import HeroDisplay from "./HeroDisplay";
import ModesPill, { type ModeDef, type ModeId, MODES } from "./ModesPill";
import NavBubbles from "./NavBubbles";
import NickPrompt from "./NickPrompt";
import PlayCTA from "./PlayCTA";
import ProfileChip from "./ProfileChip";
import TopRightControls from "./TopRightControls";
import type { LobbyServerMessage } from "@/lib/game-types";
import { partyHost } from "@/lib/party-host";
import { IconArrowLeft, IconBolt, IconBot, IconClose, IconKey, IconUsers } from "./icons";

const NICK_KEY = "naulpong:nick";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

type Sub = "menu" | "queue" | "bot" | "private" | "join";

/**
 * Shell del lobby NauLPong v5 (UdderGames). UNA sola pantalla horizontal
 * con todos los controles fijados en las esquinas. Sin splash, sin entry
 * gate: si no hay nick guardado mostramos un mini-modal sobre el lobby.
 *
 * Layout (CSS .lobby-grid):
 *
 *   ┌──────────────┬──────────────┬──────────────┐
 *   │ ProfileChip  │  ModesPill   │ TopRight   │  ← row 1
 *   ├──────────────┴──────────────┴──────────────┤
 *   │ EventsRail   │     HeroDisplay     │     │  ← row 2 (filler)
 *   ├──────────────┬─────────────┬──────────────┤
 *   │ NavBubbles   │             │   PlayCTA    │  ← row 3
 *   └──────────────┴─────────────┴──────────────┘
 */
export default function LobbyShell() {
  const router = useRouter();
  const [nick, setNick] = useState<string>("");
  const [needNick, setNeedNick] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);
  const [modeId, setModeId] = useState<ModeId>("quick");
  const [sub, setSub] = useState<Sub>("menu");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<{ position: number; total: number }>({
    position: 0,
    total: 0,
  });
  const [elapsed, setElapsed] = useState(0);
  const lobbyRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    setHydrated(true);
    const stored = (
      typeof window !== "undefined"
        ? window.localStorage.getItem(NICK_KEY) ?? ""
        : ""
    ).trim();
    if (stored) {
      setNick(stored.toUpperCase());
      setNeedNick(false);
    } else {
      setNeedNick(true);
    }
  }, []);

  useEffect(() => {
    if (sub !== "queue") return;
    const start = Date.now();
    const t = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 250);
    return () => window.clearInterval(t);
  }, [sub]);

  function ensure(): boolean {
    const n = (nick || "").trim();
    if (!n) {
      setNeedNick(true);
      return false;
    }
    return true;
  }

  function startQuickMatch() {
    setError(null);
    if (!ensure()) return;
    setSub("queue");
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
      setError("No pudimos conectar al matchmaking. Probá de nuevo.");
    });
  }

  function cancelQueue() {
    lobbyRef.current?.close();
    lobbyRef.current = null;
    setSub("menu");
  }

  function startBot(diff: "easy" | "medium" | "hard") {
    setError(null);
    if (!ensure()) return;
    const c = generateCode();
    router.push(`/play/${c}?host=1&bot=1&diff=${diff}`);
  }

  function createRoom() {
    setError(null);
    if (!ensure()) return;
    const c = generateCode();
    router.push(`/play/${c}?host=1`);
  }

  function joinRoom() {
    setError(null);
    if (!ensure()) return;
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      setError("Código inválido");
      return;
    }
    router.push(`/play/${c}`);
  }

  function play() {
    setError(null);
    if (!ensure()) return;
    if (modeId === "quick") return startQuickMatch();
    if (modeId === "bot") return setSub("bot");
    if (modeId === "private") return setSub("private");
  }

  const activeMode: ModeDef = MODES.find((m) => m.id === modeId) ?? MODES[0];

  return (
    <main className="lobby-shell" aria-label="Lobby">
      <div className="lobby-bg-stage" aria-hidden>
        <div className="lobby-sky" />
        <div className="lobby-mountains" />
        <div className="lobby-floor" />
        <div className="lobby-rays" />
        <div className="lobby-particles">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`lobby-particle p${i}`} />
          ))}
        </div>
      </div>

      <div className="lobby-grid">
        <div className="slot-tl">
          <ProfileChip nick={hydrated ? nick : ""} />
        </div>
        <div className="slot-tc">
          <ModesPill modeId={modeId} onChange={setModeId} />
        </div>
        <div className="slot-tr">
          <TopRightControls />
        </div>

        <div className="slot-ml">
          <EventsRail />
        </div>

        <div className="slot-center">
          <HeroDisplay />
        </div>

        <div className="slot-bl">
          <NavBubbles />
        </div>
        <div className="slot-br">
          <PlayCTA mode={activeMode} onClick={play} disabled={!hydrated} />
        </div>
      </div>

      {error && (
        <p className="lobby-error" role="alert">
          {error}
        </p>
      )}

      {hydrated && needNick && (
        <NickPrompt
          onSubmit={(n) => {
            setNick(n);
            setNeedNick(false);
          }}
        />
      )}

      {sub === "queue" && (
        <SubOverlay title="BUSCANDO RIVAL" onClose={cancelQueue}>
          <p className="sub-elapsed">
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </p>
          <p className="sub-pos">
            POSICIÓN {queueState.position} / {queueState.total}
          </p>
          <p className="sub-line">JUGADOR · {nick}</p>
          <button className="sub-btn cancel" onClick={cancelQueue}>
            CANCELAR
          </button>
        </SubOverlay>
      )}

      {sub === "bot" && (
        <SubOverlay title="VS BOT" onClose={() => setSub("menu")}>
          <DiffCard color="#22c55e" title="FÁCIL" sub="Tranqui, calentamiento" Icon={IconBot} onClick={() => startBot("easy")} />
          <DiffCard color="#facc15" title="MEDIO" sub="Te pelea cada bola" Icon={IconBolt} onClick={() => startBot("medium")} />
          <DiffCard color="#ef4444" title="DIFÍCIL" sub="Casi no falla. Suerte." Icon={IconBot} onClick={() => startBot("hard")} />
        </SubOverlay>
      )}

      {sub === "private" && (
        <SubOverlay title="SALA PRIVADA" onClose={() => setSub("menu")}>
          <DiffCard color="#a78bfa" title="CREAR SALA" sub="Generás un código y se lo pasás a un amigo" Icon={IconUsers} onClick={createRoom} />
          <DiffCard color="#22d3ee" title="UNIRSE CON CÓDIGO" sub="Entrá a una sala existente" Icon={IconKey} onClick={() => setSub("join")} />
        </SubOverlay>
      )}

      {sub === "join" && (
        <SubOverlay title="UNIRSE CON CÓDIGO" onClose={() => setSub("private")}>
          <input
            autoFocus
            maxLength={6}
            className="sub-input"
            placeholder="XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") joinRoom();
            }}
            aria-label="Código de sala"
          />
          {error && <p className="sub-error">{error}</p>}
          <button className="sub-btn go" onClick={joinRoom}>
            <IconKey size={18} /> ENTRAR
          </button>
        </SubOverlay>
      )}
    </main>
  );
}

function SubOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sub-overlay" role="dialog" aria-modal="true">
      <div className="sub-card">
        <div className="sub-head">
          <button className="sub-back" onClick={onClose} aria-label="Volver">
            <IconArrowLeft size={18} />
          </button>
          <p className="sub-title">{title}</p>
          <button className="sub-back close" onClick={onClose} aria-label="Cerrar">
            <IconClose size={18} />
          </button>
        </div>
        <div className="sub-body">{children}</div>
      </div>
    </div>
  );
}

function DiffCard({
  color,
  title,
  sub,
  Icon,
  onClick,
}: {
  color: string;
  title: string;
  sub: string;
  Icon: (p: { size?: number }) => JSX.Element;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="diff-card"
      onClick={onClick}
      style={{ ["--dc-color" as string]: color }}
    >
      <span className="dc-icon" aria-hidden>
        <Icon size={26} />
      </span>
      <span className="dc-text">
        <span className="dc-title">{title}</span>
        <span className="dc-sub">{sub}</span>
      </span>
    </button>
  );
}
