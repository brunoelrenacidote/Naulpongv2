"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Milk } from "lucide-react";

interface Props {
  /** Total duration of the splash, in ms (default ~2400ms). */
  duration?: number;
  /** Called when the splash finishes (transition target). */
  onDone: () => void;
}

const TIPS = [
  "Tocá un orbe para activar su poder.",
  "Mantené el dedo en la zona de tu pala para moverla.",
  "El primer jugador en llegar a 7 puntos gana.",
  "Cada modo tiene tres niveles de bot: fácil, medio, difícil.",
  "Compartí el código de sala para jugar con un amigo.",
];

/**
 * Pantalla de carga estilo Free Fire / Brawl. Muestra el sello UdderGames,
 * el título del juego, una barra de progreso y un tip rotando, durante
 * `duration` ms y luego llama `onDone`.
 */
export default function SplashScreen({ duration = 2400, onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [tipIdx, setTipIdx] = useState(() =>
    Math.floor(Math.random() * TIPS.length),
  );

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const pct = Math.min(100, ((t - start) / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        // Pequeño delay para que se vea el 100%.
        window.setTimeout(onDone, 220);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onDone]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="entry-splash" aria-busy="true" aria-live="polite">
      <div className="entry-publisher">
        <span className="entry-publisher-tag">UdderGames presenta</span>
        <div className="entry-publisher-logo">
          <span className="mark" aria-hidden>
            <Milk />
          </span>
          UdderGames
        </div>
      </div>

      <div className="entry-game">
        <h1 className="entry-game-title">NauLPong</h1>
        <p className="entry-game-sub">Pong 1v1 con poderes</p>
      </div>

      <div className="entry-loader" aria-label="Cargando juego">
        <div className="entry-loader-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="entry-loader-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="entry-loader-meta">
          <span className="tip">
            <Lightbulb aria-hidden focusable="false" />
            {TIPS[tipIdx]}
          </span>
          <span aria-hidden>{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="entry-stage-foot" aria-hidden>
        © UdderGames · NauLPong
      </div>
    </div>
  );
}
