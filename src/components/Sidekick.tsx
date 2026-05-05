"use client";

import { useEffect, useRef, useState } from "react";
import CharacterPreview from "@/components/CharacterPreview";
import {
  loadCharacter,
  otherCharacter,
} from "@/lib/character-storage";
import { nextTip } from "@/lib/lobby-tips";
import type { CharacterId } from "@/lib/game-types";

/**
 * Sidekick — a small character pinned to the lower-left of the lobby with a
 * speech bubble cycling through gameplay tips. Whoever is NOT the player's
 * selected hero plays this role (so the lobby always shows both characters).
 *
 * Auto-advances the tip every ~7 seconds; tap on the bubble to advance
 * manually.
 */
export default function Sidekick() {
  const [tip, setTip] = useState<string>("");
  const [hero, setHero] = useState<CharacterId | null>(null);
  const lastTipRef = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => setHero(loadCharacter());
    sync();
    window.addEventListener("naulpong:character-changed", sync);
    return () => window.removeEventListener("naulpong:character-changed", sync);
  }, []);

  useEffect(() => {
    const initial = nextTip(null);
    lastTipRef.current = initial;
    setTip(initial);
    const t = setInterval(() => {
      const n = nextTip(lastTipRef.current);
      lastTipRef.current = n;
      setTip(n);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  function advance() {
    const n = nextTip(lastTipRef.current);
    lastTipRef.current = n;
    setTip(n);
  }

  if (!hero) return null;
  const sidekick = otherCharacter(hero);

  return (
    <div className="sidekick">
      <button
        type="button"
        className="sidekick-bubble"
        onClick={advance}
        aria-label="Siguiente tip"
      >
        <span className="sidekick-bubble-text">{tip}</span>
      </button>
      <div className="sidekick-char" aria-hidden>
        <CharacterPreview id={sidekick} scale={3} glow="#ffffff" />
      </div>
    </div>
  );
}
