"use client";

import { sfxDeploy, hapticDeploy } from "@/lib/sounds";
import type { ModeDef } from "./SquadModePanel";
import { IconDropPod } from "./tactical-icons";

interface Props {
  mode: ModeDef;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * CTA enorme estilo "DEPLOY" de Apex. Polígono diagonal, fondo táctico
 * naranja, lights pulsantes a la derecha tipo countdown de drop pod.
 * SFX táctico + haptic medio al disparar.
 */
export default function DeployButton({ mode, onClick, disabled }: Props) {
  function handle() {
    if (disabled) return;
    sfxDeploy();
    hapticDeploy();
    onClick();
  }
  return (
    <button
      type="button"
      className="deploy-cta"
      onClick={handle}
      disabled={disabled}
      aria-label={`Iniciar ${mode.title}`}
      style={{ ["--d-color" as string]: mode.color }}
    >
      <span className="d-glyph" aria-hidden>
        <IconDropPod size={22} />
      </span>
      <span className="d-text">
        <span className="d-eyebrow">[ DEPLOY · 1v1 ]</span>
        <span className="d-label">DEPLOY</span>
        <span className="d-mode">{mode.title}</span>
      </span>
      <span className="d-lights" aria-hidden>
        <span className="d-light" />
        <span className="d-light" />
        <span className="d-light" />
      </span>
    </button>
  );
}
