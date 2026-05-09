"use client";

/**
 * Mapea cada `AchievementId` a un icono SVG inline. Pensado para los
 * chips de la vitrina de trofeos y el toast de logros — antes esos
 * mostraban un emoji directo.
 */

import {
  IconBolt,
  IconBot,
  IconFlame,
  IconGem,
  IconSkull,
  IconStar,
  IconTarget,
  IconTrophy,
  IconUser,
} from "@/components/lobby/icons";
import type { AchievementId } from "@/lib/stats";

type IconCmp = (p: { size?: number }) => JSX.Element;

const ACH_ICONS: Record<AchievementId, IconCmp> = {
  first_win: IconStar,
  five_streak: IconFlame,
  ten_wins: IconTrophy,
  shutout: IconTarget,
  perfect_seven: IconGem,
  power_collector: IconBolt,
  bot_easy: IconBot,
  bot_medium: IconBot,
  bot_hard: IconSkull,
  speed_run: IconBolt,
  veteran: IconUser,
};

export default function AchievementIcon({
  id,
  size = 24,
}: {
  id: AchievementId;
  size?: number;
}) {
  const Cmp = ACH_ICONS[id] ?? IconStar;
  return <Cmp size={size} />;
}
