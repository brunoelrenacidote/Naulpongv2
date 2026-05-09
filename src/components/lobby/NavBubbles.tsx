"use client";

import Link from "next/link";
import { IconGem, IconHelp, IconUser, IconUsers } from "./icons";

/**
 * Burbujas de navegación abajo a la izquierda — perfil / brawlers / guía.
 * Mismo lenguaje visual que el Events Rail (círculos chunky con label).
 */
export default function NavBubbles() {
  return (
    <nav className="nav-bubbles" aria-label="Navegación">
      <Link href="/perfil" className="nav-bubble" aria-label="Perfil">
        <span className="nb-glyph" aria-hidden>
          <IconUser size={18} />
        </span>
        <span className="nb-label">PERFIL</span>
      </Link>
      <Link href="/perfil" className="nav-bubble" aria-label="Heroes">
        <span className="nb-glyph" aria-hidden>
          <IconUsers size={18} />
        </span>
        <span className="nb-label">HEROES</span>
      </Link>
      <Link
        href="/luck-royale"
        className="nav-bubble gold"
        aria-label="Luck Royale"
      >
        <span className="nb-glyph" aria-hidden>
          <IconGem size={18} />
        </span>
        <span className="nb-label">LUCK</span>
      </Link>
      <Link href="/about" className="nav-bubble" aria-label="Guía">
        <span className="nb-glyph" aria-hidden>
          <IconHelp size={18} />
        </span>
        <span className="nb-label">GUÍA</span>
      </Link>
    </nav>
  );
}
