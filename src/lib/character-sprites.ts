// Pixel-art sprites for NauLPong characters.
//
// Each sprite is a 16-wide x 16-tall (or 16x18) grid of single-character codes.
// Codes are looked up in a palette to get an actual color (or null = transparent).
//
// Three poses per character: idle (default), happy (just scored), sad (got scored on).
// Some have a "blink" frame triggered every few seconds for personality.

import type { CharacterId } from "./game-types";

export type Pose = "idle" | "blink" | "happy" | "sad";

type Palette = Record<string, string | null>;

interface Sprite {
  w: number;
  h: number;
  rows: string[];
  palette: Palette;
}

// Skin / shared
const SKIN = "#ffd9b3";
const DARK = "#1a1a1a";
const SHADOW = "#7c5a3a";

// === EL WEY QUE VA POR SU HIJO A LAS FIESTAS ===
// Palette codes:
//   '.' transparent  'C' cap teal  'c' cap white stripe  'D' cap brim shadow
//   'S' skin         'B' eye bag/shadow                   'K' dark (eye/mustache)
//   'F' mouth/frown red  'M' mouth happy   'W' shirt
const HIJO_PAL: Palette = {
  ".": null,
  "C": "#5cffc8",
  "c": "#ffffff",
  "D": "#2f8a78",
  "S": SKIN,
  "B": SHADOW,
  "K": DARK,
  "F": "#9b3636",
  "M": "#ffd95c",
  "W": "#3a3a4a",
};

const HIJO_IDLE: Sprite = {
  w: 16,
  h: 18,
  palette: HIJO_PAL,
  rows: [
    "................", // 0
    "....CCCCCCCC....", // 1 cap top
    "..CCCCCCCCCCCC..", // 2
    ".CCCCCCCCCCCCCC.", // 3
    ".CCccccCCCCCCCC.", // 4 white stripe / logo
    ".DDDDDDDDDDDDDD.", // 5 brim
    "..SSSSSSSSSSSS..", // 6 forehead
    ".SSSSSSSSSSSSSS.", // 7
    ".SKSSSSSSSSKSSS.", // 8 eyes
    ".SBBSSSSSSBBSSS.", // 9 eye bags
    "..SSSSKKKKSSSSS.", // 10 nose+mustache start
    "..SKKKKKKKKKSS..", // 11 mustache
    "...SSSFFFFSSSS..", // 12 frown
    "....SSSSSSSS....", // 13 chin
    "...WWWWWWWWWW...", // 14 shirt collar
    "..WWWWWWWWWWWW..", // 15
    "..W.WWWWWWWW.W..", // 16
    "................", // 17
  ],
};

const HIJO_BLINK: Sprite = {
  ...HIJO_IDLE,
  rows: HIJO_IDLE.rows.map((row, i) => {
    if (i === 8) return ".SKKSSSSSSSKKSS."; // eyes squinted
    if (i === 9) return ".SBBSSSSSSBBSSS.";
    return row;
  }),
};

const HIJO_HAPPY: Sprite = {
  ...HIJO_IDLE,
  rows: HIJO_IDLE.rows.map((row, i) => {
    if (i === 8) return ".SKSSSSSSSSKSSS."; // wide eyes
    if (i === 9) return ".SSSSSSSSSSSSSS."; // bags gone
    if (i === 12) return "...SSMMMMMSSSS.."; // smile (yellow)
    if (i === 11) return "..SKMMMKKKKMSS.."; // mustache curled up
    return row;
  }),
};

const HIJO_SAD: Sprite = {
  ...HIJO_IDLE,
  rows: HIJO_IDLE.rows.map((row, i) => {
    if (i === 8) return ".SKKSSSSSSKKKSS."; // squinted, distressed
    if (i === 12) return "..SSFFFFFFSSSS.."; // big frown
    if (i === 13) return "...SSFSSFFSSSS.."; // tear
    return row;
  }),
};

