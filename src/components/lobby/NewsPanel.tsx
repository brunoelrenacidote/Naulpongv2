"use client";

import Link from "next/link";

/**
 * Panel derecho del lobby — tarjetas estilo "intel" con info real del
 * juego (cómo se juega + acceso al perfil). Sin eventos / temporadas
 * inventadas; sólo lo que ya está implementado.
 */
export default function NewsPanel() {
  return (
    <aside className="news-panel" aria-label="Intel del operativo">
      <Link href="/about" className="news-card event">
        <span className="news-eyebrow">[ Intel ]</span>
        <h3 className="news-title">Cómo se juega</h3>
        <p className="news-sub">
          Pong 1v1 · primer a 7 puntos · 8 power-ups tácticos.
        </p>
        <span className="news-cta">Ver detalle</span>
      </Link>
      <Link href="/perfil" className="news-card season">
        <span className="news-eyebrow">[ Operador ]</span>
        <h3 className="news-title">Tu perfil</h3>
        <p className="news-sub">
          K.O., poderes activados, victorias y racha — guardado local.
        </p>
        <span className="news-cta">Ver perfil</span>
      </Link>
    </aside>
  );
}
