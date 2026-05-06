"use client";

import { useState } from "react";

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
 * Modal compacto para pedir el nick la primera vez. Encaja sobre el lobby
 * sin tomar el viewport entero — el lobby de fondo se ve borroso a través
 * del backdrop, así arrancamos en "el juego" desde el primer segundo.
 */
export default function NickPrompt({ onSubmit }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const clean = sanitize(draft);
    if (clean.length < 2) {
      setError("Mínimo 2 caracteres");
      return;
    }
    localStorage.setItem(NICK_KEY, clean);
    onSubmit(clean);
  }

  return (
    <div className="nick-overlay" role="dialog" aria-modal="true" aria-labelledby="nick-title">
      <div className="nick-card">
        <p id="nick-title" className="nick-title">¡Hola, jugador!</p>
        <p className="nick-sub">¿Cómo querés que te llamemos?</p>
        <input
          autoFocus
          maxLength={NICK_MAX}
          className="nick-input"
          placeholder="Tu nick"
          value={draft}
          onChange={(e) => setDraft(sanitize(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          aria-label="Tu nick"
        />
        {error && <p className="nick-error">{error}</p>}
        <button type="button" className="nick-go" onClick={submit}>
          ENTRAR AL LOBBY
        </button>
        <p className="nick-foot">
          Podés cambiarlo después desde tu perfil.
        </p>
      </div>
    </div>
  );
}
