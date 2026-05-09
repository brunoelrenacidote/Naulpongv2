// Cache local de los `unlockedItems` que el usuario tiene en la nube.
//
// El gating de Morro Maincraftiano en el lobby (HeroDisplay / LegendCard)
// pasa por acá: leer el cache, ver si "morro-maincraftiano" está, y
// permitir o no la selección.
//
// El cache se rehidrata cada vez que `apiLuckRoyaleState` se llama con
// éxito (AuthButton, LuckRoyaleScreen) y se vacía al cerrar sesión.
//
// IMPORTANTE: este cache NO es la fuente de verdad. Sólo controla el
// gating del lobby para que se vea linda la lock-card. La validación
// final de quién puede jugar como Morro la hace el worker / la API
// sirviendo /api/luck-royale (ambas verificadas con JWT).

const KEY = "naulpong:unlocked-items:v1";
export const UNLOCKED_EVENT = "naulpong:unlocked-changed";

export function loadUnlocked(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function saveUnlocked(items: readonly string[]) {
  if (typeof window === "undefined") return;
  try {
    const clean = Array.from(new Set(items.filter((s) => typeof s === "string")));
    window.localStorage.setItem(KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(UNLOCKED_EVENT));
  } catch {
    /* ignore */
  }
}

export function clearUnlocked() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(UNLOCKED_EVENT));
  } catch {
    /* ignore */
  }
}

export function hasUnlocked(itemId: string): boolean {
  return loadUnlocked().includes(itemId);
}
