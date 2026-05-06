"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/AuthModal";
import { isMusicOn, setMusicOn } from "@/lib/music";
import {
  AuthSession,
  clearSession,
  loadSession,
} from "@/lib/auth-client";
import {
  IconLogIn,
  IconLogOut,
  IconMusicOff,
  IconMusicOn,
  IconSettings,
} from "./icons";

/**
 * Cluster arriba-derecha: música on/off, ajustes (placeholder), login/logout.
 * Botones circulares estilo bubble — sin neón, con sombra cartoon y bounce.
 */
export default function TopRightControls() {
  const [music, setMusic] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMusic(isMusicOn());
    setSession(loadSession());
    setHydrated(true);
    function refresh() {
      setSession(loadSession());
    }
    window.addEventListener("naulpong:auth-changed", refresh);
    return () => window.removeEventListener("naulpong:auth-changed", refresh);
  }, []);

  function toggleMusic() {
    const next = !music;
    setMusic(next);
    setMusicOn(next);
  }

  function handleSettings() {
    setToast("AJUSTES: PRÓXIMAMENTE");
    window.setTimeout(() => setToast(null), 1800);
  }

  function handleAuthClick() {
    if (session) {
      clearSession();
      setSession(null);
    } else {
      setAuthOpen(true);
    }
  }

  return (
    <div className="topright-cluster">
      <button
        type="button"
        className={`bubble-btn small ${music ? "" : "muted"}`}
        onClick={toggleMusic}
        aria-label={music ? "Apagar música" : "Encender música"}
        aria-pressed={music}
      >
        {music ? <IconMusicOn size={20} /> : <IconMusicOff size={20} />}
      </button>

      <button
        type="button"
        className="bubble-btn small"
        onClick={handleSettings}
        aria-label="Ajustes"
      >
        <IconSettings size={20} />
      </button>

      <button
        type="button"
        className={`bubble-btn small ${session ? "logged" : ""}`}
        onClick={handleAuthClick}
        aria-label={session ? `Cerrar sesión (${session.username})` : "Iniciar sesión"}
        title={hydrated && session ? `@${session.username}` : "Iniciar sesión"}
      >
        {session ? <IconLogOut size={20} /> : <IconLogIn size={20} />}
      </button>

      {toast && (
        <div className="lobby-toast" role="status">
          {toast}
        </div>
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={() => setSession(loadSession())}
      />
    </div>
  );
}
