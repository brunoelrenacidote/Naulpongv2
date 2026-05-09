"use client";

import { useEffect, useRef, useState } from "react";
import { sfxStart, isSfxOn } from "@/lib/sounds";

interface Props {
  /** Total duration of the splash, in ms (default ~2400ms). */
  duration?: number;
  /** Called when the splash finishes (transition target). */
  onDone: () => void;
}

/**
 * Boot log lines tipo terminal táctica. Cada línea aparece a su
 * `at` (porcentaje del total). La última se queda con el caret blink.
 */
type BootLine = {
  at: number; // 0..1, fracción del duration en la que aparece
  tag: "OK" | "BOOT" | "NET" | "AUTH" | "SYS";
  text: string;
};

const BOOT_LINES: BootLine[] = [
  { at: 0.0, tag: "BOOT", text: "init kernel ./naulpong" },
  { at: 0.12, tag: "OK", text: "loading squad data" },
  { at: 0.28, tag: "NET", text: "connecting servers · sa-east-1" },
  { at: 0.46, tag: "OK", text: "handshake established" },
  { at: 0.62, tag: "AUTH", text: "verifying operator id" },
  { at: 0.78, tag: "OK", text: "deploy package ready" },
  { at: 0.92, tag: "SYS", text: "awaiting drop·" },
];

const TIPS = [
  "Tocá un orbe para activar su poder.",
  "Mantené el dedo en la zona de tu pala para moverla.",
  "El primer jugador en llegar a 7 puntos gana.",
  "Cada modo tiene tres niveles de bot: fácil, medio, difícil.",
  "Compartí el código de sala para jugar con un amigo.",
];

/**
 * Splash táctico estilo Apex Legends / Warzone Mobile. Layout
 * pantalla completa con corner brackets, hex grid sutil, scan beam,
 * boot log staggered y logo glitch. Reemplaza el splash anterior
 * (UdderGames presenta) por algo más consola-de-guerra.
 */
export default function SplashScreen({ duration = 2400, onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [tipIdx, setTipIdx] = useState(() =>
    Math.floor(Math.random() * TIPS.length),
  );
  const startedRef = useRef(false);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const pct = Math.min(100, ((t - start) / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        // Pequeño delay para que se vea el 100% antes de transicionar.
        window.setTimeout(onDone, 260);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onDone]);

  // Tip rotando.
  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  // Sonido al "deploy ready" (~78%).
  useEffect(() => {
    if (startedRef.current) return;
    if (progress < 78) return;
    startedRef.current = true;
    if (isSfxOn()) {
      // sfxStart está protegido por unlockAudio; si no hubo gesto
      // todavía simplemente no suena (no error). Esperado en primer
      // load del browser.
      try { sfxStart(); } catch { /* ignore */ }
    }
  }, [progress]);

  const pctRounded = Math.round(progress);
  const fraction = progress / 100;

  return (
    <div
      className="apex-splash"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      {/* fondo: hex grid + scan beam (puro CSS) */}
      <div className="apex-splash-bg" aria-hidden />
      <div className="apex-splash-scan" aria-hidden />

      {/* corner brackets HUD */}
      <span className="apex-splash-corner tl" aria-hidden />
      <span className="apex-splash-corner tr" aria-hidden />
      <span className="apex-splash-corner bl" aria-hidden />
      <span className="apex-splash-corner br" aria-hidden />

      {/* top bar: publisher tag + version chip */}
      <header className="apex-splash-top">
        <span className="apex-splash-publisher">
          <span className="dot" aria-hidden />
          <span className="lbl">UDDERGAMES // NAULPONG</span>
        </span>
        <span className="apex-splash-version" aria-hidden>
          <span className="lbl">PROD-3.2.1</span>
          <span className="live">
            <span className="pulse" />
            LIVE
          </span>
        </span>
      </header>

      {/* central title block */}
      <main className="apex-splash-stage">
        <span className="apex-splash-eyebrow">[ DROP SEQUENCE INIT ]</span>
        <h1
          className="apex-splash-title"
          data-text="NAULPONG"
          aria-label="NauLPong"
        >
          NAULPONG
        </h1>
        <span className="apex-splash-sub">
          <span className="bar" /> APEX EDGE · SEASON 01 <span className="bar" />
        </span>
      </main>

      {/* boot log + progress + tip */}
      <footer className="apex-splash-foot">
        <ul className="apex-splash-boot" aria-hidden>
          {BOOT_LINES.map((l, i) => {
            const visible = fraction >= l.at;
            const isLast = i === BOOT_LINES.length - 1;
            return (
              <li
                key={i}
                className={`boot-line ${visible ? "is-on" : ""} tag-${l.tag.toLowerCase()}`}
              >
                <span className="boot-tag">[{l.tag}]</span>
                <span className="boot-text">
                  {l.text}
                  {isLast && visible && <span className="caret" />}
                </span>
              </li>
            );
          })}
        </ul>

        <div
          className="apex-splash-progress"
          role="progressbar"
          aria-valuenow={pctRounded}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="track">
            <div className="bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="labels">
            <span className="left">DEPLOY READINESS</span>
            <span className="right">
              {pctRounded.toString().padStart(3, "0")} %
            </span>
          </div>
        </div>

        <p className="apex-splash-tip">
          <span className="prefix">&gt; TIP //</span>
          <span className="msg">{TIPS[tipIdx]}</span>
        </p>
      </footer>

      <span className="apex-splash-bottom-tag" aria-hidden>
        © UDDERGAMES · NAULPONG · APEX EDGE
      </span>
    </div>
  );
}
