"use client";

import { useEffect, useState } from "react";
import CharacterPreview from "@/components/CharacterPreview";
import { loadCharacter, saveCharacter } from "@/lib/character-storage";
import type { CharacterId } from "@/lib/game-types";
import { IconArrowLeft, IconArrowRight } from "./icons";
import {
  IconBoltTactical,
  IconPaddle,
  IconShield,
  IconScope,
} from "./tactical-icons";
import { sfxLegendCycle, hapticTap } from "@/lib/sounds";

const ALL: CharacterId[] = ["hijo-fiesta", "clavel"];

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

  useEffect(() => {
    setId(loadCharacter());
    setHydrated(true);
  }, []);

  function cycle(dir: 1 | -1) {
    const idx = ALL.indexOf(id);
    const next = ALL[(idx + dir + ALL.length) % ALL.length];
    setId(next);
    saveCharacter(next);
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

        <div className="legend-portrait-frame">
          <div className="legend-portrait-rays" aria-hidden />
          <div className="legend-portrait-tags" aria-hidden>
            <span className="tag">
              <span className="dot" /> READY
            </span>
            <span className="tag">SECTOR-7</span>
          </div>
          <div className="legend-portrait-glow" aria-hidden />
          <div className="legend-portrait-canvas">
            <CharacterPreview id={id} scale={9} glow={color} />
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
