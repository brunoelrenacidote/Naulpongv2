"use client";

import { useState } from "react";
import {
  apiLogin,
  apiMe,
  apiPushStats,
  apiRegister,
  applyToLocal,
  mergeStats,
  pullLocal,
} from "@/lib/auth-client";

type Mode = "login" | "register";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthed: (username: string) => void;
}

/**
 * Modal de login / registro. Usuario + contraseña, sin email.
 * - Crear cuenta: manda las stats locales actuales como initialStats.
 * - Login: pulla stats del server, mergea con las locales y empuja el merge.
 */
export default function AuthModal({ open, onClose, onAuthed }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function syncAfterLogin(token: string) {
    // Tras login, mergear stats local + remoto y empujar el merge al server.
    try {
      const me = await apiMe(token);
      const local = pullLocal();
      if (!me) return;
      const merged = me.stats
        ? mergeStats(local.stats, me.stats)
        : local.stats;
      const unlocked = Array.from(
        new Set([...(me.unlocked ?? []), ...local.unlocked]),
      );
      applyToLocal(merged, unlocked);
      await apiPushStats(token, merged, unlocked);
    } catch {
      /* sync best-effort */
    }
  }

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      if (mode === "register") {
        const local = pullLocal();
        const sess = await apiRegister(user.trim(), pass, local.stats);
        // Después del registro, también guardamos los unlocked locales en server.
        try {
          await apiPushStats(sess.token, local.stats, local.unlocked);
        } catch {
          /* swallow */
        }
        onAuthed(sess.username);
        onClose();
      } else {
        const sess = await apiLogin(user.trim(), pass);
        await syncAfterLogin(sess.token);
        onAuthed(sess.username);
        onClose();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fs-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="fs-modal-card flex flex-col items-stretch gap-3">
        <div className="flex items-center justify-between">
          <p id="auth-title" className="font-press text-[12px] tracking-widest">
            {mode === "login" ? "INICIAR SESIÓN" : "CREAR CUENTA"}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="font-press text-xs text-white/55 hover:text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <label className="font-press text-[8px] tracking-widest text-white/55">
          USUARIO
        </label>
        <input
          autoFocus
          maxLength={16}
          className="input-arcade text-center"
          placeholder="JUGADOR"
          value={user}
          onChange={(e) =>
            setUser(e.target.value.replace(/[^A-Za-z0-9._-]/g, ""))
          }
          disabled={busy}
          aria-label="Usuario"
        />

        <label className="font-press text-[8px] tracking-widest text-white/55">
          CONTRASEÑA
        </label>
        <input
          type="password"
          maxLength={64}
          className="input-arcade text-center"
          placeholder="••••••"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          disabled={busy}
          aria-label="Contraseña"
        />

        {err && (
          <p className="font-press glow-pink text-center text-[9px]">! {err}</p>
        )}

        <button
          type="button"
          className="btn-mega"
          onClick={submit}
          disabled={busy}
        >
          {busy ? "CARGANDO..." : mode === "login" ? "ENTRAR" : "CREAR"}
        </button>

        <button
          type="button"
          className="font-press text-[9px] tracking-widest text-white/55 underline-offset-2 hover:text-white hover:underline"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setErr(null);
          }}
          disabled={busy}
        >
          {mode === "login"
            ? "¿NO TENÉS CUENTA? CREAR UNA"
            : "¿YA TENÉS CUENTA? INICIAR SESIÓN"}
        </button>

        <p className="font-vt text-center text-sm text-white/45">
          Es opcional. Sin login, las stats quedan en este dispositivo.
        </p>
      </div>
    </div>
  );
}
