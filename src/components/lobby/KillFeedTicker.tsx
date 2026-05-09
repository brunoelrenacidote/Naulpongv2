"use client";

/**
 * Ticker estilo kill-feed/news de Apex pegado al pie de pantalla. Lista
 * de tips/eventos rotando. Decorativo, no captura input.
 */

const ITEMS: readonly { kind: "info" | "warn" | "gold"; text: string }[] = [
  { kind: "warn", text: "OPERATIVO 01 — Temporada Apex Edge" },
  { kind: "info", text: "TIP · Tocá el orbe con la pelota para activar el poder" },
  { kind: "gold", text: "EVENTO · Doble XP en Deploy Rápido este finde" },
  { kind: "info", text: "MAPA · Curva extra en Sala Privada modo LAN" },
  { kind: "warn", text: "ALERTA · Servidores Cloudflare 30Hz · ping verde" },
  { kind: "info", text: "TIP · Mantené el dedo en tu mitad del campo para mover" },
  { kind: "gold", text: "DESBLOQUEÁ trofeos jugando el modo VS BOT difícil" },
  { kind: "info", text: "RECORDATORIO · primer jugador a 7 puntos gana" },
];

export default function KillFeedTicker() {
  // Duplicamos para scroll infinito.
  const all = [...ITEMS, ...ITEMS];
  return (
    <div className="feed-ticker" aria-hidden>
      <span className="ft-tag">LIVE</span>
      <div className="feed-track">
        {all.map((it, i) => (
          <span key={i} className={`ft-item ${it.kind === "warn" ? "warn" : it.kind === "gold" ? "gold" : ""}`}>
            <span className="dot" />
            {it.text}
          </span>
        ))}
      </div>
    </div>
  );
}
