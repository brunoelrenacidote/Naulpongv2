"use client";

import { useState } from "react";
import {
  IconCalendar,
  IconNews,
  IconStore,
  IconTarget,
} from "./icons";
import { sfxUiClick, hapticTap } from "@/lib/sounds";

interface RailItem {
  Icon: (p: { size?: number }) => JSX.Element;
  label: string;
  badge?: string;
  color: string;
}

const ITEMS: readonly RailItem[] = [
  { Icon: IconNews, label: "OPS", color: "var(--apex-orange)", badge: "NEW" },
  { Icon: IconTarget, label: "RANGO", color: "var(--apex-cyan)" },
  { Icon: IconCalendar, label: "TEMP", color: "var(--apex-purple)" },
  { Icon: IconStore, label: "TIENDA", color: "var(--apex-gold)" },
];

/**
 * Barra lateral izquierda con las acciones secundarias (Operaciones,
 * Rango, Temporada, Tienda). Botones cuadrados con clip diagonal,
 * acento de color a la izquierda y badge "NEW" sobre Operaciones.
 */
export default function SideRail() {
  const [toast, setToast] = useState<string | null>(null);

  function showSoon(label: string) {
    sfxUiClick();
    hapticTap();
    setToast(`${label} · PRÓXIMAMENTE`);
    window.setTimeout(() => setToast(null), 1600);
  }

  return (
    <nav className="side-rail" aria-label="Operaciones y misiones">
      {ITEMS.map((it) => {
        const Icon = it.Icon;
        return (
          <button
            key={it.label}
            type="button"
            className="side-rail-btn"
            aria-label={it.label}
            onClick={() => showSoon(it.label)}
            style={{ ["--rb-color" as string]: it.color }}
          >
            <span className="sr-icon" aria-hidden>
              <Icon size={20} />
            </span>
            <span className="sr-label">{it.label}</span>
            {it.badge && (
              <span className="sr-badge" aria-hidden>
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
      {toast && (
        <div className="apex-toast left" role="status">
          {toast}
        </div>
      )}
    </nav>
  );
}
