"use client";

import Link from "next/link";
import { IconGem, IconNews, IconTarget } from "./icons";
import { sfxUiClick, hapticTap } from "@/lib/sounds";

interface RailItem {
  Icon: (p: { size?: number }) => JSX.Element;
  label: string;
  href: string;
  color: string;
  ariaLabel: string;
}

/**
 * Barra lateral izquierda con accesos secundarios reales del juego.
 * Solo links a pantallas que existen — sin botones placeholder.
 */
const ITEMS: readonly RailItem[] = [
  {
    Icon: IconNews,
    label: "INTEL",
    href: "/about",
    color: "var(--apex-orange)",
    ariaLabel: "Intel · cómo se juega",
  },
  {
    Icon: IconTarget,
    label: "PERFIL",
    href: "/perfil",
    color: "var(--apex-cyan)",
    ariaLabel: "Perfil del operador",
  },
  {
    Icon: IconGem,
    label: "LUCK",
    href: "/luck-royale",
    color: "var(--apex-gold, #f7c948)",
    ariaLabel: "Luck Royale · gacha de items",
  },
];

export default function SideRail() {
  function tap() {
    sfxUiClick();
    hapticTap();
  }

  return (
    <nav className="side-rail" aria-label="Accesos directos">
      {ITEMS.map((it) => {
        const Icon = it.Icon;
        return (
          <Link
            key={it.label}
            href={it.href}
            className="side-rail-btn"
            aria-label={it.ariaLabel}
            onClick={tap}
            style={{ ["--rb-color" as string]: it.color }}
          >
            <span className="sr-icon" aria-hidden>
              <Icon size={20} />
            </span>
            <span className="sr-label">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
