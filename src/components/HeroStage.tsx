"use client";

import { useEffect, useState } from "react";
import CharacterPreview from "@/components/CharacterPreview";
import {
  characterMeta,
  loadCharacter,
  nextCharacter,
  saveCharacter,
} from "@/lib/character-storage";
import type { CharacterId } from "@/lib/game-types";

/**
 * Lobby hero — big animated character on a pixel platform with side arrows
 * to swap which character the player wants to "represent".
 *
 * The platform is pure CSS (radial glow + scanlines). The character itself is
 * drawn by CharacterPreview, scaled up so it reads as the centerpiece of the
 * home screen.
 */
export default function HeroStage() {
  const [char, setChar] = useState<CharacterId | null>(null);

  useEffect(() => {
    setChar(loadCharacter());
    const sync = () => setChar(loadCharacter());
    window.addEventListener("naulpong:character-changed", sync);
    return () => window.removeEventListener("naulpong:character-changed", sync);
  }, []);

  function swap(dir: 1 | -1) {
    setChar((curr) => {
      const c = curr ?? loadCharacter();
      const n = nextCharacter(c, dir);
      saveCharacter(n);
      return n;
    });
  }

  if (!char) {
    return <div className="hero-stage" aria-hidden />;
  }

  const meta = characterMeta(char);

  return (
    <div className="hero-stage">
      <button
        type="button"
        className="char-arrow left"
        onClick={() => swap(-1)}
        aria-label="Personaje anterior"
      >
        ‹
      </button>

      <div
        className="hero-stage-inner"
        style={{ ["--hero-color" as string]: meta.color }}
      >
        <div className="hero-platform" aria-hidden />
        <div className="hero-character">
          <CharacterPreview id={char} scale={6} glow={meta.color} />
        </div>
      </div>

      <button
        type="button"
        className="char-arrow right"
        onClick={() => swap(1)}
        aria-label="Personaje siguiente"
      >
        ›
      </button>

      <p
        className="hero-name"
        style={{ ["--hero-color" as string]: meta.color }}
      >
        {meta.name}
      </p>
    </div>
  );
}
