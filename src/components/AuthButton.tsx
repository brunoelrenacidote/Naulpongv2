"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AuthSession,
  apiMe,
  clearSession,
  loadSession,
} from "@/lib/auth-client";

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

  return (
    <div className="console-auth">
      <span className="session-tag">SESIÓN ACTIVA</span>
      <span className="session-name">@{session.username}</span>
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
