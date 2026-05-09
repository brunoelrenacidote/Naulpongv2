"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AuthSession,
  loadSession,
} from "@/lib/auth-client";
import {
  apiLuckRoyaleSpin,
  apiLuckRoyaleState,
  type LuckRoyaleState,
  type SpinResult,
} from "@/lib/luck-royale-client";
import {
  COLLECTIBLE_ITEMS,
  LUCK_POOL,
  type LuckItem,
  type LuckItemRarity,
} from "@/lib/luck-royale";
import { saveUnlocked } from "@/lib/unlocked-cache";

const RARITY_LABEL: Record<LuckItemRarity, string> = {
  common: "COMÚN",
  rare: "RARE",
  legendary: "LEGENDARY",
};

/**
 * Pantalla del Luck Royale (gacha) — solo para usuarios con cuenta en
 * la nube. Reusa los tokens de console.css (bezel + hex grid + scan
 * beam + corner brackets + glitch title) que ya tienen `/perfil`,
 * `/about` y `/login`.
 *
 * - Sin sesión: muestra un panel "ACCESS DENIED" con CTA hacia /login.
 * - Con sesión: balance de boletos + grid del pool (collectibles
 *   bloqueados/desbloqueados) + terminal con botón GIRAR y reveal del
 *   último resultado.
 */
