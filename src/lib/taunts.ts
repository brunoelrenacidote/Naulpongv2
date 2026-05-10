// Phrases that pop up over a character at key game moments.
// Each event picks one phrase at random.

import type { CharacterId } from "./game-types";

export type TauntEvent = "goal" | "takeGoal" | "win" | "lose";

const TAUNTS: Record<CharacterId, Record<TauntEvent, string[]>> = {
  "hijo-fiesta": {
    goal: [
      "JE JE JE JE",
      "Esto es como la musica de mis tiempos..",
      "Plutarquito mira esto!",
      "Facil",
      "Deberias escuchar la musica de mis tiempos.",
      "Plutarquito es mejor",
    ],
    takeGoal: [
      "Je..",
      "Juegas como Cindy",
      "Plutarco de distrajo!",
      "Hoy no es el dia del niño!",
      "Hoy no me la pellizque..",
    ],
    win: [
      "Pondre buena musica",
      "Plutarquito ya vamonos!",
      "Señor Beto siempre gana",
    ],
    lose: [
      "Mejor sigo esperando a Plutarquito",
      "No me la pellizque hoy",
      "Me hechare a tu madre, Clavel",
      "Es la edad hijo..",
    ],
  },
  "clavel": {
    goal: [
      "Hoy es mi dia!",
      "Lo que tengo de altura lo tienes de bueno!",
      "Pen-De-Jo",
      "Nose que es peor, si mi olor a mierda o tu! 🤣",
      "Me siento grande!",
    ],
    takeGoal: [
      "Pen-De-Jo",
      "Peor que cuando me fueron infiel",
      "Juanito hechame una mano",
      "Yo solo juego futbol",
      "Hoy no es mi dia!",
    ],
    win: [
      "Nose que es peor, si mi olor a mierda o tu!",
      "Soy pequeño pero mas grande que tu!",
      "Pen-De-Jo x 1000",
      "Eso de que Jjunito me haiga bajado la novia ya ni me duele!",
    ],
    lose: [
      "Ire a migajear mejor...",
      "Pen-De-Joooo",
      "El Morro",
      "Ire a cagar",
    ],
  },
  "morro-maincraftiano": {
    goal: [
      "Facilito..",
      "La pelota es como mi cabeza, cuadrada.",
      "Scrollea!",
      "Mis balas te ganan",
      "Eres una foid",
      "Vivan las ubres",
      "Un Lechazo de GOL!",
    ],
    takeGoal: [
      "Soy un incel..",
      "Maldito Normie",
      "Eres un larp",
      "Y esas balas?",
      "Eres un Sub5 como el clavel.",
    ],
    win: [
      "GG",
      "Ve a larpear.",
      "Eres un morro ñengo!",
      "✌️😅🕊",
      "Todo ñengo!",
    ],
    lose: [
      "Le dare un mameluquin al beto...",
      "Incel... como yo",
      "Voy a scrollear en TikTok",
      "Ocupo un hielito.",
      "Le dire al Marcelin",
    ],
  },
};

export function pickTaunt(id: CharacterId, event: TauntEvent): string {
  const list = TAUNTS[id][event];
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
}
