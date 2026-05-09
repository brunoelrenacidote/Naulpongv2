"use client";

/**
 * Iconos tácticos extra para el lobby Apex/Warzone. Estilo "stencil
 * militar" con trazos finos a 1.6 y rellenos sólidos puntuales.
 *
 * Cada icono pinta con `currentColor` para que el padre controle el tono
 * desde CSS.
 */

import type { ComponentProps, SVGProps } from "react";

type Props = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & {
  size?: number;
};

function Base({
  size = 24,
  children,
  ...rest
}: Props & { children: ComponentProps<"svg">["children"] }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Drop pod / paracaidista — estética Apex "JUMPMASTER". */
export const IconDropPod = (p: Props) => (
  <Base {...p}>
    <path d="M12 3l4 5h-3l1 12h-4l1-12H8l4-5Z" fill="currentColor" stroke="none" />
    <path d="M5 13l-2 4M19 13l2 4" />
  </Base>
);

/** Pistola / armería — placeholder de "loadout". */
export const IconLoadout = (p: Props) => (
  <Base {...p}>
    <path d="M3 13h12l3-3h3v3l-3 3h-2l-2 2h-4l-3-3H3v-2Z" />
    <path d="M5 11V9M9 11V9" />
  </Base>
);

/** Mira / scope — para "rangos / desafíos". */
export const IconScope = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </Base>
);

/** Calavera — kill feed marker. */
export const IconSkull = (p: Props) => (
  <Base {...p}>
    <path d="M5 11a7 7 0 1 1 14 0v3l-2 2v3h-3v-2h-4v2H7v-3l-2-2v-3Z" />
    <circle cx="9.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
    <path d="M11 15h2" />
  </Base>
);

/** Radar wave — usado en la pantalla de cola. */
export const IconRadar = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 12 L20 8" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </Base>
);

/** Pelota / orb — representa la pelota de Pong. */
export const IconBall = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="6.5" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="9.5" r="1.6" fill="rgba(255,255,255,0.6)" stroke="none" />
  </Base>
);

/** Paddle vertical — usada en stats de "control". */
export const IconPaddle = (p: Props) => (
  <Base {...p}>
    <rect x="9" y="3" width="6" height="18" rx="1.5" fill="currentColor" stroke="none" />
  </Base>
);

/** Shield / defensa. */
export const IconShield = (p: Props) => (
  <Base {...p}>
    <path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3Z" />
    <path d="M9 12l2 2 4-4" />
  </Base>
);

/** Rayo táctico / energy. */
export const IconBoltTactical = (p: Props) => (
  <Base {...p}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" stroke="none" />
  </Base>
);

/** Squad / tres operadores. */
export const IconSquad = (p: Props) => (
  <Base {...p}>
    <path d="M3 18a3.5 3.5 0 0 1 7 0" />
    <circle cx="6.5" cy="11.5" r="2.5" />
    <path d="M14 18a3.5 3.5 0 0 1 7 0" />
    <circle cx="17.5" cy="11.5" r="2.5" />
    <path d="M9 17a3.2 3.2 0 0 1 6 0" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Base>
);

/** Lock / candado para sala privada. */
export const IconLockedRoom = (p: Props) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
  </Base>
);

/** Triángulo de matchmaking. */
export const IconQuickMatch = (p: Props) => (
  <Base {...p}>
    <path d="M5 4l14 8-14 8V4Z" fill="currentColor" stroke="none" />
  </Base>
);

/** Bracket de esquina — usado para las esquinas tácticas del HUDFrame. */
export const HUDCornerBracket = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    width={size}
    height={size}
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M0 6V0h6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="2" cy="2" r="1" fill="currentColor" />
  </svg>
);

/** Ranked tier shield (usado en SquadChip y BattlePass). */
export const RankShield = ({
  size = 38,
  tier = "gold",
}: {
  size?: number;
  tier?: "bronze" | "silver" | "gold" | "platinum" | "apex";
}) => {
  const palette: Record<string, [string, string, string]> = {
    bronze: ["#c8722e", "#7a3a0e", "#fff5e0"],
    silver: ["#cfd6e4", "#6f7689", "#fff"],
    gold: ["#ffd56a", "#a06a14", "#fff5d6"],
    platinum: ["#a8f0e6", "#3d8480", "#fff"],
    apex: ["#ff5a1f", "#7a1a00", "#fff"],
  };
  const [c1, c2, c3] = palette[tier] ?? palette.gold;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 38 38"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`rs-${tier}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <path
        d="M19 2 5 6v14c0 8 6 14 14 16 8-2 14-8 14-16V6L19 2Z"
        fill={`url(#rs-${tier})`}
        stroke={c2}
        strokeWidth="1"
      />
      <path
        d="M19 8 11 11v8c0 5 4 9 8 10 4-1 8-5 8-10v-8L19 8Z"
        fill="rgba(0,0,0,0.35)"
        stroke="rgba(255,255,255,0.2)"
      />
      <path
        d="M19 13l3 6h-6l3-6Z"
        fill={c3}
      />
    </svg>
  );
};

/** Hex tile con número, usado para battle pass / level. */
export const HexLevel = ({
  size = 38,
  level,
  color = "var(--apex-gold)",
}: {
  size?: number;
  level: number;
  color?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width={size}
    height={size}
    aria-hidden="true"
  >
    <polygon
      points="20,2 38,11 38,29 20,38 2,29 2,11"
      fill="rgba(0,0,0,0.55)"
      stroke={color}
      strokeWidth="1.4"
    />
    <text
      x="20"
      y="25"
      textAnchor="middle"
      fontFamily="'Lilita One', system-ui"
      fontSize="16"
      fill={color}
      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
    >
      {level}
    </text>
  </svg>
);
