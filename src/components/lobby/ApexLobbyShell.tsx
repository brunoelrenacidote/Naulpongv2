"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PartySocket from "partysocket";

import ApexNickPrompt from "./ApexNickPrompt";
import BattlePassBar from "./BattlePassBar";
import DeployButton from "./DeployButton";
import HUDControls from "./HUDControls";
import KillFeedTicker from "./KillFeedTicker";
import LegendCard from "./LegendCard";
import NewsPanel from "./NewsPanel";
import SideRail from "./SideRail";
import SquadIDChip from "./SquadIDChip";
import SquadModePanel, { MODES, type ModeDef, type ModeId } from "./SquadModePanel";
import TacticalBackdrop from "./TacticalBackdrop";

import { partyHost } from "@/lib/party-host";
import type { LobbyServerMessage } from "@/lib/game-types";
import { sfxUiBack, sfxUiClick, hapticTap } from "@/lib/sounds";
import {
  IconArrowLeft,
  IconBolt,
  IconBot,
  IconClose,
  IconKey,
  IconUsers,
} from "./icons";
import { IconRadar } from "./tactical-icons";

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
 * NauLPong Lobby v7 — "Apex Edge".
 *
 * Layout (mobile-first landscape):
 *
 *   ┌─────────────┬──────────────────┬────────────┐
 *   │ SquadIDChip │ BattlePassBar    │ HUDControls│   TOP
 *   ├──────┬───────────────────────────┬─────────┤
 *   │ Side │       LegendCard          │ News    │   STAGE
 *   │ Rail │  (stats · portrait · info)│ Panel   │
 *   ├──────┴────────────────┬──────────┴─────────┤
 *   │     ModeTabs (3)      │       DeployCTA    │   BOTTOM
 *   └────────────────────────────────────────────┘
 *   [ feed-ticker ]                                    pegado al pie
 *
 * Sustituye al LobbyShell antiguo por completo. Compatible con la API
 * existente — la página /play se sigue resolviendo con un código de
 * sala y la lógica de matchmaking sigue contra el mismo Worker.
 */
