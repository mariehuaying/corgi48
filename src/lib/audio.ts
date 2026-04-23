let audioCtx: AudioContext | null = null;
let isUnlocked = false;
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
    console.log("[audio] Created AudioContext, state:", audioCtx.state);
  }
  if (audioCtx.state === "suspended") {
    console.log("[audio] Resuming AudioContext...");
    audioCtx.resume().then(() => {
      console.log("[audio] AudioContext resumed, state:", audioCtx?.state);
    }).catch((err) => {
      console.error("[audio] Resume failed:", err);
    });
  }
}

function unlockAudioContext() {
  if (isUnlocked) return;
  console.log("[audio] unlockAudioContext triggered via touchstart");
  ensureAudioContext();
  if (!audioCtx) {
    console.error("[audio] audioCtx is null after ensureAudioContext");
    return;
  }
  try {
    const buffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    isUnlocked = true;
    console.log("[audio] Silent unlock buffer played successfully, isUnlocked:", isUnlocked, "state:", audioCtx.state);
  } catch (err) {
    console.error("[audio] Silent unlock buffer failed:", err);
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("touchstart", unlockAudioContext, { once: true });
}

export function debugTestSound() {
  console.log("[audio] === debugTestSound ===");
  console.log("[audio] audioCtx exists:", !!audioCtx, "state:", audioCtx?.state);
  console.log("[audio] isUnlocked:", isUnlocked, "soundEnabled:", soundEnabled);

  ensureAudioContext();

  console.log("[audio] After ensureAudioContext - state:", audioCtx?.state);

  if (audioCtx && !isUnlocked) {
    try {
      const buffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
      isUnlocked = true;
      console.log("[audio] Manual unlock succeeded");
    } catch (err) {
      console.error("[audio] Manual unlock failed:", err);
    }
  }

  // Force play chime regardless of soundEnabled
  if (audioCtx && audioCtx.state === "running") {
    console.log("[audio] Playing chime...");
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
    console.log("[audio] Chime scheduled");
  } else {
    console.warn("[audio] Cannot play - ctx:", !!audioCtx, "state:", audioCtx?.state);
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
