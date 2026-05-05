"use client";

import { useEffect, useState } from "react";

const NICK_KEY = "naulpong:nick";
const NICK_MAX = 12;

function sanitize(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 _\-]/g, "")
    .toUpperCase()
    .slice(0, NICK_MAX);
}

/**
 * Modal pantalla-completa pidiendo el nombre la primera vez. Una vez guardado
 * en localStorage, no vuelve a aparecer (se cambia desde Perfil).
 */
export default function Onboarding({
  onDone,
}: {
  onDone: (nick: string) => void;
}) {
  const [needs, setNeeds] = useState<boolean | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem(NICK_KEY) ?? "").trim();
    if (stored) {
      onDone(stored);
      setNeeds(false);
    } else {
      setNeeds(true);
    }
  }, [onDone]);

  if (needs !== true) return null;

  function submit() {
    const clean = sanitize(draft);
    if (clean.length < 2) {
      setError("PONÉ AL MENOS 2 CARACTERES");
      return;
    }
    localStorage.setItem(NICK_KEY, clean);
    onDone(clean);
    setNeeds(false);
  }

  return (
    <div
      className="fs-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
    >
      <div className="fs-modal-card flex flex-col items-stretch gap-4">
        <p
          id="onb-title"
          className="font-press hero-logo shine text-2xl"
        >
          NauLPong
        </p>
        <p className="font-press text-[10px] tracking-[0.3em] text-white/65">
          ¿CÓMO TE LLAMÁS?
        </p>
        <input
          autoFocus
          maxLength={NICK_MAX}
          className="input-arcade text-center"
          placeholder="JUGADOR-1"
          value={draft}
          onChange={(e) => setDraft(sanitize(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          aria-label="Tu nombre"
        />
        {error && (
          <p className="font-press glow-pink text-[9px]">! {error}</p>
        )}
        <button
          className="btn-mega"
          onClick={submit}
          aria-label="Empezar a jugar"
        >
          EMPEZAR
        </button>
      </div>
    </div>
  );
}
