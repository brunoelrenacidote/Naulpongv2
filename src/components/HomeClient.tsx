"use client";

import { useEffect, useState } from "react";
import HomeActions from "@/components/HomeActions";
import Onboarding from "@/components/Onboarding";
import HeroStage from "@/components/HeroStage";
import TopBar from "@/components/TopBar";
import Sidekick from "@/components/Sidekick";

const NICK_KEY = "naulpong:nick";

/**
 * Lobby principal estilo Brawl Stars:
 *  - Top bar con avatar + monedas + trofeos.
 *  - Hero stage con personaje grande animado y flechas para cambiarlo.
 *  - Sidekick con bocadillo de tips rotando.
 *  - Mode carousel + botón PLAY gigante (dentro de HomeActions).
 *
 * El nombre del jugador lo resuelve Onboarding (modal full-screen) la primera
 * vez y queda en localStorage. Si vuelve sin nick, el modal aparece.
 */
export default function HomeClient() {
  const [nick, setNick] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setNick((window.localStorage.getItem(NICK_KEY) ?? "").toUpperCase());
  }, []);

  return (
    <main className="lobby app-screen has-bottom-nav safe-pt relative z-10 mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-3 sm:px-6 sm:pt-4">
      <Onboarding onDone={(n) => setNick(n)} />

      <TopBar nick={nick} />

      <HeroStage />

      <Sidekick />

      <HomeActions nick={nick} />
    </main>
  );
}
