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
- Length: 1:00 - 3:00 ideal (loopeamos via `audio.loop = true`).
- Loudness: -16 a -18 LUFS / -1.5 dBTP (ya normalizado por ffmpeg
  `loudnorm`). Más bajo = más tranqui de fondo.
- Mejor si los primeros y últimos 100 ms están en silencio o tienen
  fade — `audio.loop = true` no hace crossfade, sólo restart, así que
  un endpoint con energía produce un click audible al loopear.

## Fuentes actuales

| File             | Source                                            | License | Author    |
| ---------------- | ------------------------------------------------- | ------- | --------- |
| `lobby-theme.mp3`| OpenGameArt — "digital evening" (cyberpunk ambient) | CC0   | bluszcz   |

URL: https://opengameart.org/content/digital-evening

CC0 1.0 Universal (Public Domain Dedication). No requiere atribución
pero se incluye por trackeabilidad / cortesía.

## Procesamiento aplicado

`digital evening.ogg` (94.8 kbps stereo 44.1 kHz, 1:27.27) →
`lobby-theme.mp3` (128 kbps stereo 44.1 kHz, 1:27.30):

- Re-encode a mp3 128 kbps stereo 44.1 kHz.
- Loudness-normalised a **-18 LUFS** / -1.5 dBTP / LRA 11 vía
  ffmpeg `loudnorm` (más bajo que el track anterior `Open Warfare` que
  estaba en -16 LUFS — el user pidió "más tranqui").
- Fade-in de 2 s al inicio + fade-out de 2.5 s al final, para que el
  loop al reiniciar no produzca un click audible.

## Histórico

- `Open Warfare` por Ruskerdax (CC0, OpenGameArt) — track inicial post
  chip-tune. Demasiado intenso de combate para el lobby idle, reemplazado.
- Chip-tune sintetizado vía osciladores Web Audio — versión inicial.
  Sonaba 8-bit por construcción.
