"use client";

import EntryFlow from "@/components/entry/EntryFlow";
import ApexLobbyShell from "@/components/lobby/ApexLobbyShell";
import RotateLockOverlay from "@/components/lobby/RotateLockOverlay";

/**
 * Wrapper de compatibilidad. Atraviesa el splash + auth gate y luego
 * monta el lobby principal "Apex Edge" — un HUD táctico inspirado en
 * Apex Legends Mobile / Warzone Mobile, con HTML completamente nuevo
 * (no es solo un re-skin de CSS): SquadID, BattlePass, LegendCard,
 * SquadModePanel, DeployButton y KillFeedTicker.
 *
 * El RotateLockOverlay aparece en mobile portrait (puro CSS — nada de
 * JS), bloqueando splash + auth-gate + lobby hasta que el usuario rote
 * el dispositivo a horizontal. La app se diseñó sólo para landscape.
 */
export default function HomeClient() {
  return (
    <>
      <RotateLockOverlay />
      <EntryFlow>
        <ApexLobbyShell />
      </EntryFlow>
    </>
  );
}
