"use client";

import { useMemo } from "react";

/**
 * Capa decorativa de fondo del lobby Apex. Sólo cosa visual, sin estado:
 *
 *  - Hex grid con pulso
 *  - Glows de esquina (azul arriba-izq + naranja abajo-der)
 *  - Beam de scanner que atraviesa la pantalla
 *  - Field de partículas triangulares animadas
 *  - Scanlines + ruido sutil + viñeta
 *
 * Pensado para ser z-index 0 dentro del shell. No captura pointer.
 */
export default function TacticalBackdrop() {
  // Generamos posiciones random pero estables (memo) para los triángulos.
  const tris = useMemo(() => {
    const list: Array<{ left: number; delay: number; dur: number; size: number }> = [];
    for (let i = 0; i < 22; i++) {
      list.push({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        dur: 5 + Math.random() * 6,
        size: 0.6 + Math.random() * 1.1,
      });
    }
    return list;
  }, []);

  return (
    <div className="apex-backdrop" aria-hidden>
      <div className="apex-corner-glow tl" />
      <div className="apex-corner-glow br" />
      <div className="apex-hex-grid" />
      <div className="apex-scan-beam" />
      <div className="apex-tri-field">
        {tris.map((t, i) => (
          <span
            key={i}
            className="apex-tri"
            style={{
              left: `${t.left}%`,
              bottom: `-12px`,
              animationDelay: `${t.delay}s`,
              animationDuration: `${t.dur}s`,
              transform: `scale(${t.size})`,
            }}
          />
        ))}
      </div>
      <div className="apex-noise" />
      <div className="apex-scanlines" />
      <div className="apex-vignette" />
    </div>
  );
}
