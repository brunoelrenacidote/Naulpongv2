"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadStats } from "@/lib/stats";
import { IconBolt, IconTrophy, IconUser } from "./icons";

interface Props {
  nick: string;
}

/**
 * Chip de perfil arriba a la izquierda — avatar circular + nick + dos
 * cápsulas de stats (poderes/⚡ y trofeos/🏆). Linkea a /perfil.
 *
 * Estilo bubble: gradient suave, borde chunky, sombra dura, sin neón.
 */
export default function ProfileChip({ nick }: Props) {
  const [trophies, setTrophies] = useState(0);
  const [powers, setPowers] = useState(0);

  useEffect(() => {
    function refresh() {
      const s = loadStats();
      setTrophies(s.wins);
      setPowers(s.powerUpsTaken);
    }
    refresh();
    const onStats = () => refresh();
    window.addEventListener("naulpong:stats-changed", onStats);
    return () => window.removeEventListener("naulpong:stats-changed", onStats);
  }, []);

  const display = nick || "JUGADOR";

  return (
    <Link
      href="/perfil"
      className="profile-chip"
      aria-label={`Perfil de ${display}`}
    >
      <span className="profile-avatar" aria-hidden>
        <IconUser size={22} />
      </span>
      <span className="profile-info">
        <span className="profile-nick">{display}</span>
        <span className="profile-stats">
          <span className="profile-stat" aria-label={`${powers} poderes`}>
            <IconBolt size={13} />
            {powers}
          </span>
          <span className="profile-stat" aria-label={`${trophies} trofeos`}>
            <IconTrophy size={13} />
            {trophies}
          </span>
        </span>
      </span>
    </Link>
  );
}
