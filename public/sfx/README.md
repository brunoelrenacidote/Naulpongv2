# SFX

Drop sound files here to override the synthesized fallback (the soft
filtered blips in `src/lib/sounds.ts`). The runtime tries each file in
this order: `<id>.mp3` → `<id>.ogg` → `<id>.wav`. The first one that
returns 200 OK and decodes wins. If none of them exist, the synthesized
fallback runs (so it's safe to leave files out).

Files are loaded once and cached in memory, then reused without
re-fetching.

## Filenames expected (one per id)

UI / lobby:

| id              | when it plays                                        |
| --------------- | ---------------------------------------------------- |
| `ui-click`      | any tactical button click in the lobby (rail, hud)   |
| `ui-hover`      | hover on a mode tab / legend arrow (no-op on touch)  |
| `ui-back`       | cancel / close overlay                               |
| `mode-switch`   | switching DEPLOY RÁPIDO / VS BOT / SALA PRIVADA      |
| `legend-cycle`  | next/prev character on the legend card               |
| `deploy`        | DEPLOY CTA pressed (matchmaking start / bot launch)  |

In-arena (Pong gameplay):

| id           | when it plays                                            |
| ------------ | -------------------------------------------------------- |
| `paddle-hit` | ball bounces off your paddle                             |
| `wall`       | ball bounces off the top/bottom walls                    |
| `goal`       | a goal is scored                                         |
| `power`      | a power-up is collected                                  |
| `spawn`      | a power-up orb spawns                                    |
| `countdown`  | each tick of the 3-2-1 countdown                         |
| `start`      | round begins after countdown                             |
| `win`        | match won                                                |
| `lose`       | match lost                                               |

## Recommended specs

- **Format:** mp3 96–128 kbps mono (or ogg if you prefer open formats).
- **Length:**
  - UI sfx: 40–120 ms (very short, tail can be a tiny reverb).
  - `deploy`: 400–700 ms with bass kick + rise.
  - In-arena: 60–250 ms.
- **Loudness:** -16 LUFS-ish; the runtime applies a `0.85` gain on top so
  leave a few dB of headroom.
- **No silence at the start:** trim it; SFX should fire instantly.

## How muting works

The user can mute sfx from the top-right HUD button (square wave icon).
This sets `localStorage["naulpong:sfx-on"] = "0"` and skips both sample
playback and the synthesized fallback. Music has its own toggle.
