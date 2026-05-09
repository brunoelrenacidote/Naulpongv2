"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AuthSession,
  apiMe,
  clearSession,
  loadSession,
} from "@/lib/auth-client";
import {
  apiLuckRoyaleState,
  type LuckRoyaleState,
} from "@/lib/luck-royale-client";
import { COLLECTIBLE_ITEMS } from "@/lib/luck-royale";

/**
 * Botón de sesión para la página de Perfil.
 * - Si no hay sesión: link al `/login` (página dedicada con estética Apex).
 * - Si hay sesión válida: muestra el usuario logueado y un botón SALIR.
 * - Al iniciar la página, valida el token contra /api/auth/me; si está vencido
 *   o el endpoint está deshabilitado, limpia la sesión silenciosamente.
 */
export default function AuthButton() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [luck, setLuck] = useState<LuckRoyaleState | null>(null);

  useEffect(() => {
    setHydrated(true);
    const s = loadSession();
    setSession(s);
    if (s) {
      // Validamos en background. Si me devuelve null, se cierra la sesión.
      apiMe(s.token)
        .then((me) => {
          if (!me) {
            clearSession();
            setSession(null);
          }
        })
        .catch(() => {
          /* offline o endpoint deshabilitado: dejar la sesión local */
        });
      // Tickets + inventario para mostrar en el panel de sesión.
      apiLuckRoyaleState(s.token)
        .then((st) => {
          if (st) setLuck(st);
        })
        .catch(() => {
          /* opcional, sin DB no rompemos el panel */
        });
    }
    const onChange = () => setSession(loadSession());
    window.addEventListener("naulpong:auth-changed", onChange);
    return () => window.removeEventListener("naulpong:auth-changed", onChange);
  }, []);

  if (!hydrated) {
    return <div aria-hidden className="h-10" />;
  }

  if (!session) {
    return (
      <div className="console-auth">
        <p className="hint">
          Sincronizá tus stats en la nube. Opcional, pero recomendado.
        </p>
        <Link
          href="/login"
          className="console-btn cyan full"
          aria-label="Ir a la pantalla de inicio de sesión"
        >
          ☁ INICIAR SESIÓN
        </Link>
      </div>
    );
  }

  const owned = luck
    ? COLLECTIBLE_ITEMS.filter((it) => luck.unlockedItems.includes(it.id)).length
    : 0;
  const total = COLLECTIBLE_ITEMS.length;

  return (
    <div className="console-auth">
      <span className="session-tag">SESIÓN ACTIVA</span>
      <span className="session-name">@{session.username}</span>
      {luck ? (
        <div className="auth-luck-row" aria-label="Estado del Luck Royale">
          <span className="auth-luck-pill gold" title="Boletos disponibles">
            <span aria-hidden>🎟</span>
            <b>{luck.tickets}</b>
            <span>BOLETOS</span>
          </span>
          <span className="auth-luck-pill" title="Items desbloqueados">
            <span aria-hidden>❖</span>
            <b>
              {owned}/{total}
            </b>
            <span>ITEMS</span>
          </span>
        </div>
      ) : null}
      <Link
        href="/luck-royale"
        className="console-btn cyan full"
        aria-label="Ir al Luck Royale"
      >
        🎟 LUCK ROYALE
      </Link>
      <button
        type="button"
        className="console-btn danger full"
        onClick={() => {
          clearSession();
          setSession(null);
        }}
        aria-label="Cerrar sesión"
      >
        SALIR
      </button>
    </div>
  );
}
