// Chiptune-ish background loop using Web Audio.
// 4-voice arrangement: kick, bass, lead arpeggio, harmony.
// Loops a short pattern indefinitely while running.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let scheduler: number | null = null;
let nextNoteTime = 0;
let stepIdx = 0;
let running = false;

const TEMPO = 132; // BPM
const STEPS_PER_BEAT = 4; // 16th notes
const STEP_DUR = 60 / TEMPO / STEPS_PER_BEAT; // seconds per step
const LOOK_AHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12; // schedule 120ms ahead

// Note → freq (Hz) using A4 = 440
function note(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// MIDI shorthand: C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71, C5=72
const C4 = 60;
const Eb4 = 63;
const F4 = 65;
const G4 = 67;
const Ab4 = 68;
const Bb4 = 70;
const C5 = 72;
const Eb5 = 75;
const G5 = 79;

// 32-step (2 bar) pattern at 16th notes per step → ~3.6s loop.
// Vibe: Cm — Ab — Bb — Cm  (i — VI — VII — i)
// Bass: root drone on each beat.
const REST = -1;

const BASS_PATTERN: number[] = [
  C4 - 24, REST, C4 - 24, REST, C4 - 24, REST, C4 - 24, REST,
  Ab4 - 24, REST, Ab4 - 24, REST, Ab4 - 24, REST, Ab4 - 24, REST,
  Bb4 - 24, REST, Bb4 - 24, REST, Bb4 - 24, REST, Bb4 - 24, REST,
  C4 - 24, REST, C4 - 24, REST, C4 - 24, REST, C4 - 24, G4 - 24,
];

const LEAD_PATTERN: number[] = [
  C5, Eb5, G5, Eb5, C5, G5, Eb5, G5,
  Ab4, C5, Eb5, C5, Ab4, Eb5, C5, Eb5,
  Bb4, C5, Eb5, C5, Bb4, Eb5, C5, Eb5,
  C5, Eb5, G5, C5, Eb5, G5, Eb5, REST,
];

const HARM_PATTERN: number[] = [
  Eb4, REST, REST, REST, Eb4, REST, REST, REST,
  C4, REST, REST, REST, C4, REST, REST, REST,
  F4, REST, REST, REST, F4, REST, REST, REST,
  Eb4, REST, REST, REST, Eb4, REST, REST, REST,
];

// Kick drum pattern (boolean: hit on this step)
const KICK_PATTERN: boolean[] = [
  true, false, false, false, false, false, false, false,
  true, false, false, false, false, false, true, false,
  true, false, false, false, false, false, false, false,
  true, false, false, false, true, false, true, false,
];

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.0;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

function scheduleVoice(
  c: AudioContext,
  midi: number,
  type: OscillatorType,
  startT: number,
  durT: number,
  volume: number,
  detune = 0,
) {
  if (midi === REST) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(note(midi), startT);
  osc.detune.setValueAtTime(detune, startT);
  // small attack + release for click-free
  g.gain.setValueAtTime(0, startT);
  g.gain.linearRampToValueAtTime(volume, startT + 0.005);
  g.gain.linearRampToValueAtTime(volume * 0.7, startT + durT * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, startT + durT);
  osc.connect(g);
  if (masterGain) g.connect(masterGain);
  else g.connect(c.destination);
  osc.start(startT);
  osc.stop(startT + durT + 0.05);
}

function scheduleKick(c: AudioContext, startT: number) {
  // Synth kick: short pitch-down + click
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, startT);
  osc.frequency.exponentialRampToValueAtTime(40, startT + 0.15);
  g.gain.setValueAtTime(0, startT);
  g.gain.linearRampToValueAtTime(0.3, startT + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, startT + 0.18);
  osc.connect(g);
  if (masterGain) g.connect(masterGain);
  else g.connect(c.destination);
  osc.start(startT);
  osc.stop(startT + 0.2);
}

function scheduleStep(c: AudioContext, idx: number, t: number) {
  const stepDur = STEP_DUR;
  const i = idx % BASS_PATTERN.length;
  // bass: square, longer note
  scheduleVoice(c, BASS_PATTERN[i], "square", t, stepDur * 1.8, 0.13, -8);
  // lead: square, snappy
  scheduleVoice(c, LEAD_PATTERN[i], "square", t, stepDur * 1.05, 0.07, +6);
  // harmony: triangle pad
  scheduleVoice(c, HARM_PATTERN[i], "triangle", t, stepDur * 3.5, 0.06);
  if (KICK_PATTERN[i]) scheduleKick(c, t);
}

function tick() {
  const c = getCtx();
  if (!c || !running) return;
  while (nextNoteTime < c.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(c, stepIdx, nextNoteTime);
    nextNoteTime += STEP_DUR;
    stepIdx = (stepIdx + 1) % BASS_PATTERN.length;
  }
}

export function startMusic() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  if (running) {
    // Already running — just unmute
    fadeMaster(0.18, 0.4);
    return;
  }
  running = true;
  stepIdx = 0;
  nextNoteTime = c.currentTime + 0.06;
  fadeMaster(0.18, 0.4);
  if (scheduler !== null) window.clearInterval(scheduler);
  scheduler = window.setInterval(tick, LOOK_AHEAD_MS);
}

export function stopMusic() {
  const c = getCtx();
  if (!c) {
    running = false;
    if (scheduler !== null) {
      window.clearInterval(scheduler);
      scheduler = null;
    }
    return;
  }
  fadeMaster(0, 0.3);
  // Stop the scheduler shortly after fade so currently-scheduled notes finish
  window.setTimeout(() => {
    running = false;
    if (scheduler !== null) {
      window.clearInterval(scheduler);
      scheduler = null;
    }
  }, 350);
}

function fadeMaster(target: number, durSec: number) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const t = c.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setValueAtTime(masterGain.gain.value, t);
  masterGain.gain.linearRampToValueAtTime(target, t + durSec);
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
