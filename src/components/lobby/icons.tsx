"use client";

/**
 * Iconos SVG inline para el lobby. Todos a 24x24 viewBox por defecto, con
 * `currentColor` para pintar desde CSS. Estilo "rounded line" tipo Lucide,
 * pensado para que combinen con la estética bubble/cartoon del lobby.
 *
 * Mantenemos los iconos como inline SVG en vez de importar un paquete
 * grande para no engordar el bundle, ya que solo necesitamos un puñado.
 */

import type { ComponentProps, SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  size?: number;
};

function Base({ size = 24, children, ...rest }: Props & { children: ComponentProps<"svg">["children"] }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconPlay = (p: Props) => (
  <Base {...p}>
    <path d="M7 5.5v13a1 1 0 0 0 1.55.83l10-6.5a1 1 0 0 0 0-1.66l-10-6.5A1 1 0 0 0 7 5.5Z" fill="currentColor" stroke="none" />
  </Base>
);

export const IconBolt = (p: Props) => (
  <Base {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor" stroke="none" />
  </Base>
);

export const IconBot = (p: Props) => (
  <Base {...p}>
    <rect x="4" y="7" width="16" height="12" rx="3" />
    <path d="M12 4v3M9 12h.01M15 12h.01" />
    <path d="M2 15h2M20 15h2" />
  </Base>
);

export const IconUsers = (p: Props) => (
  <Base {...p}>
    <path d="M16 14a4 4 0 1 0-8 0" />
    <circle cx="12" cy="8" r="3.2" />
    <path d="M21 21v-1a4 4 0 0 0-3-3.87" />
    <path d="M3 21v-1a4 4 0 0 1 3-3.87" />
    <circle cx="18" cy="8" r="2.5" />
    <circle cx="6" cy="8" r="2.5" />
  </Base>
);

export const IconTrophy = (p: Props) => (
  <Base {...p}>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M17 4h3v3a3 3 0 0 1-3 3" />
    <path d="M7 4H4v3a3 3 0 0 0 3 3" />
  </Base>
);

export const IconCoin = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="6" />
    <path d="M12 8v8M9.5 10.5h3.5a1.5 1.5 0 0 1 0 3H9.5h4a1.5 1.5 0 0 1 0 3H9.5" />
  </Base>
);

export const IconGem = (p: Props) => (
  <Base {...p}>
    <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
    <path d="M2 9h20M12 3v18M9 9 12 3l3 6-3 12-3-12Z" />
  </Base>
);

export const IconMusicOn = (p: Props) => (
  <Base {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </Base>
);

export const IconMusicOff = (p: Props) => (
  <Base {...p}>
    <path d="M9 18V9l12-2" />
    <circle cx="6" cy="18" r="3" />
    <path d="M3 3l18 18" />
  </Base>
);

export const IconSfxOn = (p: Props) => (
  <Base {...p}>
    <path d="M3 9v6h4l5 4V5L7 9H3z" />
    <path d="M16 8a5 5 0 0 1 0 8" />
    <path d="M19 5a9 9 0 0 1 0 14" />
  </Base>
);

export const IconSfxOff = (p: Props) => (
  <Base {...p}>
    <path d="M3 9v6h4l5 4V5L7 9H3z" />
    <path d="M16 9l5 6" />
    <path d="M21 9l-5 6" />
  </Base>
);

export const IconSettings = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.55V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.04-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1.04H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1.04-1.55V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.04 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1.04H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.55 1.04Z" />
  </Base>
);

export const IconLogIn = (p: Props) => (
  <Base {...p}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5M15 12H3" />
  </Base>
);

export const IconLogOut = (p: Props) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Base>
);

export const IconStore = (p: Props) => (
  <Base {...p}>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
    <path d="M3 9h18l-1 11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2L3 9Z" />
    <path d="M9 13a3 3 0 0 0 6 0" />
  </Base>
);

export const IconNews = (p: Props) => (
  <Base {...p}>
    <path d="M5 3h12a2 2 0 0 1 2 2v14a2 2 0 0 0 2-2V8" />
    <path d="M3 5v14a2 2 0 0 0 2 2h14" />
    <path d="M7 7h8M7 11h8M7 15h5" />
  </Base>
);

export const IconCalendar = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </Base>
);

export const IconTarget = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </Base>
);

export const IconHelp = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.8.6-1.5 1-1.5 2.5" />
    <circle cx="12" cy="17" r="0.7" fill="currentColor" />
  </Base>
);

