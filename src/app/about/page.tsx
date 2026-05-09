import Link from "next/link";
import RotateLockOverlay from "@/components/lobby/RotateLockOverlay";
import { POWER_EMOJIS, POWER_IDS, POWER_LABELS, type PowerId } from "@/lib/game-types";
import { IconBolt, IconStar } from "@/components/lobby/icons";

export const metadata = {
  title: "Cómo se juega — NauLPong",
};

const POWER_DESCS: Record<PowerId, string> = {
  slowmo: "La pelota se ralentiza por 4 segundos.",
  paddleXL: "Tu paleta crece al doble por 5 segundos.",
  paddleMini: "La paleta del rival se achica a la mitad por 5s.",
  turbo: "La pelota acelera +50% hasta el próximo gol.",
  shield: "Bloquea automáticamente el próximo gol en contra.",
  freeze: "La paleta del rival se congela por 2 segundos.",
  curve: "La pelota se mueve en zig-zag por 5 segundos.",
  invert: "Los controles del rival se invierten por 4s.",
};

export default function About() {
  return (
    <>
      <RotateLockOverlay />
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
              <span>MANUAL · v3.2.1</span>
              <span className="dot green" />
            </span>
          </header>

          <section className="console-hero">
            <span className="console-eyebrow">[ FIELD MANUAL // SECCIÓN 01 ]</span>
            <h1 className="console-title" data-text="CÓMO SE JUEGA">
              CÓMO SE JUEGA
            </h1>
            <p className="console-subtitle">
              Pong 1v1 con poderes random en la cancha. Primero a{" "}
              <b>7 puntos</b> gana.
            </p>
          </section>

          <div className="console-grid grid-about">
            {/* COLUMNA 1: briefing + controles + modos */}
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
                  BRIEFING
                </h2>
                <div className="console-prose">
                  <p>
                    Cuando la pelota toca un orbe, el último jugador que la tocó
                    se queda con el efecto.
                  </p>
                  <p>
                    Cada partida asigna random a{" "}
                    <span className="hl-cyan">El wey que va por su hijo</span> y{" "}
                    <span className="hl-orange">El Clavel</span>. Sin elegir —
                    el destino tira los dados.
                  </p>
                </div>
              </section>

              <section
                className="console-panel accent-gold"
                style={{ animationDelay: "260ms" } as React.CSSProperties}
              >
                <span className="console-panel-tag">{"// CONTROLES"}</span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />
                <h2 className="console-panel-title">
                  <span className="glyph">⚙</span>
                  INPUT BINDS
                </h2>
                <ul className="console-bullet-list">
                  <li>
                    <b>PC:</b> <span className="console-kbd">↑</span>
                    <span className="console-kbd">↓</span> o{" "}
                    <span className="console-kbd">W</span>
                    <span className="console-kbd">S</span>
                  </li>
                  <li>
                    <b>Mobile:</b> dedo en la mitad superior/inferior
                  </li>
                  <li>
                    <b>Tip:</b> la paleta sigue tu dedo en tiempo real
                  </li>
                </ul>
              </section>

              <section
                className="console-panel accent-purple flex"
                style={{ animationDelay: "340ms" } as React.CSSProperties}
              >
                <span className="console-panel-tag">{"// MODOS"}</span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />
                <h2 className="console-panel-title">
                  <span className="glyph">▶</span>
                  DROP TYPES
                </h2>
                <ul className="console-bullet-list">
                  <li>
                    <b>
                      <IconBolt size={12} /> Rápida
                    </b>{" "}— emparejamos contra random
                  </li>
                  <li>
                    <b>🎮 Crear Sala</b> — código de 4 letras
                  </li>
                  <li>
                    <b>🔑 Código</b> — entrás directo a la sala de un amigo
                  </li>
                </ul>
              </section>
            </div>

            {/* COLUMNA 2: 8 poderes */}
            <div className="console-col">
              <section
                className="console-panel accent-orange flex"
                style={{ animationDelay: "220ms" } as React.CSSProperties}
              >
                <span className="console-panel-tag">{"// LOADOUT"}</span>
                <span className="console-panel-bracket tl" aria-hidden />
                <span className="console-panel-bracket tr" aria-hidden />
                <span className="console-panel-bracket bl" aria-hidden />
                <span className="console-panel-bracket br" aria-hidden />
                <h2 className="console-panel-title">
                  <span className="glyph">
                    <IconStar size={14} />
                  </span>
                  LOS 8 PODERES
                  <span className="count">{POWER_IDS.length}/8</span>
                </h2>
                <div className="console-panel-body">
                  <div className="console-power-grid">
                    {POWER_IDS.map((id, i) => (
                      <article
                        key={id}
                        className="console-power-row"
                        style={
                          { "--delay": `${200 + i * 50}ms` } as React.CSSProperties
                        }
                      >
                        <span className="emoji" aria-hidden>
                          {POWER_EMOJIS[id]}
                        </span>
                        <span className="label-block">
                          <span className="pname">{POWER_LABELS[id]}</span>
                          <span className="ptext">{POWER_DESCS[id]}</span>
                        </span>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
