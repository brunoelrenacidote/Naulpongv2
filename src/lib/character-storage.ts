// Stores the user's preferred character (the one shown big on the home lobby
// and used as their default in matches when applicable).
//
// Lives only in localStorage — purely a client-side preference. Auth sync of
// stats is separate (auth-client.ts), and the in-match character pick still
// goes through pickRandomCharacters() unless we wire this in later.

import type { CharacterId } from "./game-types";
import { CHARACTERS, isCharacterId } from "./game-types";

const KEY = "naulpong:character";

/**
 * Lista completa de personajes — incluye los desbloqueables del Luck
 * Royale. Usar `availableCharacters(unlockedItems)` para filtrar a los
 * realmente seleccionables por el usuario actual.
 */
const ALL: CharacterId[] = ["hijo-fiesta", "clavel", "morro-maincraftiano"];

/**
 * Personajes que requieren un drop del Luck Royale (cloud-only) para
 * estar desbloqueados. El id es exactamente el del LUCK_POOL.
 */
export const LOCKED_CHARACTERS: Readonly<Record<CharacterId, string | null>> = {
  "hijo-fiesta": null,
  clavel: null,
  "morro-maincraftiano": "morro-maincraftiano",
};

export const CHARACTER_ORDER: readonly CharacterId[] = ALL;

export function isCharacterUnlocked(
  id: CharacterId,
  unlockedItems: readonly string[],
): boolean {
  const required = LOCKED_CHARACTERS[id];
  if (!required) return true;
  return unlockedItems.includes(required);
}

export function availableCharacters(
  unlockedItems: readonly string[],
): CharacterId[] {
  return ALL.filter((id) => isCharacterUnlocked(id, unlockedItems));
}

export function loadCharacter(): CharacterId {
  if (typeof window === "undefined") return ALL[0];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw && isCharacterId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return ALL[0];
}

export function saveCharacter(id: CharacterId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, id);
    window.dispatchEvent(new CustomEvent("naulpong:character-changed"));
  } catch {
    /* ignore */
  }
}

export function nextCharacter(current: CharacterId, dir: 1 | -1): CharacterId {
  const i = ALL.indexOf(current);
  const len = ALL.length;
  const next = (i + dir + len) % len;
  return ALL[next];
}

export function otherCharacter(current: CharacterId): CharacterId {
  // Devuelve el siguiente personaje base (sin lockear). Solo usado por
  // la lógica de fallback del worker; clientes deben usar `nextCharacter`.
  if (current === "hijo-fiesta") return "clavel";
  return "hijo-fiesta";
}

export function characterMeta(id: CharacterId) {
  return CHARACTERS[id];
}