export default function ApexLobbyShell() {
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
    sfxUiBack();
    hapticTap();
    lobbyRef.current?.close();
    lobbyRef.current = null;
    setSub("menu");
  }

  function startBot(diff: "easy" | "medium" | "hard") {
    setError(null);
    if (!ensure()) return;
    sfxUiClick();
    hapticTap();
    const c = generateCode();
    router.push(`/play/${c}?host=1&bot=1&diff=${diff}`);
  }

  function createRoom() {
    setError(null);
    if (!ensure()) return;
    sfxUiClick();
    hapticTap();
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
    sfxUiClick();
    hapticTap();
    router.push(`/play/${c}`);
  }

  function deploy() {
    setError(null);
    if (!ensure()) return;
    if (modeId === "quick") return startQuickMatch();
    if (modeId === "bot") return setSub("bot");
    if (modeId === "private") return setSub("private");
  }

  const activeMode: ModeDef = MODES.find((m) => m.id === modeId) ?? MODES[0];

  return (
    <main className="apex-shell" aria-label="Lobby NauLPong">
      <TacticalBackdrop />

      <div className="apex-grid">
        {/* === TOP === */}
        <header className="apex-top">
          <div className="apex-top-left">
            <SquadIDChip nick={hydrated ? nick : ""} />
          </div>
          <div className="apex-top-center">
            <BattlePassBar />
          </div>
          <div className="apex-top-right">
            <HUDControls />
          </div>
        </header>

        {/* === STAGE === */}
        <section className="apex-stage">
          <div className="apex-rail">
            <SideRail />
          </div>
          <div className="apex-stage-center">
            <LegendCard />
          </div>
          <div className="apex-news">
            <NewsPanel />
          </div>
        </section>

        {/* === BOTTOM === */}
        <footer className="apex-bottom">
          <div className="apex-bottom-modes">
            <SquadModePanel modeId={modeId} onChange={setModeId} />
          </div>
          <DeployButton mode={activeMode} onClick={deploy} disabled={!hydrated} />
        </footer>
      </div>

      <KillFeedTicker />

      {error && (
        <p
          className="apex-error"
          role="alert"
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 65,
            maxWidth: "80vw",
          }}
        >
          {error}
        </p>
      )}

      {hydrated && needNick && (
        <ApexNickPrompt
          onSubmit={(n) => {
            setNick(n);
            setNeedNick(false);
          }}
        />
      )}

      {sub === "queue" && (
        <ApexOverlay title="BUSCANDO RIVAL · DEPLOY" onClose={cancelQueue}>
          <div className="queue-radar" aria-hidden />
          <p className="queue-clock">
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </p>
          <p className="queue-line">
            <IconRadar size={11} /> RASTREANDO · POSICIÓN {queueState.position} / {queueState.total}
          </p>
          <p className="queue-pos">OPERADOR · {nick}</p>
          <button className="apex-btn cancel" onClick={cancelQueue}>
            ABORTAR DEPLOY
          </button>
        </ApexOverlay>
      )}

      {sub === "bot" && (
        <ApexOverlay title="VS BOT · TAC-SIM" onClose={() => { sfxUiBack(); setSub("menu"); }}>
          <DiffCard
            color="var(--apex-green)"
            tag="Recluta"
            title="FÁCIL"
            sub="Calentamiento controlado · IA pasiva"
            Icon={IconBot}
            onClick={() => startBot("easy")}
          />
          <DiffCard
            color="var(--apex-orange)"
            tag="Veterano"
            title="MEDIO"
            sub="Pelea cada bola · IA estándar"
            Icon={IconBolt}
            onClick={() => startBot("medium")}
          />
          <DiffCard
            color="var(--apex-red)"
            tag="Predator"
            title="DIFÍCIL"
            sub="Casi no falla · IA agresiva"
            Icon={IconBot}
            onClick={() => startBot("hard")}
          />
        </ApexOverlay>
      )}

      {sub === "private" && (
        <ApexOverlay title="SALA PRIVADA · LAN" onClose={() => { sfxUiBack(); setSub("menu"); }}>
          <DiffCard
            color="var(--apex-orange)"
            tag="Crear"
            title="CREAR ESCUADRÓN"
            sub="Generamos un código · pasalo a tu rival"
            Icon={IconUsers}
            onClick={createRoom}
          />
          <DiffCard
            color="var(--apex-cyan)"
            tag="Unirse"
            title="UNIRSE CON CÓDIGO"
            sub="Entrá a una sala existente"
            Icon={IconKey}
            onClick={() => { sfxUiClick(); setSub("join"); }}
          />
        </ApexOverlay>
      )}

      {sub === "join" && (
        <ApexOverlay
          title="UNIRSE CON CÓDIGO"
          onClose={() => { sfxUiBack(); setSub("private"); }}
        >
          <input
            autoFocus
            maxLength={6}
            className="apex-input"
            placeholder="XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") joinRoom();
            }}
            aria-label="Código de sala"
          />
          {error && <p className="apex-error">{error}</p>}
          <button className="apex-btn go" onClick={joinRoom}>
            ▶ ENTRAR
          </button>
        </ApexOverlay>
      )}
    </main>
  );
}

/** Overlay genérico para los sub-flujos (queue, bot, private, join). */
function ApexOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="apex-overlay" role="dialog" aria-modal="true">
      <div className="apex-overlay-card">
        <div className="apex-overlay-head">
          <button
            type="button"
            className="apex-overlay-icon-btn"
            onClick={onClose}
            aria-label="Volver"
          >
            <IconArrowLeft size={16} />
          </button>
          <p className="apex-overlay-title">{title}</p>
          <button
            type="button"
            className="apex-overlay-icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <IconClose size={16} />
          </button>
        </div>
        <div className="apex-overlay-body">{children}</div>
      </div>
    </div>
  );
}

function DiffCard({
  color,
  tag,
  title,
  sub,
  Icon,
  onClick,
}: {
  color: string;
  tag: string;
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
        <Icon size={20} />
      </span>
      <span className="dc-text">
        <span
          style={{
            fontFamily: "var(--apex-mono)",
            fontSize: 7,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--apex-ink-mute)",
          }}
        >
          [ {tag} ]
        </span>
        <span className="dc-title">{title}</span>
        <span className="dc-sub">{sub}</span>
      </span>
    </button>
  );
}
