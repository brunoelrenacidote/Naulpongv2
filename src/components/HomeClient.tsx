"use client";

import EntryFlow from "@/components/entry/EntryFlow";
import ApexLobbyShell from "@/components/lobby/ApexLobbyShell";

/**
 * Wrapper de compatibilidad. Atraviesa el splash + auth gate y luego
 * monta el lobby principal "Apex Edge" — un HUD táctico inspirado en
 * Apex Legends Mobile / Warzone Mobile, con HTML completamente nuevo
 * (no es solo un re-skin de CSS): SquadID, BattlePass, LegendCard,
 * SquadModePanel, DeployButton y KillFeedTicker.
 */
export default function HomeClient() {
  return (
    <EntryFlow>
      <ApexLobbyShell />
    </EntryFlow>
  );
}
