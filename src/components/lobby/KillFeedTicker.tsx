"use client";

/**
 * Ticker estilo kill-feed/news de Apex pegado al pie de pantalla. Lista
 * de tips/eventos rotando. Decorativo, no captura input.
 */

const ITEMS: readonly { kind: "info" | "warn" | "gold"; text: string }[] = [
  { kind: "info", text: "TIP · Tocá el orbe con la pelota para activar el poder" },
  { kind: "info", text: "TIP · Mantené el dedo en tu mitad del campo para mover" },
  { kind: "info", text: "REGLA · Primer jugador a 7 puntos gana" },
  { kind: "info", text: "MODO · 3 dificultades de bot disponibles" },
  { kind: "info", text: "PRIVADA · Compartí el código de sala para jugar 1v1" },
  { kind: "warn", text: "MATCHMAKING · Cloudflare workers · 30 Hz autoritativo" },
  { kind: "info", text: "POWER-UPS · 8 distintos, equilibrados para 1v1" },
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
