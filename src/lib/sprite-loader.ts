// Loads optional PNG sprite overrides from /public/sprites/<id>-<pose>.png.
// If a PNG is present and loaded, it's used. Otherwise we fall back to the
// procedural pixel-art in character-sprites.ts.
//
// Convention:
//   /public/sprites/hijo-fiesta-idle.png
//   /public/sprites/hijo-fiesta-blink.png
//   /public/sprites/hijo-fiesta-happy.png
//   /public/sprites/hijo-fiesta-sad.png
//   /public/sprites/clavel-idle.png
//   /public/sprites/clavel-blink.png
//   /public/sprites/clavel-happy.png
//   /public/sprites/clavel-sad.png
//
// PNGs should be transparent. Source resolution is up to the artist —
// recommended 16x18 (will be scaled 4x) or 32x36 / 64x72 for higher detail.

import type { CharacterId } from "./game-types";
import {
  Pose,
  SPRITE_H,
  SPRITE_W,
  drawCharacterSprite,
} from "./character-sprites";

interface SpriteState {
  img: HTMLImageElement;
  loaded: boolean;
  failed: boolean;
}

const cache: Record<string, SpriteState> = {};

function key(id: CharacterId, pose: Pose): string {
  return `${id}-${pose}`;
}

function loadOnce(id: CharacterId, pose: Pose): SpriteState {
  const k = key(id, pose);
  const existing = cache[k];
  if (existing) return existing;
  const img = new Image();
  const state: SpriteState = { img, loaded: false, failed: false };
  cache[k] = state;
  img.onload = () => {
    state.loaded = true;
  };
  img.onerror = () => {
    state.failed = true;
  };
  img.src = `/sprites/${k}.png`;
  return state;
}

/**
 * Preload all sprite PNGs (best-effort). Safe to call multiple times.
 * Call from a top-level client component after mount.
 */
export function preloadSprites() {
  if (typeof window === "undefined") return;
  const ids: CharacterId[] = ["hijo-fiesta", "clavel"];
  const poses: Pose[] = ["idle", "blink", "happy", "sad"];
  for (const id of ids) {
    for (const pose of poses) {
      loadOnce(id, pose);
    }
  }
}

/**
 * Draw the sprite at (x, y) with `scale`. Uses PNG if available, otherwise
 * the procedural pixel-art fallback. Output size is always
 * SPRITE_W*scale x SPRITE_H*scale regardless of source PNG dims.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  id: CharacterId,
  pose: Pose,
  x: number,
  y: number,
  scale: number,
) {
  if (typeof window !== "undefined") {
    const s = loadOnce(id, pose);
    if (s.loaded && !s.failed) {
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(s.img, x, y, SPRITE_W * scale, SPRITE_H * scale);
      ctx.imageSmoothingEnabled = prev;
      return;
    }
  }
  drawCharacterSprite(ctx, id, pose, x, y, scale);
}
