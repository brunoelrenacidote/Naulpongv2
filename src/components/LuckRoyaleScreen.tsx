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
import { sfxUiClick, hapticTap } from "@/lib/sounds";

const RARITY_LABEL: Record<LuckItemRarity, string> = {
  common: "COMÚN",
  rare: "RARE",
  legendary: "LEGENDARY",
};

const REEL_GLYPHS: readonly string[] = LUCK_POOL.map((it) => it.glyph);
/** Pad para que la tira sea suficientemente larga durante el spin. */
const STRIP_LENGTH = 24;

function makeRandomStrip(): string[] {
  const out: string[] = [];
  for (let i = 0; i < STRIP_LENGTH; i++) {
    out.push(REEL_GLYPHS[i % REEL_GLYPHS.length]);
  }
  return out;
}

function makeLandStrip(finalGlyph: string): string[] {
  // El centro (índice 1) cae en la payline; rellenamos arriba/abajo con
  // glyphs random que sirven de antesala visual.
  const above = REEL_GLYPHS[Math.floor(Math.random() * REEL_GLYPHS.length)];
  const below = REEL_GLYPHS[Math.floor(Math.random() * REEL_GLYPHS.length)];
  return [above, finalGlyph, below];
}

/**
 * Pantalla del Luck Royale (gacha) — casino mini-arcade. Solo accesible
 * para usuarios con cuenta en la nube. Marquee con luces persiguiéndose
 * arriba, slot machine con cromo + 3 reels en el centro, palanca a la
 * derecha (y un botón rojo grande siempre visible). Reveal card debajo
 * y drawer de colección al final.
 */
