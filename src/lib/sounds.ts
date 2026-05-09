let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") {
    void c.resume();
  }
  // Pre-warmup de samples al primer gesto: mete las URLs en el cache del
  // browser para que el primer disparo no tenga lag perceptible.
  void preloadAllSamples();
}

/* ===== SFX mute toggle (persistido en localStorage) ============== */

const SFX_KEY = "naulpong:sfx-on";

export function isSfxOn(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SFX_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSfxOn(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SFX_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent("naulpong:sfx-changed"));
  } catch {
    /* ignore */
  }
}

/* ===== Sample-based SFX (mp3/ogg/wav) con fallback a sintetizado ===
 *
 * Si el dev coloca archivos en /public/sfx/<id>.mp3 los usamos en lugar
 * del blip sintetizado. La clave del id matchea con la lista
 * `SAMPLE_IDS` definida abajo. Si el archivo no existe (404) o la
 * decodificación falla, usamos el blip de toda la vida.
 *
 * No bloqueamos: el primer disparo de un sample con loading aún no
 * resuelto cae al sintetizado y luego ya queda cacheado.
 */

export type SampleId =
  | "ui-click"
  | "ui-back"
  | "ui-hover"
  | "mode-switch"
  | "legend-cycle"
  | "deploy"
  | "paddle-hit"
  | "wall"
  | "goal"
  | "power"
  | "spawn"
  | "countdown"
  | "start"
  | "win"
  | "lose";

const SAMPLE_BUFFERS = new Map<SampleId, AudioBuffer | null>();
const SAMPLE_PROMISES = new Map<SampleId, Promise<AudioBuffer | null>>();

function sampleUrl(id: SampleId, ext: "mp3" | "ogg" | "wav"): string {
  return `/sfx/${id}.${ext}`;
}

async function fetchSample(id: SampleId): Promise<AudioBuffer | null> {
  const c = getCtx();
  if (!c) return null;
  for (const ext of ["mp3", "ogg", "wav"] as const) {
    try {
      // `no-cache` revalida con el server cada vez. El cache real del
      // sample es el AudioBuffer en `SAMPLE_BUFFERS` (in-memory), así que
      // sólo pagamos esta validación una vez por sesión por id. Antes
      // usábamos `force-cache`, que cacheaba 404s viejos para siempre y
      // hacía que la app siguiera sonando al fallback sintetizado aún
      // después de subir los archivos a /public/sfx.
      const res = await fetch(sampleUrl(id, ext), { cache: "no-cache" });
      if (!res.ok) continue;
      const ab = await res.arrayBuffer();
      const buf = await c.decodeAudioData(ab.slice(0));
      return buf;
    } catch {
      // try next extension
    }
  }
  return null;
}

function loadSample(id: SampleId): Promise<AudioBuffer | null> {
  const cached = SAMPLE_BUFFERS.get(id);
  if (cached !== undefined) return Promise.resolve(cached);
  const inflight = SAMPLE_PROMISES.get(id);
  if (inflight) return inflight;
  const p = fetchSample(id).then((buf) => {
    SAMPLE_BUFFERS.set(id, buf);
    SAMPLE_PROMISES.delete(id);
    return buf;
  });
  SAMPLE_PROMISES.set(id, p);
  return p;
}

const ALL_SAMPLES: readonly SampleId[] = [
  "ui-click",
  "ui-back",
  "ui-hover",
  "mode-switch",
  "legend-cycle",
  "deploy",
  "paddle-hit",
  "wall",
  "goal",
  "power",
  "spawn",
  "countdown",
  "start",
  "win",
  "lose",
];

async function preloadAllSamples() {
  await Promise.all(ALL_SAMPLES.map((id) => loadSample(id).catch(() => null)));
}

/**
 * Reproduce un sample si existe, si no llama a `fallback()`. Respeta el
 * mute de SFX. Volume va 0..1.
 */
function playSample(
  id: SampleId,
  fallback: () => void,
  opts: { volume?: number } = {},
) {
  if (!isSfxOn()) return;
  // Asegura que el AudioContext esté running y kick-off del preload de
  // todos los samples. El lobby antes no llamaba a unlockAudio, así que
  // el primer click siempre se loadeaba on-demand y se escuchaba el
  // fallback sintetizado. Esto es idempotente.
  unlockAudio();
  const c = getCtx();
  if (!c) {
    fallback();
    return;
  }
  const cached = SAMPLE_BUFFERS.get(id);
  if (cached === null) {
    fallback();
    return;
  }
  if (cached) {
    const src = c.createBufferSource();
    src.buffer = cached;
    const gain = c.createGain();
    gain.gain.value = opts.volume ?? 0.85;
    src.connect(gain);
    gain.connect(c.destination);
    src.start(0);
    return;
  }
  // Aún no loadeado: dispara fallback y arranca la carga.
  void loadSample(id);
  fallback();
}

interface BlipOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  freqEnd?: number;
  /** Cutoff del low-pass en Hz para suavizar el chip-tune. Default 4500. */
  lpCutoff?: number;
}

function blip({
  freq,
  duration,
  type = "square",
  volume = 0.05,
  freqEnd,
  lpCutoff = 4500,
}: BlipOpts) {
  if (!isSfxOn()) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = lpCutoff;
  lp.Q.value = 0.5;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (typeof freqEnd === "number") {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, freqEnd),
      c.currentTime + duration,
    );
  }
  // Fade in/out cortito para evitar clicks.
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, c.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(lp);
  lp.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

/* ===== Game SFX (in-arena) ===================================== */