// === EL CLAVEL ===
// Palette:
//   '.' transparent  'P' petal pink  'p' light pink  'Y' center yellow
//   'G' stem green   'S' skin        'B' sunglasses black  'K' dark
//   'M' smirk red    'T' gold tooth  'W' suit
const CLAVEL_PAL: Palette = {
  ".": null,
  "P": "#ff5c8a",
  "p": "#ffb1c8",
  "Y": "#ffd95c",
  "G": "#3aa14a",
  "S": SKIN,
  "B": "#0a0a14",
  "K": DARK,
  "M": "#a0263c",
  "T": "#ffd95c",
  "W": "#1a1a2e",
};

const CLAVEL_IDLE: Sprite = {
  w: 16,
  h: 18,
  palette: CLAVEL_PAL,
  rows: [
    "................", // 0
    ".....PPPPPP.....", // 1
    "...PPpppppPP....", // 2 petals
    "..PPpppppPPpP...", // 3
    ".PpppPPYYPpppP..", // 4 center yellow
    ".PpppPYYPPpppP..", // 5
    "..PPpppppPPpP...", // 6
    "...PPpppppPP....", // 7
    "....PPPPPPP.....", // 8
    ".....GGGG.......", // 9 stem
    "....SSSSSSSS....", // 10 face
    "..BBBBBBBBBBBB..", // 11 sunglasses
    ".BBBBBBBBBBBBBB.", // 12
    "..SSSSSSSSSSSS..", // 13
    "...SSKKKKKKSSS..", // 14 smirk
    "....SSKKMTKSS...", // 15 gold tooth
    "...WWWWWWWWWW...", // 16 suit collar
    "..WWWWWWWWWWWW..", // 17
  ],
};

const CLAVEL_BLINK: Sprite = {
  ...CLAVEL_IDLE,
  rows: CLAVEL_IDLE.rows.map((row, i) => {
    // sunglasses cover eyes so 'blink' shows a glint
    if (i === 11) return "..BBBBcBBBBcBB.."; // shrug — keep mostly black
    return row;
  }),
};

const CLAVEL_HAPPY: Sprite = {
  ...CLAVEL_IDLE,
  rows: CLAVEL_IDLE.rows.map((row, i) => {
    if (i === 14) return "...SSMMMMMMSSS.."; // big smirk
    if (i === 15) return "....SMTMMMMS.S.."; // tooth showing
    return row;
  }),
};

const CLAVEL_SAD: Sprite = {
  ...CLAVEL_IDLE,
  rows: CLAVEL_IDLE.rows.map((row, i) => {
    if (i === 1) return "......PPPP......"; // wilted petals smaller
    if (i === 2) return ".....PpppppP....";
    if (i === 14) return "...SSSSKSSSSS..."; // tiny mouth
    if (i === 15) return "....SSKKKSSS....";
    return row;
  }),
};

const SPRITES: Record<CharacterId, Record<Pose, Sprite>> = {
  "hijo-fiesta": {
    idle: HIJO_IDLE,
    blink: HIJO_BLINK,
    happy: HIJO_HAPPY,
    sad: HIJO_SAD,
  },
  "clavel": {
    idle: CLAVEL_IDLE,
    blink: CLAVEL_BLINK,
    happy: CLAVEL_HAPPY,
    sad: CLAVEL_SAD,
  },
};

export function getSprite(id: CharacterId, pose: Pose): Sprite {
  return SPRITES[id][pose];
}

/**
 * Draw a character sprite anchored at top-left (x, y) in the current
 * canvas coordinate space, scaled by `scale`.
 */
export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  id: CharacterId,
  pose: Pose,
  x: number,
  y: number,
  scale: number,
) {
  const s = SPRITES[id][pose];
  for (let row = 0; row < s.h; row++) {
    const line = s.rows[row] ?? "";
    for (let col = 0; col < s.w; col++) {
      const ch = line[col] ?? ".";
      const color = s.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
    }
  }
}

export const SPRITE_W = 16;
export const SPRITE_H = 18;
