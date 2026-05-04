// Phrases that pop up over a character at key game moments.
// Each event picks one phrase at random.

import type { CharacterId } from "./game-types";

export type TauntEvent = "goal" | "takeGoal" | "win" | "lose";

const TAUNTS: Record<CharacterId, Record<TauntEvent, string[]>> = {
  "hijo-fiesta": {
    goal: [
      "TOMÁ PIBE",
      "SE VA AL ÁNGULO",
      "FIESTA TERMINADA",
      "ANDÁ A LLAMAR A TU PAPÁ",
      "ESTO ES UN CAMPING",
      "DALE QUE LLEGO TARDE",
    ],
    takeGoal: [
      "PERO LA RE...",
      "LO DEJÉ ENTRAR",
      "ESTOY CANSADO",
      "ESTABA POR IRME",
      "LE DIJE QUE NO TARDE",
    ],
    win: [
      "AHORA SÍ, A BUSCARLO",
      "PARTIDO Y ME RAJO",
      "MI MUJER NO ME VA A CREER",
      "GANÉ, PIBE — VAMOS",
    ],
    lose: [
      "BUENO, OTRO TAXI",
      "ME VAN A MATAR",
      "MAÑANA HABLO CON LA MADRE",
      "ESTOY VIEJO PARA ESTO",
    ],
  },
  "clavel": {
    goal: [
      "EL CLAVEL ES ETERNO",
      "JEJEJE",
      "GOLAZO PAPÁ",
      "AL CLAVEL NO LO PARA NADIE",
      "ROCK & ROLL",
      "ASÍ SE JUEGA",
    ],
    takeGoal: [
      "QUÉ VERGÜENZA",
      "SE ME ESCAPÓ",
      "TUVISTE SUERTE",
      "EL CLAVEL DESCANSA",
      "ANDÁ AL PSICÓLOGO",
    ],
    win: [
      "EL CLAVEL CAMPEÓN",
      "MI ÉPOCA",
      "ESTABA TODO PLANEADO",
      "SE VAN MIENTRAS YO LLEGO",
    ],
    lose: [
      "ESTO NO TERMINA ACÁ",
      "TE VOY A AGARRAR",
      "REVANCHA YA",
      "EL CLAVEL VUELVE",
    ],
  },
};

export function pickTaunt(id: CharacterId, event: TauntEvent): string {
  const list = TAUNTS[id][event];
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
}
