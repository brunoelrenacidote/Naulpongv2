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
      "GG EZ",
      "Crítico!",
      "Diamante!",
      "Skill issue, hermano",
      "Te creepié la pelota",
      "+1 EXP",
      "Speedrun any%",
    ],
    takeGoal: [
      "Lag!",
      "Mi mochila está llena...",
      "Otra vez la creeper",
      "Re host bro",
      "Mods rotos",
    ],
    win: [
      "VICTORY ROYALE",
      "Saqué diamantes",
      "GG WP",
      "Pls pls pls",
      "Refresca el server",
    ],
    lose: [
      "Reportado",
      "Fue lag",
      "Voy a llorar a TikTok",
      "Mi mamá me llama",
      "Me bugueó",
    ],
  },
};

export function pickTaunt(id: CharacterId, event: TauntEvent): string {
  const list = TAUNTS[id][event];
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
}
