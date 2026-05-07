"use client";

import { useEffect, useMemo, useState } from "react";
import SplashScreen from "./SplashScreen";
import AuthGate from "./AuthGate";
import { loadSession } from "@/lib/auth-client";

const NICK_KEY = "naulpong:nick";
const SESSION_FLAG = "naulpong:entry:splash-shown";

interface Props {
  children: React.ReactNode;
}

type Phase = "splash" | "gate" | "ready";

/**
 * Entry flow: splash de bienvenida (UdderGames) y, si hace falta, gate de
 * cuenta (login / registro / invitado). Después renderiza la app real
 * (lobby).
 *
 * Reglas:
 *  - Splash siempre se muestra una vez por pestaña (sessionStorage flag).
 *  - Si ya hay sesión guardada o nick guardado → saltamos directo al lobby.
 *  - Si no hay nada → pasamos por el AuthGate.
 */
export default function EntryFlow({ children }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [hydrated, setHydrated] = useState(false);

  // Decide la fase inicial sólo en el cliente para no romper la hidratación.
  useEffect(() => {
    setHydrated(true);

    let alreadyEntered = false;
    let splashAlreadyShown = false;
    try {
      const session = loadSession();
      const nick = window.localStorage.getItem(NICK_KEY)?.trim();
      alreadyEntered = !!(session?.username || nick);
      splashAlreadyShown =
        window.sessionStorage.getItem(SESSION_FLAG) === "1";
    } catch {
      /* ignore */
    }

    if (splashAlreadyShown) {
      // Ya vimos el splash en esta pestaña; saltamos directo si corresponde.
      setPhase(alreadyEntered ? "ready" : "gate");
      return;
    }

    setPhase("splash");
  }, []);

  // Mark splash as seen when we leave it.
  function finishSplash() {
    try {
      window.sessionStorage.setItem(SESSION_FLAG, "1");
    } catch {
      /* ignore */
    }
    let alreadyEntered = false;
    try {
      const session = loadSession();
      const nick = window.localStorage.getItem(NICK_KEY)?.trim();
      alreadyEntered = !!(session?.username || nick);
    } catch {
      /* ignore */
    }
    setPhase(alreadyEntered ? "ready" : "gate");
  }

  function finishGate() {
    setPhase("ready");
  }

  // Splash duration: si ya hay sesión, lo hacemos un poco más corto para
  // que se sienta como "logging in".
  const splashDuration = useMemo(() => {
    try {
      const session = loadSession();
      const nick = window.localStorage.getItem(NICK_KEY)?.trim();
      if (session?.username || nick) return 1800;
    } catch {
      /* ignore */
    }
    return 2400;
  }, []);

  // Antes de hidratar, renderizamos el splash con duración 0 visible para
  // evitar parpadeo de contenido — pero ocultamos hasta que sepamos qué
  // mostrar.
  if (!hydrated) {
    return (
      <div className="entry-stage" aria-hidden>
        <div className="entry-splash" />
      </div>
    );
  }

  if (phase === "splash") {
    return (
      <div className="entry-stage" role="presentation">
        <SplashScreen duration={splashDuration} onDone={finishSplash} />
      </div>
    );
  }

  if (phase === "gate") {
    return (
      <div className="entry-stage" role="presentation">
        <AuthGate onEntered={finishGate} />
      </div>
    );
  }

  return <>{children}</>;
}
