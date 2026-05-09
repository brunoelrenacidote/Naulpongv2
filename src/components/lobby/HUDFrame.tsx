"use client";

import type { ReactNode } from "react";
import { HUDCornerBracket } from "./tactical-icons";

interface Props {
  /** Acento de la etiqueta + línea superior + brackets. */
  accent?: "orange" | "cyan" | "gold" | "purple";
  /** Etiqueta opcional en la esquina top-left ("INTEL", "SQUAD", etc). */
  tag?: string;
  /** Mostrar las 4 esquinas tácticas. */
  brackets?: boolean;
  /** Estilos adicionales. */
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

/**
 * Frame táctico reutilizable: panel con clip-path diagonal, línea acento
 * superior, esquinas con corchetes y opcional tag de identificador.
 *
 * Inspirado en el HUD de Apex Legends / Warzone — cada panel "tiene
 * propósito": INTEL, SQUAD, MATCH, etc.
 */
export default function HUDFrame({
  accent = "orange",
  tag,
  brackets = true,
  className,
  style,
  children,
}: Props) {
  return (
    <div
      className={`hud-frame accent-${accent} ${className ?? ""}`.trim()}
      style={style}
    >
      {tag && <span className="hud-tag">{tag}</span>}
      {brackets && (
        <>
          <span className="hud-bracket tl" aria-hidden>
            <HUDCornerBracket />
          </span>
          <span className="hud-bracket tr" aria-hidden>
            <HUDCornerBracket />
          </span>
          <span className="hud-bracket bl" aria-hidden>
            <HUDCornerBracket />
          </span>
          <span className="hud-bracket br" aria-hidden>
            <HUDCornerBracket />
          </span>
        </>
      )}
      {children}
    </div>
  );
}
