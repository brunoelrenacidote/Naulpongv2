"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconBolt,
  IconBot,
  IconChevronDown,
  IconKey,
  IconUsers,
} from "./icons";

export type ModeId = "quick" | "bot" | "private";

export interface ModeDef {
  id: ModeId;
  title: string;
  subtitle: string;
  color: string;
  Icon: (p: { size?: number }) => JSX.Element;
}

export const MODES: readonly ModeDef[] = [
  {
    id: "quick",
    title: "PARTIDA RÁPIDA",
    subtitle: "1v1 online · matchmaking",
    color: "#ff6a1a",
    Icon: IconBolt,
  },
  {
    id: "bot",
    title: "VS BOT",
    subtitle: "3 dificultades · offline",
    color: "#00e5ff",
    Icon: IconBot,
  },
  {
    id: "private",
    title: "SALA PRIVADA",
    subtitle: "Jugá con un amigo",
    color: "#ff2e93",
    Icon: IconUsers,
  },
];

interface Props {
  modeId: ModeId;
  onChange: (id: ModeId) => void;
}

/**
 * Pill central arriba: muestra el modo activo y al tocar despliega un menú
 * con los otros modos. Tipo selector de modo de Brawl Stars / Free Fire.
 */
export default function ModesPill({ modeId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrap.current) return;
      if (!wrap.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = MODES.find((m) => m.id === modeId) ?? MODES[0];
  const ActiveIcon = active.Icon;

  return (
    <div className="modes-pill-wrap" ref={wrap}>
      <button
        type="button"
        className={`modes-pill ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{ ["--mode-color" as string]: active.color }}
      >
        <span className="mp-icon" aria-hidden>
          <ActiveIcon size={22} />
        </span>
        <span className="mp-text">
          <span className="mp-eyebrow">MODO</span>
          <span className="mp-title">{active.title}</span>
        </span>
        <span className={`mp-chev ${open ? "flip" : ""}`} aria-hidden>
          <IconChevronDown size={20} />
        </span>
      </button>

      {open && (
        <div
          className="modes-menu"
          role="listbox"
          aria-label="Elegir modo de juego"
        >
          {MODES.map((m) => {
            const Icon = m.Icon;
            const isActive = m.id === modeId;
            return (
              <button
                key={m.id}
                type="button"
                className={`mode-item ${isActive ? "active" : ""}`}
                role="option"
                aria-selected={isActive}
                style={{ ["--mode-color" as string]: m.color }}
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
              >
                <span className="mi-icon" aria-hidden>
                  <Icon size={20} />
                </span>
                <span className="mi-text">
                  <span className="mi-title">{m.title}</span>
                  <span className="mi-sub">{m.subtitle}</span>
                </span>
                {isActive && (
                  <span className="mi-badge" aria-hidden>
                    <IconKey size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
