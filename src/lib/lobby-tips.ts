// Rotating tips spoken by the sidekick character on the home lobby.
//
// Idea: short, punchy lines, max ~70 chars, all caps where the typography
// expects (`font-press`). Pulls from a fixed pool with a seeded shuffle so
// the same tip doesn't show twice in a row.

const TIPS: readonly string[] = [
  "PROBÁ EL BOT FÁCIL ANTES DE IR A ONLINE.",
  "EL ESCUDO ABSORBE UN GOL. ÚSALO BIEN.",
  "EL POWER MULTIBALL PUEDE GANAR EL PUNTO SOLO.",
  "EL CLAVEL TIENE EL BIGOTE MÁS ELEGANTE.",
  "GANÁ 5 SEGUIDAS PARA DESBLOQUEAR EN RACHA.",
  "EN MODO SUBTE EL FONDO SE MUEVE — NO TE MAREES.",
  "GANÁ 7 A 0 Y EL JUEGO TE BUFEA.",
  "MÁS RÁPIDA = WIN EN MENOS DE 60 SEGUNDOS.",
  "LA SALA PRIVADA ES PARA JUGAR CON UN AMIGO.",
  "INICIÁ SESIÓN PARA SUBIR TUS STATS A LA NUBE.",
  "EL XL HACE TU PALA MÁS GRANDE. ROBALO PRIMERO.",
  "EL FREEZE CONGELA AL RIVAL POR DOS SEGUNDOS.",
] as const;

export function nextTip(prev: string | null): string {
  if (TIPS.length === 0) return "";
  if (TIPS.length === 1) return TIPS[0];
  let candidate = TIPS[Math.floor(Math.random() * TIPS.length)];
  let safety = 6;
  while (candidate === prev && safety-- > 0) {
    candidate = TIPS[Math.floor(Math.random() * TIPS.length)];
  }
  return candidate;
}
