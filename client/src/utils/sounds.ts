// Tiny synthesized sound effects via Web Audio — no asset files to manage or load.
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function beep(freq: number, durationMs: number, volume: number, delayMs = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const startAt = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + durationMs / 1000);
}

export function playTypingSound() {
  beep(900, 30, 0.015);
}

export function playIncomingSound() {
  beep(600, 90, 0.05);
  beep(880, 120, 0.05, 90);
}
