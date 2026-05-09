"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSession } from "@/lib/auth-client";
import {
  apiLuckRoyaleState,
  type LuckRoyaleState,
} from "@/lib/luck-royale-client";
import { COLLECTIBLE_ITEMS } from "@/lib/luck-royale";
import { saveUnlocked } from "@/lib/unlocked-cache";
import {
  IconArrowRight,
  IconCloud,
  IconGem,
  IconSlotMachine,
  IconTicket,
} from "./icons";

/**
 * Tarjeta CTA estilo casino para el panel derecho del lobby. Muestra el
 * balance de boletos del operador en la nube y linkea al `/luck-royale`.
 *
 * Si no hay sesión, muestra un teaser apuntando a `/login` para que el
 * jugador entienda que esto requiere cuenta.
 */
export default function LuckChip() {
  const [hydrated, setHydrated] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [luck, setLuck] = useState<LuckRoyaleState | null>(null);

  useEffect(() => {
    setHydrated(true);
    const sync = () => {
      const s = loadSession();
      const present = !!s;
      setHasSession(present);
      if (!present) {
        setLuck(null);
        return;
      }
      apiLuckRoyaleState(s.token)
        .then((st) => {
          if (st) {
            setLuck(st);
            saveUnlocked(st.unlockedItems);
          }
        })
        .catch(() => {
          /* silencio: lobby no debe romper si DB no responde */
        });
    };
    sync();
    window.addEventListener("naulpong:auth-changed", sync);
    return () => window.removeEventListener("naulpong:auth-changed", sync);
  }, []);

  if (!hydrated) {
    return <div aria-hidden style={{ minHeight: 90 }} />;
  }

  if (!hasSession) {
    return (
      <Link
        href="/login"
        className="luck-chip-card"
        aria-label="Iniciar sesión para acceder al Luck Royale"
      >
        <span className="luck-chip-eyebrow">[ Cloud Only ]</span>
        <h3 className="luck-chip-title">
          <span className="luck-chip-icon" aria-hidden>
            <IconSlotMachine size={18} />
          </span>
          LUCK ROYALE
        </h3>
        <p className="luck-chip-sub">
          Iniciá sesión para girar boletos y desbloquear al Morro
          Maincraftiano.
        </p>
        <div className="luck-chip-row">
          <span className="luck-chip-tickets">
            <span className="luck-chip-icon" aria-hidden>
              <IconCloud size={12} />
            </span>
            NUBE
          </span>
          <span className="luck-chip-cta">
            ENTRAR
            <IconArrowRight size={11} />
          </span>
        </div>
      </Link>
    );
  }

  const tickets = luck?.tickets ?? 0;
  const owned = luck
    ? COLLECTIBLE_ITEMS.filter((it) => luck.unlockedItems.includes(it.id))
        .length
    : 0;
  const total = COLLECTIBLE_ITEMS.length;
  const canSpin = tickets >= 5;

  return (
    <Link
      href="/luck-royale"
      className="luck-chip-card"
      aria-label="Ir al Luck Royale"
    >
      <span className="luck-chip-eyebrow">[ Casino · Sección 03 ]</span>
      <h3 className="luck-chip-title">
        <span className="luck-chip-icon" aria-hidden>
          <IconSlotMachine size={18} />
        </span>
        LUCK ROYALE
      </h3>
      <p className="luck-chip-sub">
        {canSpin
          ? "Tenés boletos para girar. Probá suerte por el Morro."
          : "Jugá partidas para conseguir más boletos y girar la slot."}
      </p>
      <div className="luck-chip-row">
        <span className="luck-chip-tickets">
          <span className="luck-chip-icon" aria-hidden>
            <IconTicket size={12} />
          </span>
          <b>{tickets}</b> BOLETOS
        </span>
        <span
          className="luck-chip-tickets"
          aria-label="Items desbloqueados"
        >
          <span className="luck-chip-icon" aria-hidden>
            <IconGem size={12} />
          </span>
          <b>
            {owned}/{total}
          </b>
        </span>
        <span className="luck-chip-cta">
          {canSpin ? "GIRAR" : "VER"}
          <IconArrowRight size={11} />
        </span>
      </div>
    </Link>
  );
}
