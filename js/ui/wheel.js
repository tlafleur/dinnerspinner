// Canvas prize wheel. Segments can have different weights (bigger slice = favorite).
import { sfx } from '../sound.js';
import { reducedMotion } from '../util.js';

const COLORS = ['#FF6B6B', '#FFA94D', '#FFD43B', '#A9E34B', '#63E6BE', '#4DABF7', '#9775FA', '#F783AC', '#FF8787', '#FFC078', '#8CE99A', '#74C0FC'];
const TAU = Math.PI * 2;

/** Split a label into at most two lines that fit maxW; the second line is ellipsized if needed. */
function wrapLabel(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return [text];
  const words = text.split(' ');
  let first = '';
  for (const w of words) {
    const t = first ? first + ' ' + w : w;
    if (ctx.measureText(t).width > maxW) break;
    first = t;
  }
  if (!first) first = words[0];
  let rest = text.slice(first.length).trim();
  if (!rest) return [first];
  while (ctx.measureText(rest).width > maxW && rest.length > 3) rest = rest.slice(0, -2) + '…';
  return [first, rest];
}

export function createWheel(canvas, { onTick, onDone, onTap, onFlick } = {}) {
  const ctx = canvas.getContext('2d');
  let segments = [];   // [{ label, emoji, weight }]
  let angles = [];     // [{ start, end }]
  let rotation = 0;    // radians, clockwise positive
  let spinning = false;
  let raf = 0;
  let size = 300;

  function layout() {
    const total = segments.reduce((s, x) => s + x.weight, 0) || 1;
    let a = 0;
    angles = segments.map(s => { const span = (s.weight / total) * TAU; const r = { start: a, end: a + span }; a += span; return r; });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    size = Math.max(100, Math.floor(rect.width));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = size * dpr; canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const r = size / 2, cx = r, cy = r;
    ctx.clearRect(0, 0, size, size);
    if (!segments.length) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation - Math.PI / 2); // angle 0 at top
    const n = segments.length;
    for (let i = 0; i < n; i++) {
      const { start, end } = angles[i];
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - 4, start, end); ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
      // label
      const mid = (start + end) / 2, span = end - start;
      ctx.save();
      ctx.rotate(mid);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const big = span > 0.5;
      const fs = Math.max(11, Math.min(21, r * 0.082 * (big ? 1 : 0.85)));
      ctx.font = `700 ${fs}px Fredoka, ui-rounded, system-ui, sans-serif`;
      ctx.fillStyle = '#2B2140';
      const maxW = r * 0.56;
      const lines = wrapLabel(ctx, segments[i].label, maxW);
      const lh = fs * 1.05;
      const x = r - r * 0.24;
      if (lines.length === 1 || span < 0.35) {
        let label = lines.length === 1 ? lines[0] : segments[i].label;
        while (ctx.measureText(label).width > maxW && label.length > 3) label = label.slice(0, -2) + '…';
        ctx.fillText(label, x, 0);
      } else {
        ctx.fillText(lines[0], x, -lh / 2);
        ctx.fillText(lines[1], x, lh / 2);
      }
      ctx.font = `${Math.max(16, r * 0.13)}px system-ui, "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(segments[i].emoji || '🍽️', r - r * 0.12, 0);
      ctx.restore();
    }
    // rim
    ctx.beginPath(); ctx.arc(0, 0, r - 3, 0, TAU);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r - 1, 0, TAU);
    ctx.strokeStyle = 'rgba(43,33,64,0.15)'; ctx.lineWidth = 2; ctx.stroke();
    // pegs
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate(angles[i].start);
      ctx.beginPath(); ctx.arc(r - 10, 0, 4, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function indexAt(rot) {
    // segment under the top pointer for rotation rot
    const a = ((-rot) % TAU + TAU) % TAU;
    for (let i = 0; i < angles.length; i++) if (a >= angles[i].start && a < angles[i].end) return i;
    return angles.length - 1;
  }

  function spin(winner, { turns = 5 + Math.random() * 3, duration = 4200 + Math.random() * 900, dir = 1 } = {}) {
    if (spinning || !segments.length) return;
    spinning = true;
    canvas.classList.remove('idle');
    if (reducedMotion()) { duration = 900; turns = 1; }
    const { start, end } = angles[winner];
    const pad = (end - start) * 0.15;
    const target = start + pad + Math.random() * (end - start - 2 * pad);
    const current = ((rotation % TAU) + TAU) % TAU;
    const from = rotation;
    const fwd = ((-target - current) % TAU + TAU) % TAU;
    const back = ((current + target) % TAU + TAU) % TAU;
    const to = dir >= 0 ? rotation + turns * TAU + fwd : rotation - turns * TAU - back;
    const t0 = performance.now();
    let lastIdx = indexAt(rotation);
    sfx.whoosh();
    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - t, 4);
      rotation = from + (to - from) * e;
      const idx = indexAt(rotation);
      if (idx !== lastIdx) { lastIdx = idx; sfx.tick(); onTick && onTick(idx); }
      draw();
      if (t < 1) raf = requestAnimationFrame(frame);
      else { spinning = false; rotation = to % TAU; draw(); canvas.classList.add('idle'); onDone && onDone(indexAt(rotation)); }
    }
    raf = requestAnimationFrame(frame);
  }

  // Tap to spin, or grab and flick: the wheel follows the finger, then launches with the release velocity.
  let drag = null;
  const angleOf = e => { const r = canvas.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
  canvas.addEventListener('pointerdown', e => {
    if (spinning) return;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.remove('idle');
    drag = { a: angleOf(e), t: performance.now(), v: 0, moved: 0, start: rotation };
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag || spinning) return;
    const a = angleOf(e), now = performance.now();
    let d = a - drag.a; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
    const dt = Math.max(1, now - drag.t);
    drag.v = 0.6 * drag.v + 0.4 * (d / dt) * 1000; // rad/s, smoothed
    drag.a = a; drag.t = now; drag.moved += Math.abs(d);
    rotation += d; draw();
  });
  const release = e => {
    if (!drag) return;
    const { v, moved } = drag; drag = null;
    if (spinning) return;
    if (moved < 0.08) { onTap && onTap(); return; }
    if (Math.abs(v) > 1.2 && onFlick) onFlick(v);
    else canvas.classList.add('idle');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.classList.add('idle');
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  ro && ro.observe(canvas);

  return {
    setSegments(s) { segments = s; layout(); draw(); },
    getSegments: () => segments,
    spin, resize, draw,
    isSpinning: () => spinning,
    destroy() { cancelAnimationFrame(raf); ro && ro.disconnect(); },
  };
}
