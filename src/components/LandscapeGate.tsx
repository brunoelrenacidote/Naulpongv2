"use client";

import { ReactNode, useEffect, useState } from "react";

/**
 * Envuelve la pantalla de juego forzando orientación landscape:
 *  - Pide fullscreen + screen.orientation.lock("landscape") tras el primer
 *    gesto del usuario (tap en "TOCÁ PARA EMPEZAR").
 *  - Si el dispositivo está en portrait y el lock no funciona (iOS Safari, etc.),
 *    muestra un overlay "rotá el celu" hasta que el usuario rote.
 *  - En desktop / pantallas grandes no hace nada.
 */
export default function LandscapeGate({ children }: { children: ReactNode }) {
  const [armed, setArmed] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "landscape",
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setOrientation(h > w ? "portrait" : "landscape");
      // Tratar como "mobile" cualquier viewport con menor lado <= 540px.
      // Eso cubre teléfonos (incluso landscape) sin tocar tablets/PC.
      const minSide = Math.min(w, h);
      setIsMobile(minSide <= 540 || /Mobi|Android|iPhone/i.test(navigator.userAgent));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  async function arm() {
    setArmed(true);
    if (typeof document === "undefined") return;
    try {
      const el = document.documentElement;
      if (el.requestFullscreen && !document.fullscreenElement) {
        await el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      }
    } catch {
      /* swallow */
    }
    try {
      // screen.orientation.lock no es estándar en TS pero existe en Chrome/Android.
      const so = (
        window.screen as unknown as {
          orientation?: { lock?: (o: string) => Promise<void> };
        }
      ).orientation;
      await so?.lock?.("landscape").catch(() => {});
    } catch {
      /* swallow */
    }
  }

  // Desktop/tablet: render directo.
  if (!isMobile) return <>{children}</>;

  // Antes del primer gesto: pantalla de "tocá para empezar".
  if (!armed) {
    return (
      <div className="fs-modal" onClick={arm} role="button" tabIndex={0}>
        <div className="fs-modal-card flex flex-col items-center gap-4">
          <p className="hero-logo shine text-2xl">NauLPong</p>
          <p className="rotate-icon" aria-hidden>
            📱
          </p>
          <p className="font-press text-[10px] tracking-[0.25em] text-white/70">
            TOCÁ PARA ENTRAR
          </p>
          <p className="font-vt text-base text-white/55">
            (Se abre en pantalla completa y horizontal)
          </p>
        </div>
      </div>
    );
  }

  // Ya armado pero todavía en portrait: pedir rotar.
  if (orientation === "portrait") {
    return (
      <div className="rotate-overlay" role="alert">
        <div className="rotate-icon" aria-hidden>
          📱
        </div>
        <p className="hero-logo text-xl">ROTÁ EL CELU</p>
        <p className="font-vt text-base text-white/70">
          Esto se juega en horizontal.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
