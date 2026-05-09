"use client";

/**
 * Icono SVG por personaje, para los lugares donde antes mostrábamos el
 * emoji (`CHARACTERS[id].emoji`). Usado en chips de UI / overlays donde
 * un emoji se ve raro al lado del resto de la HUD line-art.
 *
 * El render in-game del personaje sigue saliendo del sprite real
 * (`CharacterPreview`), no de este icono.
 */

import {
  IconPickaxe,
  IconRose,
  IconUser,
} from "@/components/lobby/icons";
import type { CharacterId } from "@/lib/game-types";

type IconCmp = (p: { size?: number }) => JSX.Element;

const CHARACTER_ICONS: Record<CharacterId, IconCmp> = {
  "hijo-fiesta": IconUser,
  clavel: IconRose,
  "morro-maincraftiano": IconPickaxe,
};

export default function CharacterIcon({
  id,
  size = 24,
}: {
  id: CharacterId;
  size?: number;
}) {
  const Cmp = CHARACTER_ICONS[id];
  return <Cmp size={size} />;
}
