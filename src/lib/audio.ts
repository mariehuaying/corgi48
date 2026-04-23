let audioCtx: AudioContext | null = null;
let soundEnabled =
  typeof window !== "undefined"
    ? localStorage.getItem("corgi48-sound") !== "off"
    : true;

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("corgi48-sound", enabled ? "on" : "off");
  }
}

export function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function playMergeChime() {
  if (!soundEnabled || !audioCtx || audioCtx.state !== "running") return;

  const ctx = audioCtx;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const duration = 0.08;

  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = notes[i];
    const start = now + i * 0.06;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.12);
  }
}
