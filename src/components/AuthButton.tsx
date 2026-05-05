"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/AuthModal";
import {
  AuthSession,
  apiMe,
  clearSession,
  loadSession,
} from "@/lib/auth-client";

/**
 * Botón "INICIAR SESIÓN" / "SALIR" para la página de Perfil.
 * - Si no hay sesión: abre el AuthModal.
 * - Si hay sesión válida: muestra el usuario logueado y un botón SALIR.
 * - Al iniciar la página, valida el token contra /api/auth/me; si está vencido
 *   o el endpoint está deshabilitado, limpia la sesión silenciosamente.
 */
export default function AuthButton() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [open, setOpen] = useState(false);
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
      <>
        <div className="flex w-full flex-col items-center gap-2">
          <button
            type="button"
            className="btn-chunky w-full max-w-xs"
            onClick={() => setOpen(true)}
            aria-label="Iniciar sesión"
          >
            ☁ INICIAR SESIÓN
          </button>
          <p className="font-vt text-center text-sm text-white/40">
            Opcional. Tus stats se sincronizan en la nube.
          </p>
        </div>
        <AuthModal
          open={open}
          onClose={() => setOpen(false)}
          onAuthed={() => setSession(loadSession())}
        />
      </>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <p className="font-press text-[10px] tracking-widest text-white/55">
        SESIÓN INICIADA
      </p>
      <p
        className="font-press text-base tracking-widest text-[var(--neon-yellow)]"
        style={{ textShadow: "0 0 8px rgba(255,217,92,0.55)" }}
      >
        @{session.username}
      </p>
      <button
        type="button"
        className="btn-chunky pink w-full max-w-xs"
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
