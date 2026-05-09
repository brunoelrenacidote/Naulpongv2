"use client";

/**
 * Mapea el `id` de un item del Luck Royale a un icono SVG inline. Si no
 * hay mapping (por ejemplo, un bonus tipo "+5 boletos"), cae al icono
 * genérico `IconTicket`. El glyph emoji original sigue viviendo como
 * fallback puro de datos en `LUCK_POOL`, pero la UI usa este componente.
 */

import {
  IconBolt,
  IconFlame,
  IconPaddleSkin,
  IconPickaxe,
  IconSkull,
  IconTicket,
} from "@/components/lobby/icons";

type IconCmp = (p: { size?: number }) => JSX.Element;

const ITEM_ICONS: Record<string, IconCmp> = {
  "morro-maincraftiano": IconPickaxe,
  "paddle-neon": IconPaddleSkin,
  "paddle-gold": IconPaddleSkin,
  "paddle-skull": IconSkull,
  "trail-fire": IconFlame,
  "trail-cyber": IconBolt,
  "bonus-5": IconTicket,
  "bonus-3": IconTicket,
};

export default function ItemIcon({
  id,
  size = 24,
}: {
  id: string;
  size?: number;
}) {
  const Cmp = ITEM_ICONS[id] ?? IconTicket;
  return <Cmp size={size} />;
}
