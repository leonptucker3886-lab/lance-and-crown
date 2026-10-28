// Tiny procedural sound engine — no audio files, everything is synthesised.

let ctx = null;
let master = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function unlock() {
  ac();
}

export function setMuted(v) {
  muted = v;
  if (master) master.gain.value = v ? 0 : 0.6;
}

export function isMuted() {
  return muted;
}

function tone({ type = 'sine', f0 = 440, f1 = f0, dur = 0.15, vol = 0.3, delay = 0, curve = 'exp' }) {
  const a = ac();
  if (!a || muted) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, f0), t0);
  if (curve === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  else osc.frequency.linearRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noise({ dur = 0.3, vol = 0.3, delay = 0, f0 = 1200, f1 = 300, q = 1, type = 'lowpass' }) {
  const a = ac();
  if (!a || muted) return;
  const t0 = a.currentTime + delay;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filt = a.createBiquadFilter();
  filt.type = type;
  filt.Q.value = q;
  filt.frequency.setValueAtTime(f0, t0);
  filt.frequency.exponentialRampToValueAtTime(Math.max(60, f1), t0 + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(master);
  src.start(t0);
}

export const Sfx = {
  tap() {
    tone({ type: 'triangle', f0: 620, f1: 880, dur: 0.07, vol: 0.12 });
  },
  ui() {
    tone({ type: 'triangle', f0: 400, f1: 520, dur: 0.06, vol: 0.1 });
  },
  lock() {
    tone({ type: 'square', f0: 300, f1: 460, dur: 0.09, vol: 0.08 });
    tone({ type: 'sine', f0: 900, f1: 1200, dur: 0.1, vol: 0.06, delay: 0.03 });
  },
  hoof(rate = 1) {
    noise({ dur: 0.09, vol: 0.09 * rate, f0: 420, f1: 90, q: 2.5 });
  },
  whoosh() {
    noise({ dur: 0.5, vol: 0.16, f0: 2600, f1: 320, q: 0.8, type: 'bandpass' });
  },
  good() {
    tone({ type: 'triangle', f0: 520, f1: 780, dur: 0.14, vol: 0.16 });
  },
  perfect() {
    tone({ type: 'sawtooth', f0: 660, f1: 990, dur: 0.1, vol: 0.1 });
    tone({ type: 'triangle', f0: 990, f1: 1480, dur: 0.18, vol: 0.14, delay: 0.06 });
  },
  poor() {
    tone({ type: 'sine', f0: 240, f1: 130, dur: 0.2, vol: 0.16 });
  },
  impact(big = 1) {
    noise({ dur: 0.36, vol: 0.42 * big, f0: 2400, f1: 120, q: 0.6 });
    tone({ type: 'square', f0: 180, f1: 48, dur: 0.26, vol: 0.3 * big });
    tone({ type: 'triangle', f0: 90, f1: 40, dur: 0.4, vol: 0.22 * big, delay: 0.02 });
  },
  crack() {
    noise({ dur: 0.22, vol: 0.3, f0: 5200, f1: 900, q: 1.4, type: 'bandpass' });
    tone({ type: 'square', f0: 1400, f1: 400, dur: 0.1, vol: 0.1 });
  },
  cheer() {
    noise({ dur: 1.1, vol: 0.16, f0: 900, f1: 1600, q: 0.5, type: 'bandpass' });
    noise({ dur: 0.9, vol: 0.1, f0: 1600, f1: 700, q: 0.4, type: 'bandpass', delay: 0.2 });
  },
  boo() {
    noise({ dur: 0.9, vol: 0.14, f0: 300, f1: 160, q: 0.7, type: 'lowpass' });
  },
  coin() {
    tone({ type: 'triangle', f0: 1180, f1: 1180, dur: 0.07, vol: 0.12 });
    tone({ type: 'triangle', f0: 1560, f1: 1560, dur: 0.12, vol: 0.12, delay: 0.07 });
  },
  fanfare() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => tone({ type: 'triangle', f0: f, f1: f, dur: 0.34, vol: 0.16, delay: i * 0.12 }));
  },
  defeat() {
    const notes = [392, 349, 294, 233];
    notes.forEach((f, i) => tone({ type: 'sine', f0: f, f1: f * 0.99, dur: 0.4, vol: 0.16, delay: i * 0.16 }));
  },
  upgrade() {
    [620, 830, 1240].forEach((f, i) => tone({ type: 'triangle', f0: f, f1: f * 1.02, dur: 0.18, vol: 0.14, delay: i * 0.08 }));
  },
};

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* not supported — ignore */
  }
}
