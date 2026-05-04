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
