"use client";

import { useEffect, useRef } from "react";
import { CharacterId } from "@/lib/game-types";
import { Pose, SPRITE_H, SPRITE_W } from "@/lib/character-sprites";
import { drawCharacter, preloadSprites } from "@/lib/sprite-loader";

interface Props {
  id: CharacterId;
  scale?: number;
  glow?: string;
}

export default function CharacterPreview({
  id,
  scale = 4,
  glow = "#ffffff",
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const W = SPRITE_W * scale;
  const H = SPRITE_H * scale;

  useEffect(() => {
    preloadSprites();
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const loop = (ts: number) => {
      ctx.clearRect(0, 0, W, H);
      const blinkPhase = Math.floor(ts / 180) % 32;
      const pose: Pose = blinkPhase === 0 || blinkPhase === 1 ? "blink" : "idle";
      const bob = Math.sin(ts * 0.005) * 1;
      drawCharacter(ctx, id, pose, 0, Math.round(bob), scale);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [id, scale, W, H]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="pixel-img"
      style={{
        imageRendering: "pixelated",
        width: `${W}px`,
        height: `${H}px`,
        filter: `drop-shadow(0 0 6px ${glow}) drop-shadow(0 0 12px ${glow})`,
      }}
    />
  );
}
