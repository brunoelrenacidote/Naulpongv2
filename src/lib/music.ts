// Lobby background track. Antes esto era un loop chip-tune sintetizado
// con osciladores Web Audio (4 voces, patrón de 32 pasos en Cm). Sonaba
// 8-bit por construcción. Ahora cargamos un mp3 real CC0 con estética
// cyberpunk/tactical y lo loopeamos vía HTMLAudioElement.
//
// Mantenemos la API existente (`startMusic`, `stopMusic`, `isMusicOn`,
// `setMusicOn`, `toggleMusic`) así nada en los componentes cambia.

const TRACK_URL = "/music/lobby-theme.mp3";
const TARGET_VOLUME = 0.22;
const FADE_IN_MS = 600;
const FADE_OUT_MS = 350;

let el: HTMLAudioElement | null = null;
let fadeRAF: number | null = null;

function getEl(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio(TRACK_URL);
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    // Importante: el browser bloquea autoplay con audio hasta que haya
    // un user gesture. `play()` retorna una promesa que rechaza si no
    // hay gesture. Lo manejamos en startMusic.
  }
  return el;
}

function cancelFade() {
  if (fadeRAF !== null) {
    window.cancelAnimationFrame(fadeRAF);
    fadeRAF = null;
  }
}

function fadeTo(target: number, durMs: number, onDone?: () => void) {
  const audio = getEl();
  if (!audio) {
    onDone?.();
    return;
  }
  cancelFade();
  const start = audio.volume;
  const startT = performance.now();
  const step = () => {
    const t = performance.now() - startT;
    const k = Math.min(1, t / durMs);
    audio.volume = start + (target - start) * k;
    if (k < 1) {
      fadeRAF = window.requestAnimationFrame(step);
    } else {
      fadeRAF = null;
      onDone?.();
    }
  };
  fadeRAF = window.requestAnimationFrame(step);
}

export function startMusic() {
  const audio = getEl();
  if (!audio) return;
  // Si ya está sonando, sólo asegura el volumen target.
  if (!audio.paused) {
    fadeTo(TARGET_VOLUME, FADE_IN_MS);
    return;
  }
  // Volume al 0 al arrancar; play() puede rechazarse si no hay gesture
  // — lo capturamos silenciosamente y el toggle del HUD lo reintenta en
  // el próximo click.
  audio.volume = 0;
  audio.currentTime = audio.currentTime; // toca por si quedó en seeking
  const p = audio.play();
  if (p && typeof p.then === "function") {
    p.then(() => fadeTo(TARGET_VOLUME, FADE_IN_MS)).catch(() => {
      /* gesto requerido — el toggle del usuario lo reintenta */
    });
  } else {
    fadeTo(TARGET_VOLUME, FADE_IN_MS);
  }
}

export function stopMusic() {
  const audio = getEl();
  if (!audio) return;
  if (audio.paused) {
    audio.volume = 0;
    return;
  }
  fadeTo(0, FADE_OUT_MS, () => {
    if (audio) audio.pause();
  });
}

const STORAGE_KEY = "naulpong:music";

export function isMusicOn(): boolean {
  if (typeof window === "undefined") return false;
  const v = window.localStorage.getItem(STORAGE_KEY);
  // default ON
  return v !== "off";
}

export function setMusicOn(on: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  }
  if (on) startMusic();
  else stopMusic();
}

export function toggleMusic(): boolean {
  const next = !isMusicOn();
  setMusicOn(next);
  return next;
}
