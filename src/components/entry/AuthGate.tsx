"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Gamepad2,
  KeyRound,
  LogIn,
  Milk,
  ShieldCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import {
  apiLogin,
  apiMe,
  apiPushStats,
  apiRegister,
  applyToLocal,
  mergeStats,
  pullLocal,
} from "@/lib/auth-client";

const NICK_KEY = "naulpong:nick";
const NICK_MAX = 12;

type Tab = "login" | "register" | "guest";

interface Props {
  /** Llamado con el nick efectivo cuando el usuario decide cómo entrar. */
  onEntered: (nick: string) => void;
}

function sanitizeNick(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 _\-]/g, "")
    .toUpperCase()
    .slice(0, NICK_MAX);
}

function sanitizeUser(raw: string): string {
  return raw.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 16);
}

/**
 * Gate de cuenta. Tres caminos: iniciar sesión, crear cuenta, invitado.
 * Reusa los endpoints `/api/auth/*` y, para invitado, sólo guarda nick.
 */
export default function AuthGate({ onEntered }: Props) {
  const [tab, setTab] = useState<Tab>("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [guestNick, setGuestNick] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function syncAfterLogin(token: string) {
    try {
      const me = await apiMe(token);
      const local = pullLocal();
      if (!me) return;
      const merged = me.stats ? mergeStats(local.stats, me.stats) : local.stats;
      const unlocked = Array.from(
        new Set([...(me.unlocked ?? []), ...local.unlocked]),
      );
      applyToLocal(merged, unlocked);
      await apiPushStats(token, merged, unlocked);
    } catch {
      /* sync best-effort */
    }
  }

  async function submitLogin() {
    setErr(null);
    if (user.trim().length < 2 || pass.length < 1) {
      setErr("Usuario y contraseña son obligatorios.");
      return;
    }
    setBusy(true);
    try {
      const sess = await apiLogin(user.trim(), pass);
      await syncAfterLogin(sess.token);
      window.localStorage.setItem(NICK_KEY, sess.username.toUpperCase());
      onEntered(sess.username);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No pudimos entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister() {
    setErr(null);
    if (user.trim().length < 3) {
      setErr("Mínimo 3 caracteres en el usuario.");
      return;
    }
    if (pass.length < 4) {
      setErr("Mínimo 4 caracteres en la contraseña.");
      return;
    }
    setBusy(true);
    try {
      const local = pullLocal();
      const sess = await apiRegister(user.trim(), pass, local.stats);
      try {
        await apiPushStats(sess.token, local.stats, local.unlocked);
      } catch {
        /* swallow */
      }
      window.localStorage.setItem(NICK_KEY, sess.username.toUpperCase());
      onEntered(sess.username);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No pudimos crear la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  function submitGuest() {
    setErr(null);
    const clean = sanitizeNick(guestNick);
    if (clean.length < 2) {
      setErr("Mínimo 2 caracteres en el nick.");
      return;
    }
    window.localStorage.setItem(NICK_KEY, clean);
    onEntered(clean);
  }

  return (
    <div className="entry-gate">
      <header className="entry-gate-header">
        <span className="entry-publisher-tag">UdderGames</span>
        <span className="entry-gate-brand">
          <span className="mark" aria-hidden>
            <Milk />
          </span>
          NauLPong
        </span>
      </header>

      <div className="entry-gate-body">
        <section className="entry-hero">
          <span className="entry-hero-eyebrow">Bienvenido</span>
          <h2 className="entry-hero-title">¿Cómo entrás hoy?</h2>
          <p className="entry-hero-desc">
            Iniciá sesión para llevar tus stats y trofeos a cualquier
            dispositivo, o entrá como invitado y juega ya. Siempre podés
            crearte una cuenta más tarde.
          </p>
          <div className="entry-hero-meta">
            <span className="entry-hero-pill">
              <Zap aria-hidden focusable="false" />
              Pong 1v1
            </span>
            <span className="entry-hero-pill">
              <Bot aria-hidden focusable="false" />
              Modo Bot
            </span>
            <span className="entry-hero-pill">
              <Users aria-hidden focusable="false" />
              Salas Privadas
            </span>
            <span className="entry-hero-pill">
              <ShieldCheck aria-hidden focusable="false" />
              Stats sincronizadas
            </span>
          </div>
        </section>

        <section className="entry-card" aria-label="Acceso a la cuenta">
          <div className="entry-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "login"}
              className={`entry-tab ${tab === "login" ? "active" : ""}`}
              onClick={() => {
                setTab("login");
                setErr(null);
              }}
            >
              <LogIn aria-hidden focusable="false" />
              Iniciar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "register"}
              className={`entry-tab ${tab === "register" ? "active" : ""}`}
              onClick={() => {
                setTab("register");
                setErr(null);
              }}
            >
              <UserPlus aria-hidden focusable="false" />
              Crear
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "guest"}
              className={`entry-tab ${tab === "guest" ? "active" : ""}`}
              onClick={() => {
                setTab("guest");
                setErr(null);
              }}
            >
              <Gamepad2 aria-hidden focusable="false" />
              Invitado
            </button>
          </div>

          {tab === "login" && (
            <form
              className="entry-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) submitLogin();
              }}
            >
              <div className="entry-field">
                <label className="entry-label" htmlFor="entry-login-user">
                  Usuario
                </label>
                <input
                  id="entry-login-user"
                  className="entry-input"
                  autoComplete="username"
                  placeholder="tu_usuario"
                  value={user}
                  onChange={(e) => setUser(sanitizeUser(e.target.value))}
                  disabled={busy}
                />
              </div>
              <div className="entry-field">
                <label className="entry-label" htmlFor="entry-login-pass">
                  Contraseña
                </label>
                <input
                  id="entry-login-pass"
                  type="password"
                  className="entry-input"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  disabled={busy}
                />
              </div>
              {err && (
                <p className="entry-error" role="alert">
                  <AlertCircle aria-hidden focusable="false" />
                  {err}
                </p>
              )}
              <button type="submit" className="entry-cta" disabled={busy}>
                {busy ? (
                  "Entrando..."
                ) : (
                  <>
                    <LogIn aria-hidden focusable="false" />
                    Iniciar sesión
                  </>
                )}
              </button>
              <div className="entry-foot">
                <span>¿Sin cuenta?</span>
                <button
                  type="button"
                  className="entry-secondary"
                  onClick={() => {
                    setTab("register");
                    setErr(null);
                  }}
                  disabled={busy}
                >
                  <UserPlus aria-hidden focusable="false" />
                  Crear una
                </button>
              </div>
            </form>
          )}

          {tab === "register" && (
            <form
              className="entry-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) submitRegister();
              }}
            >
              <div className="entry-field">
                <label className="entry-label" htmlFor="entry-reg-user">
                  Usuario
                </label>
                <input
                  id="entry-reg-user"
                  className="entry-input"
                  autoComplete="username"
                  placeholder="tu_usuario"
                  value={user}
                  onChange={(e) => setUser(sanitizeUser(e.target.value))}
                  disabled={busy}
                />
              </div>
              <div className="entry-field">
                <label className="entry-label" htmlFor="entry-reg-pass">
                  Contraseña
                </label>
                <input
                  id="entry-reg-pass"
                  type="password"
                  className="entry-input"
                  autoComplete="new-password"
                  placeholder="mínimo 4 caracteres"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  disabled={busy}
                />
              </div>
              {err && (
                <p className="entry-error" role="alert">
                  <AlertCircle aria-hidden focusable="false" />
                  {err}
                </p>
              )}
              <button type="submit" className="entry-cta" disabled={busy}>
                {busy ? (
                  "Creando..."
                ) : (
                  <>
                    <UserPlus aria-hidden focusable="false" />
                    Crear cuenta
                  </>
                )}
              </button>
              <div className="entry-foot">
                <span>¿Ya tenés cuenta?</span>
                <button
                  type="button"
                  className="entry-secondary"
                  onClick={() => {
                    setTab("login");
                    setErr(null);
                  }}
                  disabled={busy}
                >
                  <LogIn aria-hidden focusable="false" />
                  Iniciar sesión
                </button>
              </div>
            </form>
          )}

          {tab === "guest" && (
            <form
              className="entry-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) submitGuest();
              }}
            >
              <div className="entry-field">
                <label className="entry-label" htmlFor="entry-guest-nick">
                  Tu nick
                </label>
                <input
                  id="entry-guest-nick"
                  className="entry-input"
                  placeholder="JUGADOR"
                  value={guestNick}
                  onChange={(e) => setGuestNick(sanitizeNick(e.target.value))}
                  maxLength={NICK_MAX}
                />
              </div>
              {err && (
                <p className="entry-error" role="alert">
                  <AlertCircle aria-hidden focusable="false" />
                  {err}
                </p>
              )}
              <button type="submit" className="entry-cta guest">
                <ArrowRight aria-hidden focusable="false" />
                Entrar como invitado
              </button>
              <div className="entry-divider">o</div>
              <div className="entry-foot">
                <span>¿Querés llevarte tus stats?</span>
                <button
                  type="button"
                  className="entry-secondary"
                  onClick={() => {
                    setTab("register");
                    setErr(null);
                  }}
                >
                  <KeyRound aria-hidden focusable="false" />
                  Crear cuenta
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <div className="entry-stage-foot" aria-hidden>
        © UdderGames · NauLPong
      </div>
    </div>
  );
}
