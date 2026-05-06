"use client";

import { IconPlay } from "./icons";
import type { ModeDef } from "./ModesPill";

interface Props {
  mode: ModeDef;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Botón PLAY enorme abajo-derecha. Color y label cambian según el modo
 * activo. Forma de "pad" cartoon: gradiente cálido, borde grueso oscuro,
 * sombra dura abajo (drop), micro-bounce en hover/active.
 */
export default function PlayCTA({ mode, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      className="play-cta"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Jugar: ${mode.title}`}
      style={{ ["--play-color" as string]: mode.color }}
    >
      <span className="play-cta-icon" aria-hidden>
        <IconPlay size={48} />
      </span>
      <span className="play-cta-text">
        <span className="play-cta-eyebrow">JUGAR</span>
        <span className="play-cta-mode">{mode.title}</span>
      </span>
    </button>
  );
}