export function sfxPaddleHit() {
  playSample("paddle-hit", () =>
    blip({ freq: 440, duration: 0.06, type: "square", volume: 0.05 }),
  );
}

export function sfxWall() {
  playSample("wall", () =>
    blip({ freq: 220, duration: 0.05, type: "square", volume: 0.04 }),
  );
}

export function sfxGoal() {
  playSample("goal", () => {
    blip({ freq: 660, duration: 0.18, type: "square", volume: 0.06, freqEnd: 110 });
    setTimeout(
      () => blip({ freq: 110, duration: 0.18, type: "sawtooth", volume: 0.05 }),
      80,
    );
  });
}

export function sfxPower() {
  playSample("power", () => {
    blip({ freq: 880, duration: 0.08, type: "triangle", volume: 0.06 });
    setTimeout(
      () =>
        blip({ freq: 1320, duration: 0.08, type: "triangle", volume: 0.06 }),
      50,
    );
    setTimeout(
      () =>
        blip({ freq: 1760, duration: 0.12, type: "triangle", volume: 0.06 }),
      100,
    );
  });
}

export function sfxSpawn() {
  playSample("spawn", () =>
    blip({ freq: 1200, duration: 0.06, type: "triangle", volume: 0.03 }),
  );
}

export function sfxCountdown() {
  playSample("countdown", () =>
    blip({ freq: 660, duration: 0.12, type: "square", volume: 0.05 }),
  );
}

export function sfxStart() {
  playSample("start", () => {
    blip({ freq: 660, duration: 0.1, type: "square", volume: 0.06 });
    setTimeout(
      () => blip({ freq: 990, duration: 0.18, type: "square", volume: 0.06 }),
      90,
    );
  });
}

export function sfxWin() {
  playSample("win", () => {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      setTimeout(
        () => blip({ freq: f, duration: 0.18, type: "square", volume: 0.06 }),
        i * 130,
      );
    });
  });
}

export function sfxLose() {
  playSample("lose", () => {
    const notes = [392, 330, 262, 196];
    notes.forEach((f, i) => {
      setTimeout(
        () =>
          blip({ freq: f, duration: 0.22, type: "sawtooth", volume: 0.05 }),
        i * 150,
      );
    });
  });
}

/* ===== UI feedback (lobby Apex) ============================== */

/**
 * Click táctico — más suave que el chip-tune original. Se reemplaza por
 * un sample real si existe `/public/sfx/ui-click.mp3`.
 */
export function sfxUiClick() {
  playSample("ui-click", () =>
    blip({
      freq: 720,
      duration: 0.04,
      type: "triangle",
      volume: 0.035,
      freqEnd: 480,
      lpCutoff: 3200,
    }),
  );
}

/** Hover/select sutil. */
export function sfxUiHover() {
  playSample("ui-hover", () =>
    blip({
      freq: 900,
      duration: 0.022,
      type: "triangle",
      volume: 0.025,
      lpCutoff: 3500,
    }),
  );
}

/** Back / cancelar (descendiendo). */
export function sfxUiBack() {
  playSample("ui-back", () =>
    blip({
      freq: 480,
      duration: 0.06,
      type: "triangle",
      volume: 0.035,
      freqEnd: 220,
      lpCutoff: 2800,
    }),
  );
}

/** Cambio de modo en el selector — chord ascendente corto. */
export function sfxModeSwitch() {
  playSample("mode-switch", () => {
    blip({
      freq: 520,
      duration: 0.05,
      type: "triangle",
      volume: 0.04,
      lpCutoff: 3000,
    });
    setTimeout(
      () =>
        blip({
          freq: 780,
          duration: 0.06,
          type: "triangle",
          volume: 0.04,
          lpCutoff: 3000,
        }),
      40,
    );
  });
}

/** Cycle entre personajes (cambio de leyenda). */
export function sfxLegendCycle() {
  playSample("legend-cycle", () => {
    blip({
      freq: 700,
      duration: 0.04,
      type: "triangle",
      volume: 0.035,
      lpCutoff: 3200,
    });
    setTimeout(
      () =>
        blip({
          freq: 1040,
          duration: 0.06,
          type: "triangle",
          volume: 0.035,
          lpCutoff: 3200,
        }),
      35,
    );
  });
}

/**
 * Deploy / partida iniciada — rampa táctica con kick de bajo. Si hay
 * sample lo usa; sino, fallback sintetizado con low-pass para que no
 * suene tan 8-bit.
 */
export function sfxDeploy() {
  playSample(
    "deploy",
    () => {
      // Kick de bajo (con low-pass agresivo)
      blip({
        freq: 90,
        duration: 0.2,
        type: "sine",
        volume: 0.1,
        freqEnd: 40,
        lpCutoff: 800,
      });
      // Rampa "drop pod" ascendente filtrada
      setTimeout(
        () =>
          blip({
            freq: 320,
            duration: 0.22,
            type: "triangle",
            volume: 0.06,
            freqEnd: 880,
            lpCutoff: 2400,
          }),
        60,
      );
      setTimeout(
        () =>
          blip({
            freq: 880,
            duration: 0.14,
            type: "triangle",
            volume: 0.05,
            lpCutoff: 3200,
          }),
        220,
      );
    },
    { volume: 0.95 },
  );
}

/** Tiny haptic — vibrate API (mobile). 1 pulso corto. */
export function hapticTap() {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(8);
    } catch {
      /* ignore */
    }
  }
}

/** Pulso medio (0.4s) para acciones importantes (deploy/cancelar). */
export function hapticDeploy() {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([12, 20, 24]);
    } catch {
      /* ignore */
    }
  }
}
