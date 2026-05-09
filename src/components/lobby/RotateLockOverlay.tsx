"use client";

/**
 * Overlay full-screen que se muestra **sólo en mobile portrait** (CSS
 * media query). Le pide al usuario rotar el dispositivo a horizontal
 * porque toda la UI del lobby + arena está pensada en landscape.
 *
 * Sin JS — un único media query lo muestra/oculta. Si el usuario
 * rota, desaparece automáticamente.
 */
export default function RotateLockOverlay() {
  return (
    <div
      className="rotate-lock"
      role="dialog"
      aria-modal="true"
      aria-label="Rotá tu dispositivo a horizontal"
    >
      <div className="rl-frame">
        <span className="rl-eyebrow">[ NAULPONG · APEX EDGE ]</span>

        <div className="rl-phone" aria-hidden>
          <span className="rl-phone-arrow" />
          <span className="rl-phone-body">
            <span className="rl-phone-screen" />
            <span className="rl-phone-notch" />
          </span>
        </div>

        <h2 className="rl-title">ROTÁ EL DISPOSITIVO</h2>
        <p className="rl-sub">
          La arena 1v1 corre sólo en <strong>landscape</strong>. Girá tu
          teléfono para entrar al lobby.
        </p>

        <div className="rl-tip">
          <span className="rl-dot" />
          <span>TIP · bloqueá la rotación de pantalla en horizontal</span>
        </div>
      </div>
    </div>
  );
}
