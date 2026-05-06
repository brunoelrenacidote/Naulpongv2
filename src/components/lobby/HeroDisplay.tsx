"use client";

import { useEffect, useState } from "react";
import CharacterPreview from "@/components/CharacterPreview";
import {
  loadCharacter,
  saveCharacter,
} from "@/lib/character-storage";
import type { CharacterId } from "@/lib/game-types";
import { IconArrowLeft, IconArrowRight } from "./icons";

const ALL: CharacterId[] = ["hijo-fiesta", "clavel"];

const NAME: Record<CharacterId, string> = {
  "hijo-fiesta": "EL WEY",
  clavel: "EL CLAVEL",
};

const TAGLINE: Record<CharacterId, string> = {
  "hijo-fiesta": "Va por su hijo a las fiestas",
  clavel: "Más punzante que tierno",
};

const COLOR: Record<CharacterId, string> = {
  "hijo-fiesta": "#00e5ff",
  clavel: "#ff2e93",
};

/**
 * Personaje grande del centro del lobby. Sin caja, sin recuadro: el podio
 * es una elipse luminosa al estilo Brawl Stars / Free Fire. Flechas chips
 * arriba y abajo para cambiar de personaje sin invadir el slot del logo.
 */
export default function HeroDisplay() {
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
  }

  if (!hydrated) {
    return <div className="hero-display placeholder" aria-hidden />;
  }

  const color = COLOR[id];

  return (
    <div
      className="hero-display"
      style={{ ["--hero-color" as string]: color }}
    >
      <div className="hero-podium" aria-hidden>
        <div className="hero-podium-glow" />
        <div className="hero-podium-disc" />
        <div className="hero-podium-rays" />
      </div>

      <div className="hero-stage-row">
        <button
          type="button"
          className="hero-flip prev"
          onClick={() => cycle(-1)}
          aria-label="Personaje anterior"
        >
          <IconArrowLeft size={20} />
        </button>

        <div className="hero-character-wrap">
          <CharacterPreview id={id} scale={9} glow={color} />
        </div>

        <button
          type="button"
          className="hero-flip next"
          onClick={() => cycle(1)}
          aria-label="Personaje siguiente"
        >
          <IconArrowRight size={20} />
        </button>
      </div>

      <div className="hero-nameplate">
        <p className="hero-name-big">{NAME[id]}</p>
        <p className="hero-name-sub">{TAGLINE[id]}</p>
      </div>
    </div>
  );
}
