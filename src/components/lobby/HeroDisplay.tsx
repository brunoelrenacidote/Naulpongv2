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
import { IconArrowLeft, IconArrowRight } from "./icons";

const NAME: Record<CharacterId, string> = {
  "hijo-fiesta": "EL WEY",
  clavel: "EL CLAVEL",
  "morro-maincraftiano": "EL MORRO",
};

const TAGLINE: Record<CharacterId, string> = {
  "hijo-fiesta": "Va por su hijo a las fiestas",
  clavel: "Más punzante que tierno",
  "morro-maincraftiano": "Saca diamantes y matchpoints",
};

const COLOR: Record<CharacterId, string> = {
  "hijo-fiesta": "#00e5ff",
  clavel: "#ff2e93",
  "morro-maincraftiano": "#7cd35c",
};

/**
 * Personaje grande del centro del lobby. Sin caja, sin recuadro: el podio
 * es una elipse luminosa al estilo Brawl Stars / Free Fire. Flechas chips
 * arriba y abajo para cambiar de personaje sin invadir el slot del logo.
 *
 * El cycle pasa por TODOS los personajes (incluyendo los lockeados como
 * Morro Maincraftiano), y los que no están desbloqueados muestran un
 * overlay con candado y CTA hacia /luck-royale.
 */
export default function HeroDisplay() {
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
    // Solo persistimos en localStorage si está desbloqueado para que la
    // próxima carga del lobby no quede mostrando un personaje lockeado.
    if (isCharacterUnlocked(next, unlocked)) {
      saveCharacter(next);
    }
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

        <div
          className={`hero-character-wrap${isLocked ? " is-locked" : ""}`}
        >
          <CharacterPreview id={id} scale={9} glow={color} />
          {isLocked ? (
            <div className="hero-lock-overlay" aria-hidden>
              <span className="hero-lock-glyph">🔒</span>
              <span className="hero-lock-tag">BLOQUEADO</span>
            </div>
          ) : null}
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
        {isLocked ? (
          <Link
            href="/luck-royale"
            className="hero-unlock-cta"
            aria-label="Ir al Luck Royale para desbloquear"
          >
            🎟 DESBLOQUEAR EN LUCK ROYALE
          </Link>
        ) : null}
      </div>
    </div>
  );
}
