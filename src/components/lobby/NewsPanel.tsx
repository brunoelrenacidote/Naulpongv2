"use client";

import Link from "next/link";

/**
 * Panel derecho del lobby — tarjetas tipo "OPERATIVO" y "TEMPORADA"
 * informando del estado del juego. Decorativo en su mayoría: las CTAs
 * llevan a /about.
 */
export default function NewsPanel() {
  return (
    <aside className="news-panel" aria-label="Noticias del operativo">
      <div className="news-card event">
        <span className="news-eyebrow">[ Operativo Activo ]</span>
        <h3 className="news-title">Apex Edge</h3>
        <p className="news-sub">
          8 power-ups tácticos · Server 30Hz · 1v1 ranked
        </p>
        <Link href="/about" className="news-cta">
          Ver intel
        </Link>
      </div>
      <div className="news-card season">
        <span className="news-eyebrow">[ Temporada 01 ]</span>
        <h3 className="news-title">Pong Wars</h3>
        <p className="news-sub">
          Subí de operador, desbloqueá leyendas y mejorá tu rango.
        </p>
        <Link href="/perfil" className="news-cta">
          Ver perfil
        </Link>
      </div>
    </aside>
  );
}
