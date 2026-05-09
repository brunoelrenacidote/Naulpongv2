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
  IconSfxOff,
  IconSfxOn,
} from "./icons";
import { isSfxOn, setSfxOn, sfxUiClick, sfxUiBack } from "@/lib/sounds";

/**
 * Cluster top-right: música, SFX, login/logout. Estilo táctico Apex,
 * botones cuadrados con borde fino y glow. SFX en cada acción.
 */
export default function HUDControls() {
  const [music, setMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMusic(isMusicOn());
    setSfx(isSfxOn());
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
    sfxUiClick();
  }

  function toggleSfx() {
    const next = !sfx;
    setSfx(next);
    setSfxOn(next);
    if (next) {
      // Sonido de confirmación al re-activar.
      sfxUiClick();
    }
  }

  function handleAuthClick() {
    if (session) {
      sfxUiBack();
      clearSession();
      setSession(null);
    } else {
      sfxUiClick();
      setAuthOpen(true);
    }
  }

  return (
    <div className="hud-controls">
      <button
        type="button"
        className={`hud-btn ${music ? "" : "muted"}`}
        onClick={toggleMusic}
        aria-label={music ? "Apagar música" : "Encender música"}
        aria-pressed={music}
      >
        {music ? <IconMusicOn size={20} /> : <IconMusicOff size={20} />}
      </button>

      <button
        type="button"
        className={`hud-btn ${sfx ? "" : "muted"}`}
        onClick={toggleSfx}
        aria-label={sfx ? "Apagar efectos" : "Encender efectos"}
        aria-pressed={sfx}
      >
        {sfx ? <IconSfxOn size={20} /> : <IconSfxOff size={20} />}
      </button>

      <button
        type="button"
        className={`hud-btn ${session ? "logged" : ""}`}
        onClick={handleAuthClick}
        aria-label={
          session ? `Cerrar sesión (${session.username})` : "Iniciar sesión"
        }
        title={hydrated && session ? `@${session.username}` : "Iniciar sesión"}
      >
        {session ? <IconLogOut size={20} /> : <IconLogIn size={20} />}
      </button>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={() => setSession(loadSession())}
      />
    </div>
  );
}
