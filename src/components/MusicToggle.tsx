"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isMusicOn, setMusicOn } from "@/lib/music";

export default function MusicToggle() {
  const pathname = usePathname() ?? "/";
  const [on, setOn] = useState(false);

  useEffect(() => {
    const initial = isMusicOn();
    setOn(initial);
    if (!initial) return;
    // Browsers require a user gesture to start audio. Listen for first
    // interaction and start music then.
    const onFirstGesture = () => {
      setMusicOn(true);
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setMusicOn(next);
  }

  // En el lobby (/) usamos un control de música embebido en el top-right;
  // este toggle global se oculta para no mostrar dos botones.
  if (pathname === "/") return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Apagar música" : "Encender música"}
      className="font-press fixed right-3 top-3 z-50 select-none rounded border border-white/30 bg-black/60 px-2 py-1 text-[10px] text-white/85 backdrop-blur transition hover:bg-black/80"
      style={{
        textShadow: on ? "0 0 6px #5cffe0" : "0 0 4px #ff5c8a",
        boxShadow: on
          ? "0 0 8px rgba(92,255,224,0.4)"
          : "0 0 8px rgba(255,92,138,0.3)",
        borderColor: on ? "rgba(92,255,224,0.6)" : "rgba(255,92,138,0.6)",
      }}
    >
      {on ? "♪ MÚSICA: ON" : "♪ MÚSICA: OFF"}
    </button>
  );
}
