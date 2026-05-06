"use client";

import LobbyShell from "@/components/lobby/LobbyShell";

/**
 * Wrapper de compatibilidad. La lógica del lobby vive ahora en
 * `components/lobby/LobbyShell` — mobile-first, landscape, layout en las
 * cuatro esquinas, estilo "UdderGames".
 */
export default function HomeClient() {
  return <LobbyShell />;
}