export const IconUser = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 21a7 7 0 0 1 14 0" />
  </Base>
);

export const IconChevronDown = (p: Props) => (
  <Base {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
);

export const IconChevronUp = (p: Props) => (
  <Base {...p}>
    <path d="M6 15l6-6 6 6" />
  </Base>
);

export const IconArrowLeft = (p: Props) => (
  <Base {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Base>
);

export const IconArrowRight = (p: Props) => (
  <Base {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </Base>
);

export const IconClose = (p: Props) => (
  <Base {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Base>
);

export const IconKey = (p: Props) => (
  <Base {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l9-9M16 7l3 3M14 9l3 3" />
  </Base>
);

export const IconSwap = (p: Props) => (
  <Base {...p}>
    <path d="M7 10V6a2 2 0 0 1 2-2h6" />
    <path d="M3 10l4-4 4 4M17 14v4a2 2 0 0 1-2 2H9" />
    <path d="M21 14l-4 4-4-4" />
  </Base>
);

/* ------------------------------------------------------------------
 * Iconos del Luck Royale / casino y de los items del pool. Todos
 * `currentColor` para que se pinten desde CSS según el contexto.
 * ------------------------------------------------------------------ */

export const IconTicket = (p: Props) => (
  <Base {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
    <path d="M9 6v12" strokeDasharray="2 2" />
  </Base>
);

export const IconLock = (p: Props) => (
  <Base {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
  </Base>
);

export const IconCloud = (p: Props) => (
  <Base {...p}>
    <path d="M7 18a4 4 0 0 1-1-7.85A6 6 0 0 1 18 9.5a4.5 4.5 0 0 1-.5 8.5H7Z" />
  </Base>
);

export const IconStar = (p: Props) => (
  <Base {...p}>
    <path d="M12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.4 6.5 20.3l1.1-6.3L3 9.6l6.3-.9L12 3Z" />
  </Base>
);

export const IconWarn = (p: Props) => (
  <Base {...p}>
    <path d="M12 3 2.5 20.5h19L12 3Z" />
    <path d="M12 10v5" />
    <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
  </Base>
);

export const IconHourglass = (p: Props) => (
  <Base {...p}>
    <path d="M5 3h14M5 21h14" />
    <path d="M6 3v3a6 6 0 0 0 12 0V3" />
    <path d="M6 21v-3a6 6 0 0 1 12 0v3" />
  </Base>
);

export const IconBox = (p: Props) => (
  <Base {...p}>
    <path d="M3 7l9-4 9 4-9 4-9-4Z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </Base>
);

export const IconSlotMachine = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 13v2M12 13v2M16 13v2" />
    <path d="M21 11l2 1-2 1" />
  </Base>
);

export const IconHexagon = (p: Props) => (
  <Base {...p}>
    <path d="M12 3l8 4.6v8.8L12 21l-8-4.6V7.6L12 3Z" />
  </Base>
);

/* ----- Iconos de items del pool ----- */

export const IconPickaxe = (p: Props) => (
  <Base {...p}>
    <path d="M5 5c4 0 9 1.5 12 5" />
    <path d="M5 5c-1 4 .5 9 5 12" />
    <path d="M9 11l8 8" />
    <path d="M16 16l4 4" />
  </Base>
);

export const IconFlame = (p: Props) => (
  <Base {...p}>
    <path d="M12 3c2 4 6 6 6 11a6 6 0 0 1-12 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 1-6 2-10Z" />
  </Base>
);

export const IconSkull = (p: Props) => (
  <Base {...p}>
    <path d="M5 11a7 7 0 0 1 14 0v4l-2 1v3h-2v-2h-2v2h-2v-2h-2v2H7v-3l-2-1v-4Z" />
    <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none" />
  </Base>
);

export const IconPaddleSkin = (p: Props) => (
  <Base {...p}>
    <rect x="9" y="3" width="6" height="14" rx="2.5" />
    <path d="M11 17v3M13 17v3" />
  </Base>
);

export const IconRose = (p: Props) => (
  <Base {...p}>
    <path d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4Z" />
    <path d="M12 12v9" />
    <path d="M12 16c-2 0-4-1-4-3M12 16c2 0 4-1 4-3" />
  </Base>
);

export const IconBolt2 = (p: Props) => (
  <Base {...p}>
    <path d="M13 3 4 14h6l-1 7 9-12h-6l1-6Z" />
  </Base>
);
