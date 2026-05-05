"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadStats, loadUnlocked } from "@/lib/stats";
import CharacterPreview from "@/components/CharacterPreview";
import { loadCharacter } from "@/lib/character-storage";
import type { CharacterId } from "@/lib/game-types";

/**
 * Lobby top bar — Brawl-style header with profile chip + currency + trophies.
 *
 * Currency is a proxy: we re-use `powerUpsTaken` as "PODERES" coins so that
 * the player has something visibly growing without inventing a new economy.
 */
export default function TopBar({ nick }: { nick: string }) {
  const [coins, setCoins] = useState(0);
  const [trophies, setTrophies] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [char, setChar] = useState<CharacterId>("hijo-fiesta");

  useEffect(() => {
    const refresh = () => {
      const s = loadStats();
      const u = loadUnlocked();
      setCoins(s.powerUpsTaken);
      setTrophies(u.size);
      setChar(loadCharacter());
    };
    refresh();
    setHydrated(true);
    window.addEventListener("naulpong:character-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("naulpong:character-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const display = (nick || "JUGADOR").toUpperCase();

  return (
    <div className="top-bar">
      <Link href="/perfil" className="top-bar-chip" aria-label="Ir al perfil">
        <span className="top-bar-avatar" aria-hidden>
          {hydrated ? (
            <CharacterPreview id={char} scale={2} glow="#5cffc8" />
          ) : null}
        </span>
        <span className="top-bar-nick">{display}</span>
      </Link>

      <div className="top-bar-stats">
        <div className="top-bar-stat" aria-label={`Poderes acumulados: ${coins}`}>
          <span className="tbs-icon" aria-hidden>⚡</span>
          <span className="tbs-num">{hydrated ? coins : 0}</span>
        </div>
        <div className="top-bar-stat" aria-label={`Trofeos: ${trophies}`}>
          <span className="tbs-icon" aria-hidden>🏆</span>
          <span className="tbs-num">{hydrated ? trophies : 0}</span>
        </div>
      </div>
    </div>
  );
}
