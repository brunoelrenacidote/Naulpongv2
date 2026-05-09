"use client";

import { sfxModeSwitch, hapticTap } from "@/lib/sounds";
import {
  IconLockedRoom,
  IconQuickMatch,
  IconSquad,
} from "./tactical-icons";

export type ModeId = "quick" | "bot" | "private";

export interface ModeDef {
  id: ModeId;
  title: string;
  subtitle: string;
  tag: string;
  color: string;
  Icon: (p: { size?: number }) => JSX.Element;
}

export const MODES: readonly ModeDef[] = [
  {
    id: "quick",
    tag: "S1 · Trios",
    title: "DEPLOY RÁPIDO",
    subtitle: "Matchmaking 1v1 online",
    color: "#ff5a1f",
    Icon: IconQuickMatch,
  },
  {
    id: "bot",
    tag: "Solo · Tac-Sim",
    title: "VS BOT",
    subtitle: "Entrenamiento offline",
    color: "#00d4ff",
    Icon: IconSquad,
  },
  {
    id: "private",
    tag: "LAN · Privada",
    title: "SALA PRIVADA",
    subtitle: "Crea o únete con código",
    color: "#f7c948",
    Icon: IconLockedRoom,
  },
];

interface Props {
  modeId: ModeId;
  onChange: (id: ModeId) => void;
}

/**
 * Panel inferior izquierdo con 3 modos como pestañas tácticas. La
 * pestaña activa cambia de color y tiene un glow + notch superior. SFX
 * y vibración al cambiar.
 */
export default function SquadModePanel({ modeId, onChange }: Props) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="Modos de juego">
      {MODES.map((m) => {
        const Icon = m.Icon;
        const active = m.id === modeId;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`mode-tab ${active ? "active" : ""}`}
            style={{ ["--m-color" as string]: m.color }}
            onClick={() => {
              if (active) return;
              onChange(m.id);
              sfxModeSwitch();
              hapticTap();
            }}
          >
            <span className="mt-tag">{m.tag}</span>
            <span className="mt-title">{m.title}</span>
            <span className="mt-sub">{m.subtitle}</span>
            <span className="mt-icon" aria-hidden>
              <Icon size={20} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
