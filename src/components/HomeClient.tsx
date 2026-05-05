"use client";

import { useState } from "react";
import HomeActions from "@/components/HomeActions";
import Onboarding from "@/components/Onboarding";
import TrophyShowcase from "@/components/TrophyShowcase";
import CharacterPreview from "@/components/CharacterPreview";

/**
 * Home como pantalla de juego: logo, vitrina de trofeos, selector de modos.
 * Sin formularios, sin "subtítulos web". El nombre del jugador se resuelve
 * con Onboarding (modal full-screen) la primera vez y queda en localStorage.
 */
export default function HomeClient() {
  const [nick, setNick] = useState<string | null>(null);

  return (
    <main className="app-screen has-bottom-nav safe-pt relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-5 px-4 pt-4 sm:gap-6 sm:px-6 sm:pt-6">
      <Onboarding onDone={(n) => setNick(n)} />

      <header className="flex w-full flex-col items-center gap-1">
        <h1 className="hero-logo shine text-[42px] sm:text-5xl">
          NauLPong
        </h1>
        <div className="mt-1 flex items-center gap-4">
          <CharacterPreview id="hijo-fiesta" scale={2} glow="#5cffc8" />
          <span className="font-press text-[10px] tracking-[0.3em] text-white/40">
            VS
          </span>
          <CharacterPreview id="clavel" scale={2} glow="#ff5c8a" />
        </div>
      </header>

      <TrophyShowcase />

      <HomeActions nick={nick ?? ""} />
    </main>
  );
}
