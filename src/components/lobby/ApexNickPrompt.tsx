"use client";

import { useState } from "react";
import { sfxDeploy, hapticTap } from "@/lib/sounds";

const NICK_KEY = "naulpong:nick";
const NICK_MAX = 12;

function sanitize(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 _\-]/g, "")
    .toUpperCase()
    .slice(0, NICK_MAX);
}

interface Props {
  onSubmit: (nick: string) => void;
}

/**
 * Prompt táctico para registrar codename. Misma función que el original
 * NickPrompt pero con la skin Apex (clip diagonal + acento naranja +
 * eyebrow tipo "REGISTRO DE OPERADOR").
 */
export default function ApexNickPrompt({ onSubmit }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const clean = sanitize(draft);
    if (clean.length < 2) {
      setError("Mínimo 2 caracteres");
      return;
    }
    sfxDeploy();
    hapticTap();
    localStorage.setItem(NICK_KEY, clean);
    onSubmit(clean);
  }

  return (
    <div
      className="apex-nick-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apex-nick-title"
    >
      <div className="apex-nick-card">
        <p className="apex-nick-eyebrow">[ Registro de operador ]</p>
        <p id="apex-nick-title" className="apex-nick-title">
          Identificate, soldado
        </p>
        <p className="apex-nick-sub">
          Asigná tu codename. Será tu nick en el ranking y en cada partida.
        </p>
        <input
          autoFocus
          maxLength={NICK_MAX}
          className="apex-input"
          placeholder="CODENAME"
          value={draft}
          onChange={(e) => setDraft(sanitize(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          aria-label="Tu codename"
        />
        {error && <p className="apex-error">{error}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="apex-btn go"
            style={{ flex: 1 }}
            onClick={submit}
          >
            ▶ ENTRAR AL ROSTER
          </button>
        </div>
        <p className="apex-nick-foot">[ Podés cambiarlo desde tu perfil ]</p>
      </div>
    </div>
  );
}
