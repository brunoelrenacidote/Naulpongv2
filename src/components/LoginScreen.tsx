"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  apiLogin,
  apiMe,
  apiPushStats,
  apiRegister,
  applyToLocal,
  AuthSession,
  clearSession,
  loadSession,
  mergeStats,
  pullLocal,
} from "@/lib/auth-client";
import { defaultStats } from "@/lib/stats";
import {
  IconCloud,
  IconSettings,
  IconSlotMachine,
} from "@/components/lobby/icons";

type Mode = "login" | "register";

const NAME_RE = /[^A-Za-z0-9._-]/g;

/**
 * Pantalla dedicada de login/registro con estética Apex/console HUD,
 * pensada en landscape (horizontal). Reutiliza los tokens de console.css
 * (bezel + hex grid + scan beam + corner brackets + glitch title).
 *
 * - Sin sesión: muestra el access terminal con tabs ENTRAR / REGISTRARSE.
 * - Con sesión: muestra estado activo y atajos a /perfil y SALIR.
 */
export default function LoginScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setSession(loadSession());
    const onChange = () => setSession(loadSession());
    window.addEventListener("naulpong:auth-changed", onChange);
    return () =>
      window.removeEventListener("naulpong:auth-changed", onChange);
  }, []);

  async function syncAfterLogin(token: string) {
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

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setOkMsg(null);
    const username = user.trim();
    if (username.length < 3) {
      setErr("Usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (pass.length < 6) {
      setErr("Contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        // Anti-cheese: no mandamos stats locales al server. La cuenta
        // arranca limpia (ver apiRegister + /api/auth/register). Además
        // reseteamos el localStorage para que el navegador no siga
        // mostrando los counters viejos como si fueran del nuevo usuario.
        const sess = await apiRegister(username, pass);
        const empty = defaultStats();
        applyToLocal(empty, []);
        try {
          await apiPushStats(sess.token, empty, []);
        } catch {
          /* swallow — el server ya tiene la cuenta creada con stats:null */
        }
        setOkMsg(`CUENTA CREADA · @${sess.username}`);
        router.push("/perfil");
      } else {
        const sess = await apiLogin(username, pass);
        await syncAfterLogin(sess.token);
        setOkMsg(`SESIÓN ACTIVA · @${sess.username}`);
        router.push("/perfil");
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error desconocido.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearSession();
    setSession(null);
    setOkMsg(null);
    setErr(null);
  }

  return (
    <main className="console-screen">
      <div className="console-bg" aria-hidden />
      <div className="console-scan" aria-hidden />
      <span className="console-glow tl" aria-hidden />
      <span className="console-glow br" aria-hidden />
      <div className="console-bezel" aria-hidden>
        <span className="console-bezel-corner tl" />
        <span className="console-bezel-corner tr" />
        <span className="console-bezel-corner bl" />
        <span className="console-bezel-corner br" />
      </div>

      <div className="console-content">
        <header className="console-statusbar">
          <Link href="/" className="chip" aria-label="Volver al lobby">
            <span className="arrow" aria-hidden>
              ◀
            </span>
            <span>LOBBY</span>
          </Link>
          <span className="chip cyan" aria-hidden>
            <span>OPERATOR · ACCESS TERMINAL</span>
            <span className="dot green" />
          </span>
        </header>

        <section className="console-hero">
          <span className="console-eyebrow">
            [ ACCESS TERMINAL // SECCIÓN 02 ]
          </span>
          <h1 className="console-title" data-text="ACCESO">
            ACCESO
          </h1>
          <p className="console-subtitle">
            {hydrated && session ? (
              <>
                Sesión activa como{" "}
                <b>@{session.username}</b>. Tus stats sincronizan
                automáticamente entre dispositivos.
              </>
            ) : (
              <>
                Iniciá sesión para sincronizar tus stats, racha y logros
                entre dispositivos. Sin mail. Sin verificación.
              </>
            )}
          </p>
        </section>

        <div className="console-grid grid-login">
          {/* COL 1 — lore + roster */}
          <div className="console-col">
            <section
              className="console-panel accent-cyan"
              style={{ animationDelay: "180ms" } as React.CSSProperties}
            >
              <span className="console-panel-tag">{"// BRIEFING"}</span>
              <span className="console-panel-bracket tl" aria-hidden />
              <span className="console-panel-bracket tr" aria-hidden />
              <span className="console-panel-bracket bl" aria-hidden />
              <span className="console-panel-bracket br" aria-hidden />
              <h2 className="console-panel-title">
                <span className="glyph">!</span>
                POR QUÉ LOGUEARSE
              </h2>
              <ul className="console-bullet-list">
                <li>
                  Sincronizá <b>stats y racha</b> entre dispositivos.
                </li>
                <li>
                  Guardá tus <b>logros</b> en la nube.
                </li>
                <li>
                  Solo usuario y contraseña — <b>sin mail</b>, sin
                  verificación.
                </li>
                <li>Es opcional: la app funciona offline también.</li>
              </ul>
            </section>

            <section
              className="console-panel accent-purple"
              style={{ animationDelay: "260ms" } as React.CSSProperties}
            >
              <span className="console-panel-tag">{"// ROSTER"}</span>
              <span className="console-panel-bracket tl" aria-hidden />
              <span className="console-panel-bracket tr" aria-hidden />
              <span className="console-panel-bracket bl" aria-hidden />
              <span className="console-panel-bracket br" aria-hidden />
              <h2 className="console-panel-title">
                <span className="glyph">⚔</span>
                ROSTER
              </h2>
              <div className="login-roster">
                <div className="login-roster-card cyan">
                  <span className="emoji" aria-hidden>
                    🟢
                  </span>
                  <span className="ptext">
                    <span className="rname">EL WEY</span>
                    <span className="rrole">PADRE · GUARDIÁN</span>
                  </span>
                </div>
                <div className="login-roster-card orange">
                  <span className="emoji" aria-hidden>
                    🔴
                  </span>
                  <span className="ptext">
                    <span className="rname">EL CLAVEL</span>
                    <span className="rrole">SUSPECT · ANTAGONISTA</span>
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* COL 2 — terminal */}
          <div className="console-col">
            {!hydrated ? (
              <section className="console-panel accent-orange flex">
                <span className="console-panel-tag">{"// LOADING"}</span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />
                <p className="console-prose" aria-live="polite">
                  <span className="hl-cyan">CARGANDO TERMINAL...</span>
                </p>
              </section>
            ) : session ? (
              <section
                className="console-panel accent-gold flex"
                style={{ animationDelay: "200ms" } as React.CSSProperties}
              >
                <span className="console-panel-tag">
                  {"// SESIÓN ACTIVA"}
                </span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />
                <h2 className="console-panel-title">
                  <span className="glyph">
                    <IconCloud size={14} />
                  </span>
                  OPERATOR ONLINE
                </h2>
                <div className="login-active">
                  <span className="session-tag">SESIÓN ACTIVA</span>
                  <span className="session-name">@{session.username}</span>
                  <p className="hint">
                    Tus stats sincronizan automáticamente al jugar.
                  </p>
                  <div className="login-active-actions">
                    <Link
                      href="/perfil"
                      className="console-btn cyan full"
                    >
                      <IconSettings size={14} /> IR AL PERFIL
                    </Link>
                    <Link
                      href="/luck-royale"
                      className="console-btn full"
                    >
                      <IconSlotMachine size={14} /> LUCK ROYALE
                    </Link>
                    <button
                      type="button"
                      className="console-btn danger full"
                      onClick={logout}
                    >
                      CERRAR SESIÓN
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section
                className="console-panel accent-orange flex"
                style={{ animationDelay: "200ms" } as React.CSSProperties}
              >
                <span className="console-panel-tag">
                  {"// ACCESS TERMINAL"}
                </span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />
                <h2 className="console-panel-title">
                  <span className="glyph">
                    {mode === "register" ? "+" : "▶"}
                  </span>
                  {mode === "register" ? "CREAR CUENTA" : "INICIAR SESIÓN"}
                </h2>

                <div
                  role="tablist"
                  aria-label="Modo"
                  className="login-tabs"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "login"}
                    className={`login-tab ${mode === "login" ? "active" : ""}`}
                    onClick={() => {
                      setMode("login");
                      setErr(null);
                    }}
                    disabled={busy}
                  >
                    ENTRAR
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "register"}
                    className={`login-tab ${
                      mode === "register" ? "active" : ""
                    }`}
                    onClick={() => {
                      setMode("register");
                      setErr(null);
                    }}
                    disabled={busy}
                  >
                    REGISTRARSE
                  </button>
                </div>

                <form
                  className="console-form"
                  onSubmit={submit}
                  noValidate
                >
                  <label
                    className="console-form-label"
                    htmlFor="login-user"
                  >
                    <span>USUARIO</span>
                    <span className="hintchar">
                      3–16 · letras, números, . _ -
                    </span>
                  </label>
                  <input
                    id="login-user"
                    autoFocus
                    maxLength={16}
                    className="console-input"
                    placeholder="JUGADOR01"
                    value={user}
                    onChange={(e) =>
                      setUser(e.target.value.replace(NAME_RE, ""))
                    }
                    disabled={busy}
                    autoComplete="username"
                    aria-label="Usuario"
                  />

                  <label
                    className="console-form-label"
                    htmlFor="login-pass"
                  >
                    <span>CONTRASEÑA</span>
                    <button
                      type="button"
                      className="hintchar pwtoggle"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={
                        showPass
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      tabIndex={-1}
                    >
                      {showPass ? "OCULTAR" : "MOSTRAR"}
                    </button>
                  </label>
                  <input
                    id="login-pass"
                    type={showPass ? "text" : "password"}
                    maxLength={64}
                    className="console-input"
                    placeholder="••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    disabled={busy}
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    aria-label="Contraseña"
                  />

                  <div
                    aria-live="polite"
                    className="console-form-status"
                  >
                    {err && (
                      <p className="status err">
                        <span className="badge" aria-hidden>
                          !
                        </span>
                        <span>{err}</span>
                      </p>
                    )}
                    {okMsg && !err && (
                      <p className="status ok">
                        <span className="badge" aria-hidden>
                          ✓
                        </span>
                        <span>{okMsg}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="console-btn cyan full big"
                    disabled={busy}
                  >
                    {busy
                      ? "PROCESANDO..."
                      : mode === "login"
                        ? "▶ ENTRAR"
                        : "+ CREAR CUENTA"}
                  </button>

                  <p className="hint center">
                    {mode === "login" ? (
                      <>
                        ¿Sin cuenta?{" "}
                        <button
                          type="button"
                          className="ilink"
                          onClick={() => {
                            setMode("register");
                            setErr(null);
                          }}
                          disabled={busy}
                        >
                          CREAR UNA
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Ya tenés cuenta?{" "}
                        <button
                          type="button"
                          className="ilink"
                          onClick={() => {
                            setMode("login");
                            setErr(null);
                          }}
                          disabled={busy}
                        >
                          INICIAR SESIÓN
                        </button>
                      </>
                    )}
                  </p>

                  <p className="hint center muted">
                    Es opcional. Sin login, las stats quedan en este
                    dispositivo.
                  </p>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
