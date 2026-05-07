"use client";

import EntryFlow from "@/components/entry/EntryFlow";
import LobbyShell from "@/components/lobby/LobbyShell";

/**
 * Wrapper de compatibilidad. Atraviesa el splash + auth gate de UdderGames
 * y luego monta el lobby principal. La lógica del lobby vive en
 * `components/lobby/LobbyShell`.
 */
export default function HomeClient() {
  return (
    <EntryFlow>
      <LobbyShell />
    </EntryFlow>
  );
}
