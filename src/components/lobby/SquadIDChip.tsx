"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadStats, type Stats } from "@/lib/stats";
import { IconBolt, IconTrophy } from "./icons";
import { IconSkull } from "./tactical-icons";

interface Props {
  nick: string;
}

/**
 * Identificación del jugador estilo Apex/Warzone (top-left). Una placa
 * táctica con tier hexagonal a la izquierda y nick + 3 stats clave
 * (kills/wins/power-ups). Linkea al perfil al tocar.
 */
export default function SquadIDChip({ nick }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(loadStats());
    const refresh = () => setStats(loadStats());
    window.addEventListener("naulpong:stats-changed", refresh);
    return () => window.removeEventListener("naulpong:stats-changed", refresh);
  }, []);

  const display = nick || "OPERADOR";
  const wins = stats?.wins ?? 0;
  const powers = stats?.powerUpsTaken ?? 0;
  const kos = stats?.goalsFor ?? 0;
  // tier es derivado de wins (por ahora; con visual aspiracional)
  const tierNum = wins >= 50 ? 5 : wins >= 25 ? 4 : wins >= 10 ? 3 : wins >= 3 ? 2 : 1;

  return (
    <Link
      href="/perfil"
      className="squad-chip"
      aria-label={`Perfil de ${display}`}
    >
      <span className="sq-tier" aria-hidden>
        <span className="sq-tier-num">{tierNum}</span>
      </span>
      <span className="sq-info">
        <span className="sq-eyebrow">[ Operador 01 ]</span>
        <span className="sq-nick">{display}</span>
        <span className="sq-stats">
          <span className="sq-stat" aria-label={`${kos} K.O.`}>
            <IconSkull size={11} />
            {kos}
          </span>
          <span className="sq-stat cyan" aria-label={`${powers} poderes`}>
            <IconBolt size={11} />
            {powers}
          </span>
          <span className="sq-stat gold" aria-label={`${wins} victorias`}>
            <IconTrophy size={11} />
            {wins}
          </span>
        </span>
      </span>
    </Link>
  );
}
