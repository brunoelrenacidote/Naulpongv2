# SFX licenses

All sound files in this directory are derived from CC0-licensed packs by
**Kenney** (https://kenney.nl). Kenney's CC0 licensing means we don't
need to credit anyone, but we do anyway because it's the right thing to
do — please consider donating to Kenney if you ship something using
these.

## Source mapping

| File              | Source pack         | Source filename                 |
| ----------------- | ------------------- | ------------------------------- |
| `ui-click.mp3`    | UI Audio            | `click_001.ogg` (Interface)     |
| `ui-hover.mp3`    | UI Audio            | `rollover4.ogg`                 |
| `ui-back.mp3`     | Interface Sounds    | `back_003.ogg`                  |
| `mode-switch.mp3` | Interface Sounds    | `switch_002.ogg`                |
| `legend-cycle.mp3`| Interface Sounds    | `select_004.ogg`                |
| `deploy.mp3`      | Sci-fi Sounds       | `forceField_002.ogg`            |
| `paddle-hit.mp3`  | Impact Sounds       | `impactGeneric_light_001.ogg`   |
| `wall.mp3`        | Impact Sounds       | `impactPlate_light_002.ogg`     |
| `goal.mp3`        | Impact Sounds       | `impactBell_heavy_002.ogg`      |
| `power.mp3`       | Digital Audio       | `powerUp7.ogg`                  |
| `spawn.mp3`       | Digital Audio       | `phaseJump3.ogg`                |
| `countdown.mp3`   | Interface Sounds    | `pluck_001.ogg`                 |
| `start.mp3`       | Digital Audio       | `phaserUp1.ogg`                 |
| `win.mp3`         | Digital Audio       | `highUp.ogg`                    |
| `lose.mp3`        | Digital Audio       | `phaserDown1.ogg`               |

## Processing applied

Each file was processed with ffmpeg:

- Converted from `ogg` → `mp3` 96 kbps mono 44.1 kHz.
- Trimmed to the duration recommended by `README.md` for the id.
- 40 ms fade-out at the tail to avoid clicks.
- Loudness-normalised to -16 LUFS true-peak -1.5 dBTP via `loudnorm`.

## Source pack URLs

- UI Audio: https://kenney.nl/assets/ui-audio
- Interface Sounds: https://kenney.nl/assets/interface-sounds
- Sci-fi Sounds: https://kenney.nl/assets/sci-fi-sounds
- Impact Sounds: https://kenney.nl/assets/impact-sounds
- Digital Audio: https://kenney.nl/assets/digital-audio

All licensed CC0 1.0 Universal (Public Domain Dedication).
