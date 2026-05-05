"use client";

import type { CSSProperties, ReactNode } from "react";

interface Props {
  glyph: string;
  title: string;
  subtitle: string;
  color: string;
  hero?: boolean;
  onClick: () => void;
  trailing?: ReactNode;
  ariaLabel?: string;
}

/**
 * Tarjeta de modo de juego estilo Brawl Stars: ícono grande + título + subtítulo +
 * flecha. La variable CSS --mc-color define el color de borde / glow.
 */
export default function ModeCard({
  glyph,
  title,
  subtitle,
  color,
  hero,
  onClick,
  trailing,
  ariaLabel,
}: Props) {
  const style: CSSProperties = { ["--mc-color" as string]: color };
  return (
    <button
      type="button"
      className={`mode-card ${hero ? "hero" : ""}`}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel ?? title}
    >
      <span className="mc-icon" aria-hidden>
        {glyph}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="mc-title truncate">{title}</span>
        <span className="mc-sub truncate">{subtitle}</span>
      </span>
      {trailing ?? <span className="mc-arrow" aria-hidden>›</span>}
    </button>
  );
}
