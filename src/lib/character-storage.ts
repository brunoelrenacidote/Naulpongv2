// Stores the user's preferred character (the one shown big on the home lobby
// and used as their default in matches when applicable).
//
// Lives only in localStorage — purely a client-side preference. Auth sync of
// stats is separate (auth-client.ts), and the in-match character pick still
// goes through pickRandomCharacters() unless we wire this in later.

import type { CharacterId } from "./game-types";
import { CHARACTERS } from "./game-types";

const KEY = "naulpong:character";
const ALL: CharacterId[] = ["hijo-fiesta", "clavel"];

export const CHARACTER_ORDER: readonly CharacterId[] = ALL;

export function loadCharacter(): CharacterId {
  if (typeof window === "undefined") return ALL[0];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw && (raw === "hijo-fiesta" || raw === "clavel")) {
      return raw as CharacterId;
    }
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
  return current === "hijo-fiesta" ? "clavel" : "hijo-fiesta";
}

export function characterMeta(id: CharacterId) {
  return CHARACTERS[id];
}
