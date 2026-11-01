// Synthesized sound effects with the Web Audio API. No audio files needed.
let ctx = null, master = null, enabled = true;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  // Safari reports 'interrupted' (phone call, speech synthesis, Siri) as well as 'suspended'.
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

/** Wake the context back up; safe to call from any user gesture. */
export function resume() { try { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); } catch {} }

/** Call from a user gesture (iOS requires it) to unlock audio. Safe to call repeatedly. */
export function unlock() {
  try {
    const c = ensure(); if (!c) return;
    // iOS 17+: play through the ring/silent switch like a game would. The app has its own mute button.
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch {}
    if (c.state !== 'running') c.resume().catch(() => {});
    const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
  } catch {}
}
export const audioState = () => (ctx ? ctx.state : 'not created');
export const isUnlocked = () => !!ctx && ctx.state === 'running';
export function setEnabled(v) { enabled = !!v; }
export const isEnabled = () => enabled;

function tone({ f = 440, type = 'sine', t = 0, d = 0.1, g = 0.3, slide = null, attack = 0.005 }) {
  const c = ensure(); if (!c || !enabled) return;
  const o = c.createOscillator(), v = c.createGain();
  const t0 = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + d);
  v.gain.setValueAtTime(0.0001, t0);
  v.gain.exponentialRampToValueAtTime(g, t0 + attack);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(v); v.connect(master);
  o.start(t0); o.stop(t0 + d + 0.05);
}

function noise({ t = 0, d = 0.2, g = 0.2, f = 1200, q = 0.7, type = 'bandpass', slide = null }) {
  const c = ensure(); if (!c || !enabled) return;
  const n = Math.floor(c.sampleRate * d);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const flt = c.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
  const v = c.createGain();
  const t0 = c.currentTime + t;
  if (slide) flt.frequency.exponentialRampToValueAtTime(slide, t0 + d);
  v.gain.setValueAtTime(g, t0);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  src.connect(flt); flt.connect(v); v.connect(master);
  src.start(t0); src.stop(t0 + d + 0.05);
}

export const sfx = {
  click() { tone({ f: 700, type: 'square', d: 0.035, g: 0.06 }); },
  tick() { tone({ f: 1500 + Math.random() * 400, type: 'triangle', d: 0.035, g: 0.12 }); noise({ d: 0.02, g: 0.05, f: 4000 }); },
  whoosh() { noise({ d: 0.6, g: 0.18, f: 400, slide: 3000, q: 0.5 }); },
  lever() { noise({ d: 0.18, g: 0.14, f: 900, slide: 200 }); tone({ f: 220, slide: 90, d: 0.25, type: 'triangle', g: 0.2 }); },
  reelSpin() { noise({ d: 0.35, g: 0.1, f: 1500, slide: 600 }); },
  clunk() { tone({ f: 150, slide: 60, d: 0.14, type: 'sine', g: 0.45 }); noise({ d: 0.05, g: 0.25, f: 800, type: 'lowpass' }); },
  ding() { tone({ f: 880, type: 'sine', d: 0.5, g: 0.25 }); tone({ f: 1320, type: 'sine', d: 0.6, g: 0.12, t: 0.02 }); },
  pop() { tone({ f: 250, slide: 700, type: 'sine', d: 0.09, g: 0.25 }); },
  boo() { tone({ f: 320, slide: 140, type: 'sawtooth', d: 0.45, g: 0.1 }); },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: 'square', t: i * 0.09, d: 0.22, g: 0.1 }));
    tone({ f: 1047, type: 'triangle', t: 0.38, d: 0.7, g: 0.18 });
    tone({ f: 1319, type: 'triangle', t: 0.38, d: 0.7, g: 0.1 });
    noise({ t: 0.38, d: 0.5, g: 0.1, f: 3000, type: 'highpass' });
  },
  coins(n = 10) {
    for (let i = 0; i < n; i++) {
      const f = 1800 + (i % 4) * 230 + Math.random() * 120;
      tone({ f, type: 'square', t: i * 0.075, d: 0.09, g: 0.07 });
      tone({ f: f * 1.5, type: 'sine', t: i * 0.075 + 0.01, d: 0.12, g: 0.05 });
    }
  },
  jackpot() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
    notes.forEach((f, i) => tone({ f, type: 'square', t: i * 0.11, d: 0.2, g: 0.11 }));
    tone({ f: 2093, type: 'triangle', t: 0.9, d: 1.2, g: 0.18 });
    sfx.coins(16);
  },
  cheer() { tone({ f: 660, type: 'triangle', d: 0.15, g: 0.2 }); tone({ f: 990, type: 'triangle', t: 0.12, d: 0.3, g: 0.2 }); },
  sparkle() { [1568, 2093, 2637].forEach((f, i) => tone({ f, type: 'sine', t: i * 0.06, d: 0.25, g: 0.08 })); },
  buzz() { tone({ f: 110, type: 'sawtooth', d: 0.55, g: 0.22 }); tone({ f: 116, type: 'square', d: 0.55, g: 0.12 }); },
  badge() { [660, 880, 1320, 1760].forEach((f, i) => tone({ f, type: 'triangle', t: i * 0.08, d: 0.35, g: 0.12 })); noise({ t: 0.3, d: 0.4, g: 0.08, f: 5000, type: 'highpass' }); },
  drum() { for (let i = 0; i < 6; i++) { tone({ f: 90, slide: 50, type: 'sine', t: i * 0.09, d: 0.08, g: 0.3 }); noise({ t: i * 0.09, d: 0.05, g: 0.12, f: 600, type: 'lowpass' }); } },
  faceoff() { tone({ f: 330, type: 'square', d: 0.12, g: 0.12 }); tone({ f: 330, type: 'square', t: 0.16, d: 0.12, g: 0.12 }); tone({ f: 494, type: 'square', t: 0.32, d: 0.4, g: 0.14 }); },
};
