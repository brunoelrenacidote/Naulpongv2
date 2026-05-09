/**
 * Luck Royale — definiciones compartidas entre cliente y server.
 *
 * Es un sistema de gacha simple: gastás boletos para tirar, sale un item
 * random ponderado del pool. Algunos items son cosméticos/personajes
 * desbloqueables (1 sola vez); otros son consolation prizes que devuelven
 * boletos (always rollable).
 *
 * Solo accesible para usuarios con cuenta en la nube — los boletos viven
 * en Mongo (no en localStorage) para que no se puedan inflar editando
 * el storage del cliente.
 */

export type LuckItemRarity = "common" | "rare" | "legendary";
export type LuckItemType =
  | "character"
  | "paddle"
  | "trail"
  | "bonus";

export interface LuckItem {
  id: string;
  name: string;
  description: string;
  glyph: string;
  type: LuckItemType;
  rarity: LuckItemRarity;
  weight: number;
  /** Para items tipo "bonus": cuántos boletos devuelve. */
  bonusTickets?: number;
}

/** Costo en boletos por cada giro. */
export const SPIN_COST = 5;

/** Cooldown en milisegundos entre dos créditos por jugar partida. */
export const CREDIT_COOLDOWN_MS = 30_000;

/** Boletos otorgados por completar una partida. +1 base, +1 si ganaste. */
export function ticketsForMatch(won: boolean): number {
  return 1 + (won ? 1 : 0);
}

/**
 * Pool del Luck Royale. Suma de pesos = 100 para que sea fácil de razonar.
 * El headline es Morro Maincraftiano (legendary, ~5%); el resto son
 * skins de paleta y trails de pelota (rare, desbloqueables únicos), y
 * bonificaciones de boletos como consolation (siempre disponibles).
 *
 * Probabilidad efectiva de algún drop nuevo = 67% (35 ya unlockeados se
 * convierten en bonus equivalente — ver `rollLuckRoyale`).
 */
export const LUCK_POOL: readonly LuckItem[] = [
  {
    id: "morro-maincraftiano",
    name: "MORRO MAINCRAFTIANO",
    description:
      "Personaje legendario · pibe blockero con la pala lista. Headline del Luck Royale.",
    glyph: "⛏",
    type: "character",
    rarity: "legendary",
    weight: 5,
  },
  {
    id: "paddle-neon",
    name: "PALETA NEÓN",
    description: "Skin de paleta con trail cyan brillante.",
    glyph: "▮",
    type: "paddle",
    rarity: "rare",
    weight: 12,
  },
  {
    id: "paddle-gold",
    name: "PALETA DORADA",
    description: "Skin de paleta dorada para los de la calle.",
    glyph: "▮",
    type: "paddle",
    rarity: "rare",
    weight: 12,
  },
  {
    id: "paddle-skull",
    name: "PALETA CALAVERA",
    description: "Skin morada con calavera. Pa los antagonistas.",
    glyph: "💀",
    type: "paddle",
    rarity: "rare",
    weight: 12,
  },
  {
    id: "trail-fire",
    name: "TRAIL FUEGO",
    description: "La pelota deja una estela de fuego al pegar fuerte.",
    glyph: "🔥",
    type: "trail",
    rarity: "rare",
    weight: 13,
  },
  {
    id: "trail-cyber",
    name: "TRAIL CYBER",
    description: "Estela glitch cyan para la pelota. Pure HUD.",
    glyph: "⚡",
    type: "trail",
    rarity: "rare",
    weight: 13,
  },
  {
    id: "bonus-5",
    name: "+5 BOLETOS",
    description: "Consolation prize — devolvemos 5 boletos.",
    glyph: "🎟",
    type: "bonus",
    rarity: "common",
    weight: 18,
    bonusTickets: 5,
  },
  {
    id: "bonus-3",
    name: "+3 BOLETOS",
    description: "Consolation prize chico — 3 boletos de regalo.",
    glyph: "🎟",
    type: "bonus",
    rarity: "common",
    weight: 15,
    bonusTickets: 3,
  },
];

export function findLuckItem(id: string): LuckItem | undefined {
  return LUCK_POOL.find((item) => item.id === id);
}

/**
 * Items "coleccionables" (los que se desbloquean 1 sola vez). Usado para
 * decidir qué mostrar en el inventario de `/perfil` y `/luck-royale`.
 */
export const COLLECTIBLE_ITEMS: readonly LuckItem[] = LUCK_POOL.filter(
  (item) => item.type !== "bonus",
);

/**
 * Tira el dado del Luck Royale. Es server-authoritative: el caller debe
 * validar tickets >= SPIN_COST y descontarlos antes/después. Retorna el
 * item ganado, si fue "duplicado" (ya unlockeado), y los boletos extra
 * que se devuelven (consolation o duplicate-rebate).
 */
export interface SpinOutcome {
  item: LuckItem;
  duplicate: boolean;
  ticketsRefunded: number;
}

export function rollLuckRoyale(
  alreadyUnlocked: ReadonlySet<string>,
  rng: () => number = Math.random,
): SpinOutcome {
  const totalWeight = LUCK_POOL.reduce((acc, it) => acc + it.weight, 0);
  let pick = rng() * totalWeight;
  let chosen: LuckItem = LUCK_POOL[LUCK_POOL.length - 1];
  for (const it of LUCK_POOL) {
    pick -= it.weight;
    if (pick < 0) {
      chosen = it;
      break;
    }
  }

  if (chosen.type === "bonus") {
    return {
      item: chosen,
      duplicate: false,
      ticketsRefunded: chosen.bonusTickets ?? 0,
    };
  }

  // Coleccionable. Si ya lo tenía, es duplicado: devolvemos algunos boletos
  // como rebate para que no sea pura frustración.
  if (alreadyUnlocked.has(chosen.id)) {
    const rebate =
      chosen.rarity === "legendary"
        ? 4
        : chosen.rarity === "rare"
          ? 2
          : 1;
    return { item: chosen, duplicate: true, ticketsRefunded: rebate };
  }

  return { item: chosen, duplicate: false, ticketsRefunded: 0 };
}
