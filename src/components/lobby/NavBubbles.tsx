"use client";

import Link from "next/link";
import { IconHelp, IconUser, IconUsers } from "./icons";

/**
 * Burbujas de navegación abajo a la izquierda — perfil / brawlers / guía.
 * Mismo lenguaje visual que el Events Rail (círculos chunky con label).
 */
export default function NavBubbles() {
  return (
    <nav className="nav-bubbles" aria-label="Navegación">
      <Link href="/perfil" className="nav-bubble" aria-label="Perfil">
        <span className="nb-glyph" style={{ ["--nb-color" as string]: "#22d3ee" }} aria-hidden>
          <IconUser size={20} />
        </span>
        <span className="nb-label">PERFIL</span>
      </Link>
      <Link href="/perfil" className="nav-bubble" aria-label="Personajes">
        <span className="nb-glyph" style={{ ["--nb-color" as string]: "#ff5cd1" }} aria-hidden>
          <IconUsers size={20} />
        </span>
        <span className="nb-label">PERSONAJES</span>
      </Link>
      <Link href="/about" className="nav-bubble" aria-label="Guía">
        <span className="nb-glyph" style={{ ["--nb-color" as string]: "#facc15" }} aria-hidden>
          <IconHelp size={20} />
        </span>
        <span className="nb-label">GUÍA</span>
      </Link>
    </nav>
  );
}