export default function LuckRoyaleScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [state, setState] = useState<LuckRoyaleState | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [spinErr, setSpinErr] = useState<string | null>(null);
  const [last, setLast] = useState<SpinResult | null>(null);

  const revealRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHydrated(true);
    setSession(loadSession());
    const onChange = () => setSession(loadSession());
    window.addEventListener("naulpong:auth-changed", onChange);
    return () =>
      window.removeEventListener("naulpong:auth-changed", onChange);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      setState(null);
      return;
    }
    let alive = true;
    apiLuckRoyaleState(session.token)
      .then((s) => {
        if (!alive) return;
        if (s) {
          setState(s);
          saveUnlocked(s.unlockedItems);
        } else setLoadErr("Sesión vencida. Volvé a /login.");
      })
      .catch((e) => {
        if (!alive) return;
        setLoadErr(
          e instanceof Error ? e.message : "Luck Royale no disponible.",
        );
      });
    return () => {
      alive = false;
    };
  }, [hydrated, session]);

  const tickets = state?.tickets ?? 0;
  const spinCost = state?.spinCost ?? 5;
  const unlocked = useMemo(
    () => new Set(state?.unlockedItems ?? []),
    [state?.unlockedItems],
  );
  const collectedCount = COLLECTIBLE_ITEMS.filter((it) =>
    unlocked.has(it.id),
  ).length;
  const totalCollectibles = COLLECTIBLE_ITEMS.length;
  const canSpin = !spinning && state != null && tickets >= spinCost;

  async function spin() {
    if (!session || !canSpin) return;
    setSpinErr(null);
    setSpinning(true);
    setLast(null);
    try {
      // Pequeño delay sintético para que la animación se sienta.
      const [result] = await Promise.all([
        apiLuckRoyaleSpin(session.token),
        new Promise<void>((r) => setTimeout(r, 1100)),
      ]);
      setLast(result);
      setState((prev) =>
        prev
          ? {
              ...prev,
              tickets: result.newTickets,
              unlockedItems: result.unlockedItems,
            }
          : prev,
      );
      saveUnlocked(result.unlockedItems);
      // Scroll suave al reveal en mobile landscape.
      requestAnimationFrame(() => {
        revealRef.current?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      });
    } catch (e) {
      setSpinErr(e instanceof Error ? e.message : "Falló el giro.");
    } finally {
      setSpinning(false);
    }
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
            <span>OPERATOR · LUCK ROYALE</span>
            <span className="dot green" />
          </span>
          {hydrated && session ? (
            <span
              className="chip gold"
              aria-label={`Boletos disponibles: ${tickets}`}
            >
              <span aria-hidden>🎟</span>
              <span>{tickets} BOLETOS</span>
            </span>
          ) : null}
        </header>

        <section className="console-hero">
          <span className="console-eyebrow">
            [ LUCK ROYALE // SECCIÓN 03 ]
          </span>
          <h1 className="console-title" data-text="LUCK ROYALE">
            LUCK ROYALE
          </h1>
          <p className="console-subtitle">
            {hydrated && session ? (
              <>
                Tirá boletos al gacha y desbloqueá a{" "}
                <b>MORRO MAINCRAFTIANO</b>, skins de paleta y trails de
                pelota. Cada giro cuesta <b>{spinCost}</b>.
              </>
            ) : (
              <>
                Acceso exclusivo para operadores con cuenta en la nube.
                Iniciá sesión para empezar a coleccionar.
              </>
            )}
          </p>
        </section>

        {!hydrated ? null : !session ? (
          <NotLoggedPanel />
        ) : loadErr ? (
          <ErrorPanel msg={loadErr} />
        ) : !state ? (
          <LoadingPanel />
        ) : (
          <div className="console-grid grid-luck">
            {/* COL 1 — pool / inventario */}
            <div className="console-col">
              <section className="console-panel accent-purple">
                <span className="console-panel-tag">{"// COLLECTION"}</span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />
                <h2 className="console-panel-title">
                  <span className="glyph">⚙</span>
                  POOL · {collectedCount}/{totalCollectibles}
                </h2>
                <div className="luck-grid">
                  {COLLECTIBLE_ITEMS.map((item) => (
                    <LuckCard
                      key={item.id}
                      item={item}
                      unlocked={unlocked.has(item.id)}
                      highlighted={
                        last?.item.id === item.id && !last.duplicate
                      }
                    />
                  ))}
                </div>
                <p className="luck-fineprint">
                  · El pool incluye además bonificaciones de boletos
                  como consolation prize.
                </p>
              </section>
            </div>

            {/* COL 2 — terminal de giro */}
            <div className="console-col">
              <section className="console-panel accent-gold flex">
                <span className="console-panel-tag">
                  {"// SPIN TERMINAL"}
                </span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />

                <div className="luck-tickets">
                  <span className="luck-tickets-label">BOLETOS</span>
                  <span
                    className={`luck-tickets-value ${
                      tickets < spinCost ? "low" : ""
                    }`}
                    aria-live="polite"
                  >
                    {tickets}
                  </span>
                  <span className="luck-tickets-cost">
                    Costo por giro: <b>{spinCost}</b>
                  </span>
                </div>

                <div
                  ref={revealRef}
                  className={`luck-reveal ${
                    spinning ? "spinning" : ""
                  } ${last ? `r-${last.item.rarity}` : ""}`}
                  aria-live="polite"
                >
                  {spinning ? (
                    <SpinAnimation />
                  ) : last ? (
                    <RevealCard result={last} />
                  ) : (
                    <span className="luck-reveal-empty">
                      <span className="glyph">⌬</span>
                      Tu próximo giro aparecerá acá.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="console-btn cyan big full"
                  onClick={spin}
                  disabled={!canSpin}
                >
                  {spinning
                    ? "GIRANDO..."
                    : tickets < spinCost
                      ? `BOLETOS INSUFICIENTES (${spinCost})`
                      : `▶ GIRAR · ${spinCost} BOLETOS`}
                </button>

                <div className="console-form-status">
                  {spinErr ? (
                    <p className="status err" role="alert">
                      <span className="badge">!</span>
                      {spinErr}
                    </p>
                  ) : null}
                </div>

                <p className="hint center muted">
                  Ganás boletos jugando: <b>+1</b> por partida,{" "}
                  <b>+1 extra</b> si ganás. Cooldown server-side de 30s
                  entre créditos.
                </p>
              </section>

              <section className="console-panel accent-cyan">
                <span className="console-panel-tag">{"// LINKS"}</span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />
                <div className="login-active-actions">
                  <Link href="/" className="console-btn cyan full">
                    ▶ JUGAR PARA GANAR BOLETOS
                  </Link>
                  <Link href="/perfil" className="console-btn full">
                    PERFIL
                  </Link>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function LuckCard({
  item,
  unlocked,
  highlighted,
}: {
  item: LuckItem;
  unlocked: boolean;
  highlighted: boolean;
}) {
  return (
    <article
      className={`luck-card r-${item.rarity} ${
        unlocked ? "owned" : "locked"
      } ${highlighted ? "flash" : ""}`}
      data-item={item.id}
    >
      <span className="luck-card-rarity">{RARITY_LABEL[item.rarity]}</span>
      <span className="luck-card-glyph" aria-hidden>
        {unlocked ? item.glyph : "?"}
      </span>
      <span className="luck-card-name">{item.name}</span>
      <span className="luck-card-desc">
        {unlocked ? item.description : "DESBLOQUEAR · gira en el terminal"}
      </span>
      {!unlocked ? (
        <span className="luck-card-lock" aria-hidden>
          🔒
        </span>
      ) : null}
    </article>
  );
}

function RevealCard({ result }: { result: SpinResult }) {
  const isBonus = result.item.type === "bonus";
  const headline = isBonus
    ? `+${result.ticketsRefunded} BOLETOS`
    : result.duplicate
      ? "DUPLICADO"
      : "DESBLOQUEADO";
  return (
    <div className={`luck-reveal-card r-${result.item.rarity}`}>
      <span className="luck-reveal-rarity">
        {RARITY_LABEL[result.item.rarity]}
      </span>
      <span className="luck-reveal-glyph" aria-hidden>
        {result.item.glyph}
      </span>
      <span className="luck-reveal-name">{result.item.name}</span>
      <span className="luck-reveal-headline">{headline}</span>
      {result.duplicate ? (
        <span className="luck-reveal-sub">
          Te devolvemos {result.ticketsRefunded} boletos como rebate.
        </span>
      ) : isBonus ? (
        <span className="luck-reveal-sub">{result.item.description}</span>
      ) : (
        <span className="luck-reveal-sub">{result.item.description}</span>
      )}
    </div>
  );
}

function SpinAnimation() {
  // Reel pseudo-random visual: tres columnas con glyphs del pool rotando.
  const reels = [LUCK_POOL.map((i) => i.glyph), LUCK_POOL.map((i) => i.glyph), LUCK_POOL.map((i) => i.glyph)];
  return (
    <div className="luck-spin-reel" aria-hidden>
      {reels.map((glyphs, ri) => (
        <div className={`reel reel-${ri}`} key={ri}>
          <div className="reel-strip">
            {glyphs.concat(glyphs).map((g, i) => (
              <span className="reel-glyph" key={`${ri}-${i}`}>
                {g}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotLoggedPanel() {
  return (
    <section className="console-panel accent-orange">
      <span className="console-panel-tag">{"// ACCESS DENIED"}</span>
      <span className="console-panel-bracket tl" aria-hidden />
      <span className="console-panel-bracket tr" aria-hidden />
      <span className="console-panel-bracket bl" aria-hidden />
      <span className="console-panel-bracket br" aria-hidden />
      <h2 className="console-panel-title">
        <span className="glyph">!</span>
        OPERATOR REQUIRED
      </h2>
      <p className="console-prose">
        El Luck Royale es exclusivo para cuentas en la nube. Iniciá
        sesión o registrate para que tus boletos e items se guarden de
        forma segura, anti-cheese.
      </p>
      <div className="login-active-actions">
        <Link href="/login" className="console-btn cyan big full">
          ▶ INICIAR SESIÓN
        </Link>
        <Link href="/" className="console-btn full">
          VOLVER AL LOBBY
        </Link>
      </div>
    </section>
  );
}

function ErrorPanel({ msg }: { msg: string }) {
  return (
    <section className="console-panel accent-orange">
      <span className="console-panel-tag">{"// ERROR"}</span>
      <span className="console-panel-bracket tl" aria-hidden />
      <span className="console-panel-bracket tr" aria-hidden />
      <span className="console-panel-bracket bl" aria-hidden />
      <span className="console-panel-bracket br" aria-hidden />
      <p className="console-prose" role="alert">
        <span className="hl-red">ERROR:</span> {msg}
      </p>
    </section>
  );
}

function LoadingPanel() {
  return (
    <section className="console-panel accent-cyan">
      <span className="console-panel-tag">{"// LOADING"}</span>
      <span className="console-panel-bracket tl" aria-hidden />
      <span className="console-panel-bracket tr" aria-hidden />
      <span className="console-panel-bracket bl" aria-hidden />
      <span className="console-panel-bracket br" aria-hidden />
      <p className="console-prose">CARGANDO TERMINAL...</p>
    </section>
  );
}