export default function LuckRoyaleScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [state, setState] = useState<LuckRoyaleState | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [spinErr, setSpinErr] = useState<string | null>(null);
  const [last, setLast] = useState<SpinResult | null>(null);
  const [coins, setCoins] = useState<number[]>([]);

  const revealRef = useRef<HTMLDivElement | null>(null);
  const leverRef = useRef<HTMLButtonElement | null>(null);

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
    sfxUiClick();
    hapticTap();
    setSpinErr(null);
    setSpinning(true);
    setLast(null);
    try {
      const [result] = await Promise.all([
        apiLuckRoyaleSpin(session.token),
        // Espera mínima para que las animaciones de los 3 reels alcancen
        // a lucirse antes del reveal.
        new Promise<void>((r) => setTimeout(r, 1400)),
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

      if (result.item.rarity === "legendary" && !result.duplicate) {
        // Coin shower: render 24 monedas con delay aleatorio.
        const seeds: number[] = [];
        for (let i = 0; i < 24; i++) seeds.push(Math.random());
        setCoins(seeds);
        window.setTimeout(() => setCoins([]), 1600);
      }

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
    <main className="casino-screen" aria-label="Luck Royale Casino">
      <div className="console-bg" aria-hidden />
      <div className="console-scan" aria-hidden />

      <div className="casino-shell">
        {/* === Top status bar === */}
        <header className="casino-statusbar">
          <Link href="/" className="casino-back" aria-label="Volver al lobby">
            ◀ LOBBY
          </Link>
          <div className="casino-counters" role="status">
            {hydrated && session ? (
              <>
                <span
                  className="casino-chip"
                  aria-label={`Boletos disponibles: ${tickets}`}
                >
                  <span aria-hidden>🎟</span>
                  <b>{tickets}</b> BOLETOS
                </span>
                <span
                  className="casino-chip cyan"
                  aria-label={`Items desbloqueados: ${collectedCount} de ${totalCollectibles}`}
                >
                  <span aria-hidden>❖</span>
                  <b>
                    {collectedCount}/{totalCollectibles}
                  </b>{" "}
                  ITEMS
                </span>
              </>
            ) : (
              <span className="casino-chip" aria-hidden>
                <span>OFFLINE</span>
              </span>
            )}
          </div>
        </header>

        {/* === Hero marquee === */}
        <section className="casino-marquee" aria-label="Cabecera del casino">
          <span className="casino-marquee-sub">
            <span className="casino-marquee-flank" aria-hidden>
              ★
            </span>{" "}
            JACKPOT NIGHTS{" "}
            <span className="casino-marquee-flank" aria-hidden>
              ★
            </span>
          </span>
          <h1 className="casino-marquee-title">LUCK ROYALE</h1>
          <span className="casino-marquee-sub">
            5 BOLETOS POR GIRO · MORRO MAINCRAFTIANO 5%
          </span>
        </section>

        {!hydrated ? null : !session ? (
          <NotLoggedPanel />
        ) : loadErr ? (
          <ErrorPanel msg={loadErr} />
        ) : !state ? (
          <LoadingPanel />
        ) : (
          <>
            {/* === Slot machine cabinet === */}
            <section className="casino-cabinet" aria-label="Slot machine">
              <span className="casino-cabinet-stud bl" aria-hidden />
              <span className="casino-cabinet-stud br" aria-hidden />

              <div className="casino-main">
                <div className="casino-screen-frame">
                  <div className="casino-reels" role="img" aria-label="Reels">
                    {coins.length > 0 ? (
                      <div className="casino-coins" aria-hidden>
                        {coins.map((seed, i) => (
                          <span
                            key={i}
                            className="casino-coin"
                            style={{
                              left: `${Math.floor(seed * 92) + 4}%`,
                              animationDelay: `${(seed * 600).toFixed(0)}ms`,
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                    {[0, 1, 2].map((reelIdx) => (
                      <Reel
                        key={reelIdx}
                        idx={reelIdx}
                        spinning={spinning}
                        landedGlyph={last?.item.glyph ?? null}
                      />
                    ))}
                  </div>
                </div>

                <div className="casino-cost-row" aria-live="polite">
                  <span className="casino-cost-label">COSTO POR GIRO</span>
                  <span
                    className={`casino-cost-value ${
                      tickets < spinCost ? "warn" : ""
                    }`}
                  >
                    {spinCost} 🎟 ·{" "}
                    {tickets < spinCost
                      ? "BOLETOS INSUFICIENTES"
                      : `BALANCE ${tickets}`}
                  </span>
                </div>

                <button
                  type="button"
                  className="casino-spin-btn"
                  onClick={spin}
                  disabled={!canSpin}
                  aria-label={
                    spinning
                      ? "Girando reels"
                      : `Tirar slot. Costo ${spinCost} boletos.`
                  }
                >
                  <span className="coin" aria-hidden>
                    🪙
                  </span>
                  {spinning
                    ? "GIRANDO..."
                    : tickets < spinCost
                      ? `BOLETOS INSUFICIENTES`
                      : `TIRAR · ${spinCost} BOLETOS`}
                  <span className="coin" aria-hidden>
                    🪙
                  </span>
                </button>

                {spinErr ? (
                  <p
                    role="alert"
                    style={{
                      color: "#ff9b9b",
                      fontFamily: "var(--font-body, var(--body))",
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      margin: 0,
                    }}
                  >
                    {spinErr}
                  </p>
                ) : null}
              </div>

              {/* === Lever (desktop) === */}
              <div className="casino-lever-col">
                <span className="casino-lever-tag">PALANCA</span>
                <button
                  ref={leverRef}
                  type="button"
                  className={`casino-lever${spinning ? " pulled" : ""}`}
                  onClick={spin}
                  disabled={!canSpin}
                  aria-label={
                    spinning
                      ? "Girando reels (palanca tirada)"
                      : "Tirar la palanca para girar"
                  }
                >
                  <span className="casino-lever-rod" aria-hidden />
                  <span className="casino-lever-knob" aria-hidden />
                  <span className="casino-lever-base" aria-hidden />
                </button>
                <span className="casino-lever-tag">PULL</span>
              </div>
            </section>

            {/* === Reveal card === */}
            <section
              ref={revealRef}
              className={`casino-reveal${
                last ? ` r-${last.item.rarity}` : ""
              }`}
              aria-live="polite"
            >
              {last ? <RevealBody result={last} /> : <RevealEmpty />}
            </section>

            {/* === Collection drawer === */}
            <section
              className="casino-collection"
              aria-label="Tu colección de items"
            >
              <header className="casino-collection-header">
                <h2 className="casino-collection-title">📦 COLECCIÓN</h2>
                <span className="casino-collection-progress">
                  {collectedCount} / {totalCollectibles} desbloqueados
                </span>
              </header>
              <div className="casino-collection-grid">
                {COLLECTIBLE_ITEMS.map((item) => (
                  <CollectionCard
                    key={item.id}
                    item={item}
                    unlocked={unlocked.has(item.id)}
                    flash={
                      last?.item.id === item.id && !last.duplicate
                    }
                  />
                ))}
              </div>
            </section>

            {/* === Footer === */}
            <p className="casino-foot">
              <span>
                Ganás boletos jugando: <b>+1</b> por partida, <b>+1</b> si
                ganás. Cooldown 30s.
              </span>
              <span>
                <Link href="/">▶ JUGAR PARA GANAR BOLETOS</Link>
                {" · "}
                <Link href="/perfil">PERFIL</Link>
              </span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Reel({
  idx,
  spinning,
  landedGlyph,
}: {
  idx: number;
  spinning: boolean;
  landedGlyph: string | null;
}) {
  // Usamos un pivote para forzar re-mount cuando empieza un giro nuevo,
  // así el ::after de aterrizaje se reinicia en cada spin.
  const stripKey = `${spinning ? "spin" : landedGlyph ?? "idle"}-${idx}`;
  const strip = spinning
    ? makeRandomStrip()
    : landedGlyph
      ? makeLandStrip(landedGlyph)
      : makeLandStrip(REEL_GLYPHS[idx % REEL_GLYPHS.length]);

  const cls = spinning
    ? `casino-reel-strip spin spin-${idx}`
    : landedGlyph
      ? `casino-reel-strip land land-${idx}`
      : "casino-reel-strip";

  return (
    <div className="casino-reel" aria-hidden>
      <div key={stripKey} className={cls}>
        {strip.map((g, i) => (
          <span className="casino-reel-cell" key={`${stripKey}-${i}`}>
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}

function RevealBody({ result }: { result: SpinResult }) {
  const isBonus = result.item.type === "bonus";
  const headline = isBonus
    ? `+${result.ticketsRefunded} BOLETOS`
    : result.duplicate
      ? "DUPLICADO"
      : result.item.rarity === "legendary"
        ? "JACKPOT!"
        : "DESBLOQUEADO!";
  return (
    <>
      <span className="casino-reveal-glyph" aria-hidden>
        {result.item.glyph}
      </span>
      <div className="casino-reveal-body">
        <span className="casino-reveal-rarity">
          {RARITY_LABEL[result.item.rarity]}
        </span>
        <span className="casino-reveal-headline">{headline}</span>
        <span className="casino-reveal-name">{result.item.name}</span>
        <span className="casino-reveal-desc">
          {result.duplicate
            ? `Te devolvemos ${result.ticketsRefunded} boletos como rebate.`
            : result.item.description}
        </span>
      </div>
    </>
  );
}

function RevealEmpty() {
  return (
    <span className="casino-reveal-empty">
      <span aria-hidden>⌬</span>
      Tirá la palanca para descubrir tu próximo premio.
    </span>
  );
}

function CollectionCard({
  item,
  unlocked,
  flash,
}: {
  item: LuckItem;
  unlocked: boolean;
  flash: boolean;
}) {
  return (
    <article
      className={`casino-card r-${item.rarity}${
        unlocked ? "" : " locked"
      }${flash ? " flash" : ""}`}
      data-item={item.id}
    >
      <span className="casino-card-rarity">
        {RARITY_LABEL[item.rarity]}
      </span>
      <span className="casino-card-glyph" aria-hidden>
        {unlocked ? item.glyph : "?"}
      </span>
      <span className="casino-card-name">{item.name}</span>
      <span className="casino-card-status">
        {unlocked ? "DESBLOQUEADO" : "BLOQUEADO"}
      </span>
      {!unlocked ? (
        <span className="casino-card-lock" aria-hidden>
          🔒
        </span>
      ) : null}
    </article>
  );
}

function NotLoggedPanel() {
  return (
    <section className="casino-locked" role="alert">
      <span className="casino-locked-glyph" aria-hidden>
        🔒
      </span>
      <h2 className="casino-locked-title">ACCESO RESTRINGIDO</h2>
      <p className="casino-locked-desc">
        El Luck Royale es exclusivo para operadores con cuenta en la nube.
        Iniciá sesión o registrate para que tus boletos e items se guarden
        de forma segura, anti-cheese.
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link href="/login" className="casino-link-btn">
          ▶ INICIAR SESIÓN
        </Link>
        <Link href="/" className="casino-link-btn ghost">
          VOLVER AL LOBBY
        </Link>
      </div>
    </section>
  );
}

function ErrorPanel({ msg }: { msg: string }) {
  return (
    <section className="casino-locked" role="alert">
      <span className="casino-locked-glyph" aria-hidden>
        ⚠
      </span>
      <h2 className="casino-locked-title">ERROR DEL CASINO</h2>
      <p className="casino-locked-desc">{msg}</p>
      <Link href="/" className="casino-link-btn ghost">
        VOLVER AL LOBBY
      </Link>
    </section>
  );
}

function LoadingPanel() {
  return (
    <section className="casino-locked">
      <span className="casino-locked-glyph" aria-hidden>
        ⌛
      </span>
      <h2 className="casino-locked-title">CARGANDO TERMINAL...</h2>
    </section>
  );
}
