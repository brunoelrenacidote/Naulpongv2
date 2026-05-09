# Music

Tracks de fondo del lobby. Cargados por `src/lib/music.ts` vía
`HTMLAudioElement` con `loop = true` y fade in/out por volumen.

## Filename esperado

| File             | Cuándo suena                                |
| ---------------- | ------------------------------------------- |
| `lobby-theme.mp3`| Loop de fondo del lobby — auto-start en el  |
|                  | primer gesto del user, persistido en LS.    |

Para cambiar el track, basta con sobreescribir `lobby-theme.mp3` por
otro mp3. No hace falta tocar código.

## Recomendaciones

- Format: `mp3` 128 kbps stereo 44.1 kHz.
- Length: 1:30 - 3:00 ideal (loopeamos via `audio.loop = true`).
- Loudness: -16 LUFS / -1.5 dBTP (ya normalizado por ffmpeg `loudnorm`).
- Mejor si los primeros y últimos 100 ms están en silencio o tienen
  fade — `audio.loop = true` no hace crossfade, sólo restart, así que
  un endpoint con energía produce un click audible al loopear.

## Fuentes actuales

| File             | Source pack                | License | Author     |
| ---------------- | -------------------------- | ------- | ---------- |
| `lobby-theme.mp3`| OpenGameArt — "Open Warfare" | CC0   | Ruskerdax  |

URL: https://opengameart.org/content/open-warfare

CC0 1.0 Universal (Public Domain Dedication). No requiere atribución
pero se incluye por trackeabilidad / cortesía.

## Procesamiento aplicado

`open_warfare.mp3` (256 kbps stereo, 1:54.48) →
`lobby-theme.mp3` (128 kbps stereo, 1:54.62):

- Re-encode a mp3 128 kbps stereo 44.1 kHz.
- Loudness-normalised a -16 LUFS / -1.5 dBTP / LRA 11 vía
  ffmpeg `loudnorm`.
- Fade-in de 50 ms al inicio + fade-out de 400 ms al final, para que el
  loop al reiniciar no produzca un click audible.
