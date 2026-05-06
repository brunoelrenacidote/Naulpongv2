"use client";

import Link from "next/link";
import { useState } from "react";
import { IconCalendar, IconNews, IconStore, IconTarget } from "./icons";

interface RailItem {
  glyph: (size: number) => JSX.Element;
  label: string;
  href?: string;
  badge?: string;
  color: string;
}

const ITEMS: readonly RailItem[] = [
  {
    glyph: (s) => <IconNews size={s} />,
    label: "EVENTOS",
    color: "#ff7a3d",
    badge: "!",
  },
  {
    glyph: (s) => <IconTarget size={s} />,
    label: "MISIONES",
    color: "#22d3ee",
  },
  {
    glyph: (s) => <IconCalendar size={s} />,
    label: "TEMPORADA",
    color: "#a78bfa",
  },
  {
    glyph: (s) => <IconStore size={s} />,
    label: "TIENDA",
    color: "#facc15",
  },
];

/**
 * Rail vertical pegado al medio-izquierda con burbujas de eventos /
 * misiones / tienda. Posicionado fijo (no overlapea con el personaje gracias
 * al margen del shell). Estilo bubble cartoon — círculos chunky con sombra.
 */
export default function EventsRail() {
  const [toast, setToast] = useState<string | null>(null);

  function showSoon(label: string) {
    setToast(`${label}: PRÓXIMAMENTE`);
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="events-rail" aria-label="Eventos y misiones">
      {ITEMS.map((it) => {
        const inner = (
          <>
            <span
              className="er-glyph"
              aria-hidden
              style={{ ["--er-color" as string]: it.color }}
            >
              {it.glyph(22)}
            </span>
            <span className="er-label">{it.label}</span>
            {it.badge && (
              <span
                className="er-badge"
                aria-hidden
                style={{ ["--er-color" as string]: it.color }}
              >
                {it.badge}
              </span>
            )}
          </>
        );
        return it.href ? (
          <Link key={it.label} href={it.href} className="events-bubble" aria-label={it.label}>
            {inner}
          </Link>
        ) : (
          <button
            key={it.label}
            type="button"
            className="events-bubble"
            aria-label={it.label}
            onClick={() => showSoon(it.label)}
          >
            {inner}
          </button>
        );
      })}
      {toast && (
        <div className="lobby-toast left" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
