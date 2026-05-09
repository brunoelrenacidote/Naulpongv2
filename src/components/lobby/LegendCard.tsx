"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CharacterPreview from "@/components/CharacterPreview";
import {
  CHARACTER_ORDER,
  isCharacterUnlocked,
  loadCharacter,
  saveCharacter,
} from "@/lib/character-storage";
import type { CharacterId } from "@/lib/game-types";
import { loadUnlocked, UNLOCKED_EVENT } from "@/lib/unlocked-cache";
import { IconArrowLeft, IconArrowRight, IconLock, IconTicket } from "./icons";
import {
  IconBoltTactical,
  IconPaddle,
  IconShield,
  IconScope,
} from "./tactical-icons";
import { sfxLegendCycle, hapticTap } from "@/lib/sounds";

interface LegendData {
  codename: string;
  name: string;
  tagline: string;
  color: string;
  // Stats 0..100
  speed: number;
  control: number;
  power: number;
  defense: number;
  skill: { name: string; desc: string };
}

const LEGENDS: Record<CharacterId, LegendData> = {
  "hijo-fiesta": {
    codename: "[ Civil-Tac · 47 ]",
    name: "EL WEY",
    tagline: "Operador veterano. Llega tarde, pero llega.",
    color: "#00d4ff",
    speed: 70,
    control: 78,
    power: 60,
    defense: 82,
    skill: {
      name: "Reflejo paterno",
      desc: "Tu paleta resiste 1 golpe extra al activar Escudo.",
    },
  },
  clavel: {
    codename: "[ Float-Sniper · 13 ]",
    name: "EL CLAVEL",
    tagline: "Punzante. Frío. Mira directo a las venas.",
    color: "#ff5a1f",
    speed: 86,
    control: 70,
    power: 80,
    defense: 56,
    skill: {
      name: "Espinas frías",
      desc: "Turbo Ball gana +10% de velocidad inicial al activarse.",
    },
  },
  "morro-maincraftiano": {
    codename: "[ Block-Crit · 64 ]",
    name: "EL MORRO",
    tagline: "Speedrun any%. Saca diamantes y matchpoints.",
    color: "#7cd35c",
    speed: 78,
    control: 84,
    power: 70,
    defense: 64,
    skill: {
      name: "Crítico minero",
      desc: "1 de cada 6 golpes con Turbo Ball anota +1 punto extra.",
    },
  },
};

/**
 * Tarjeta de leyenda al estilo Apex. Tres columnas: stats laterales
 * izquierdos (panel táctico), portrait central con marco hexagonal y
 * raycos animados, panel de info derecho con codename, nombre con glitch
 * y la habilidad pasiva del personaje.
 *
 * En mobile portrait las tres columnas se apilan.
 */
export default function LegendCard() {
  const [id, setId] = useState<CharacterId>("hijo-fiesta");
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState<readonly string[]>([]);

  useEffect(() => {
    setId(loadCharacter());
    setUnlocked(loadUnlocked());
    setHydrated(true);
    const onChange = () => setUnlocked(loadUnlocked());
    window.addEventListener(UNLOCKED_EVENT, onChange);
    return () => window.removeEventListener(UNLOCKED_EVENT, onChange);
  }, []);

  const isLocked = useMemo(
    () => !isCharacterUnlocked(id, unlocked),
    [id, unlocked],
  );

  function cycle(dir: 1 | -1) {
    const all = CHARACTER_ORDER;
    const idx = all.indexOf(id);
    const next = all[(idx + dir + all.length) % all.length];
    setId(next);
    // Persistimos sólo si está desbloqueado: el lobby no quiere arrancar
    // mostrando un personaje lockeado.
    if (isCharacterUnlocked(next, unlocked)) {
      saveCharacter(next);
    }
    sfxLegendCycle();
    hapticTap();
  }

  const data = LEGENDS[id];
  const color = data.color;

  if (!hydrated) {
    return <div className="legend-card" aria-hidden style={{ ["--legend-color" as string]: color }} />;
  }

  return (
    <div
      className="legend-card"
      style={{ ["--legend-color" as string]: color }}
    >
      {/* Stats laterales (izquierda) */}
      <aside className="legend-stats-side" aria-label="Stats de leyenda">
        <span className="stat-eyebrow">[ FICHA OP ]</span>
        <StatRow Icon={IconPaddle} label="Velocidad" value={data.speed} />
        <StatRow Icon={IconScope} label="Control" value={data.control} />
        <StatRow Icon={IconBoltTactical} label="Poder" value={data.power} />
        <StatRow Icon={IconShield} label="Defensa" value={data.defense} />
      </aside>

      {/* Portrait central */}
      <div className="legend-portrait-wrap">
        <button
          type="button"
          className="legend-flip prev"
          onClick={() => cycle(-1)}
          aria-label="Leyenda anterior"
        >
          <IconArrowLeft size={18} />
        </button>

        <div
          className={`legend-portrait-frame${
            isLocked ? " is-locked" : ""
          }`}
        >
          <div className="legend-portrait-rays" aria-hidden />
          <div className="legend-portrait-tags" aria-hidden>
            <span className="tag">
              <span className="dot" /> {isLocked ? "LOCKED" : "READY"}
            </span>
            <span className="tag">SECTOR-7</span>
          </div>
          <div className="legend-portrait-glow" aria-hidden />
          <div className="legend-portrait-canvas">
            <CharacterPreview id={id} scale={9} glow={color} />
            {isLocked ? (
              <div className="legend-lock-overlay" aria-hidden>
                <span className="legend-lock-glyph">
                  <IconLock size={28} />
                </span>
                <span className="legend-lock-tag">BLOQUEADO</span>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="legend-flip next"
          onClick={() => cycle(1)}
          aria-label="Siguiente leyenda"
        >
          <IconArrowRight size={18} />
        </button>
      </div>

      {/* Info derecha */}
      <aside className="legend-info-side" aria-label="Info de leyenda">
        <span className="legend-codename">{data.codename}</span>
        <h2 className="legend-name glitch" data-text={data.name}>
          {data.name}
        </h2>
        <p className="legend-tagline">{data.tagline}</p>

        <div className="legend-skill" aria-label="Habilidad pasiva">
          <span className="sk-glyph" aria-hidden>
            <IconBoltTactical size={14} />
          </span>
          <span className="sk-text">
            <span className="sk-name">{data.skill.name}</span>
            <span className="sk-desc">{data.skill.desc}</span>
          </span>
        </div>

        {isLocked ? (
          <Link
            href="/luck-royale"
            className="legend-unlock-cta"
            aria-label="Ir al Luck Royale para desbloquear"
          >
            <IconTicket size={14} /> DESBLOQUEAR EN LUCK ROYALE
          </Link>
        ) : null}
      </aside>
    </div>
  );
}

function StatRow({
  Icon,
  label,
  value,
}: {
  Icon?: (p: { size?: number }) => JSX.Element;
  label: string;
  value: number;
}) {
  return (
    <div className="stat-row">
      <span className="stat-head">
        <span className="label">
          {Icon && (
            <span className="stat-icon" aria-hidden>
              <Icon size={10} />
            </span>
          )}
          {label}
        </span>
        <span className="value">{value}</span>
      </span>
      <span className="stat-bar" aria-hidden>
        <span
          className="stat-bar-fill"
          style={{ ["--stat-pct" as string]: `${value}%` }}
        />
      </span>
    </div>
  );
}

// Re-export tactical icons used elsewhere in the lobby (re-shaped exports
// para mantener un único import path en ApexLobbyShell).
export const _statIcons = { IconScope, IconShield, IconPaddle };
