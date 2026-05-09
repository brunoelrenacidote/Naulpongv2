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
}

interface BlipOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  freqEnd?: number;
}

function blip({ freq, duration, type = "square", volume = 0.08, freqEnd }: BlipOpts) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (typeof freqEnd === "number") {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, freqEnd),
      c.currentTime + duration,
    );
  }
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export function sfxPaddleHit() {
  blip({ freq: 440, duration: 0.06, type: "square", volume: 0.08 });
}

export function sfxWall() {
  blip({ freq: 220, duration: 0.05, type: "square", volume: 0.06 });
}

export function sfxGoal() {
  blip({ freq: 660, duration: 0.18, type: "square", volume: 0.1, freqEnd: 110 });
  setTimeout(() => blip({ freq: 110, duration: 0.18, type: "sawtooth", volume: 0.08 }), 80);
}

export function sfxPower() {
  blip({ freq: 880, duration: 0.08, type: "triangle", volume: 0.1 });
  setTimeout(
    () => blip({ freq: 1320, duration: 0.08, type: "triangle", volume: 0.1 }),
    50,
  );
  setTimeout(
    () => blip({ freq: 1760, duration: 0.12, type: "triangle", volume: 0.1 }),
    100,
  );
}

export function sfxSpawn() {
  blip({ freq: 1200, duration: 0.06, type: "triangle", volume: 0.05 });
}

export function sfxCountdown() {
  blip({ freq: 660, duration: 0.12, type: "square", volume: 0.08 });
}

export function sfxStart() {
  blip({ freq: 660, duration: 0.1, type: "square", volume: 0.1 });
  setTimeout(() => blip({ freq: 990, duration: 0.18, type: "square", volume: 0.1 }), 90);
}

export function sfxWin() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => {
    setTimeout(
      () => blip({ freq: f, duration: 0.18, type: "square", volume: 0.1 }),
      i * 130,
    );
  });
}

export function sfxLose() {
  const notes = [392, 330, 262, 196];
  notes.forEach((f, i) => {
    setTimeout(
      () =>
        blip({ freq: f, duration: 0.22, type: "sawtooth", volume: 0.08 }),
      i * 150,
    );
  });
}

/* ===== UI feedback (lobby Apex) ============================== */

/**
 * Click táctico — un blip corto + ligera caída de pitch. Pensado para
 * cualquier toggle/botón secundario.
 */
export function sfxUiClick() {
  blip({ freq: 1100, duration: 0.04, type: "square", volume: 0.06, freqEnd: 720 });
}

/** Hover/select más sutil. */
export function sfxUiHover() {
  blip({ freq: 1500, duration: 0.025, type: "triangle", volume: 0.04 });
}

/** Back / cancelar (descendiendo). */
export function sfxUiBack() {
  blip({ freq: 600, duration: 0.06, type: "square", volume: 0.06, freqEnd: 280 });
}

/** Cambio de modo en el selector — chord ascendente corto. */
export function sfxModeSwitch() {
  blip({ freq: 660, duration: 0.05, type: "square", volume: 0.07 });
  setTimeout(
    () => blip({ freq: 990, duration: 0.06, type: "square", volume: 0.07 }),
    40,
  );
}

/** Cycle entre personajes (cambio de leyenda). */
export function sfxLegendCycle() {
  blip({ freq: 880, duration: 0.04, type: "triangle", volume: 0.06 });
  setTimeout(
    () => blip({ freq: 1320, duration: 0.06, type: "triangle", volume: 0.06 }),
    35,
  );
}

/**
 * Deploy / partida iniciada — rampa táctica con kick de bajo. Usar al
 * iniciar matchmaking / enviar al usuario al juego.
 */
export function sfxDeploy() {
  // Kick de bajo
  blip({ freq: 110, duration: 0.18, type: "sine", volume: 0.18, freqEnd: 40 });
  // Rampa de "alarma" ascendente
  setTimeout(
    () => blip({ freq: 440, duration: 0.18, type: "sawtooth", volume: 0.1, freqEnd: 1200 }),
    60,
  );
  setTimeout(
    () => blip({ freq: 1320, duration: 0.12, type: "square", volume: 0.08 }),
    220,
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
