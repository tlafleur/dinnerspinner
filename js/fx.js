// Confetti and emoji bursts on a full-screen canvas overlay.
let canvas, ctx, parts = [], raf = 0, enabled = true;
const COLORS = ['#FF6B6B', '#FFA94D', '#FFD43B', '#A9E34B', '#63E6BE', '#4DABF7', '#9775FA', '#F783AC'];

export function setFxEnabled(v) { enabled = !!v; }

function ensure() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** burst({ x, y, count, emoji: ['🍕'], spread, power }) coordinates in CSS px. */
export function burst({ x = innerWidth / 2, y = innerHeight / 2, count = 80, emoji = [], spread = Math.PI, power = 12, dir = -Math.PI / 2 } = {}) {
  if (!enabled) return;
  ensure();
  for (let i = 0; i < count; i++) {
    const a = dir + (Math.random() - 0.5) * spread;
    const v = power * (0.4 + Math.random());
    const isEmoji = emoji.length && Math.random() < 0.25;
    parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.35 + Math.random() * 0.2,
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 8, hh: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      emoji: isEmoji ? emoji[Math.floor(Math.random() * emoji.length)] : null,
      life: 1, decay: 0.006 + Math.random() * 0.008, drag: 0.985,
    });
  }
  if (!raf) raf = requestAnimationFrame(step);
}

export function rain({ count = 60, emoji = [] } = {}) {
  if (!enabled) return;
  ensure();
  for (let i = 0; i < count; i++) {
    setTimeout(() => burst({ x: Math.random() * innerWidth, y: -20, count: 1, emoji, power: 2, dir: Math.PI / 2, spread: 0.5 }), i * 25);
  }
}

function step() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const next = [];
  for (const p of parts) {
    p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
    p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
    if (p.life <= 0 || p.y > innerHeight + 40) continue;
    next.push(p);
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.emoji) { ctx.font = '22px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.emoji, 0, 0); }
    else { ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.hh / 2, p.w, p.hh); }
    ctx.restore();
  }
  parts = next;
  if (parts.length) raf = requestAnimationFrame(step); else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
