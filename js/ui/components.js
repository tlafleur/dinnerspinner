import { h, clear, append } from '../util.js';
import { sfx } from '../sound.js';

/** Bottom sheet modal. Returns { el, close }. */
export function openSheet({ title, body, big = false, onClose } = {}) {
  const sheet = h('div', { class: 'sheet' + (big ? ' sheet-big' : ''), role: 'dialog', 'aria-modal': 'true' });
  const backdrop = h('div', { class: 'backdrop' });
  const closeBtn = h('button', { class: 'sheet-close', 'aria-label': 'Close', onClick: () => close() }, '✕');
  const head = h('div', { class: 'sheet-head' }, h('div', { class: 'sheet-grip' }), title ? h('h2', { class: 'sheet-title' }, title) : null, closeBtn);
  const content = h('div', { class: 'sheet-body' });
  append(content, [body]);
  sheet.append(head, content);
  const wrap = h('div', { class: 'sheet-wrap' }, backdrop, sheet);
  document.body.appendChild(wrap);
  document.body.classList.add('has-sheet');
  requestAnimationFrame(() => wrap.classList.add('open'));
  let closed = false;
  function close() {
    if (closed) return; closed = true;
    wrap.classList.remove('open');
    document.body.classList.remove('has-sheet');
    setTimeout(() => wrap.remove(), 260);
    onClose && onClose();
  }
  backdrop.addEventListener('click', close);
  return { el: sheet, body: content, close, setBody(b) { clear(content); append(content, [b]); } };
}

let toastTimer = null;
export function toast(msg, { emoji = '', ms = 2200 } = {}) {
  let t = document.querySelector('.toast');
  if (!t) { t = h('div', { class: 'toast' }); document.body.appendChild(t); }
  t.textContent = (emoji ? emoji + ' ' : '') + msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export function confirm(msg, { ok = 'Yes', cancel = 'Cancel', danger = false } = {}) {
  return new Promise(resolve => {
    const s = openSheet({
      title: msg,
      body: h('div', { class: 'row gap' },
        h('button', { class: 'btn btn-ghost grow', onClick: () => { s.close(); resolve(false); } }, cancel),
        h('button', { class: 'btn grow ' + (danger ? 'btn-danger' : 'btn-primary'), onClick: () => { s.close(); resolve(true); } }, ok)),
      onClose: () => resolve(false),
    });
  });
}

export function chip({ label, emoji = '', on = false, onToggle, small = false, color = '' }) {
  const b = h('button', { class: 'chip' + (on ? ' on' : '') + (small ? ' chip-sm' : '') + (color ? ' chip-' + color : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false' },
    emoji ? h('span', { class: 'chip-emoji' }, emoji) : null, label);
  b.addEventListener('click', () => {
    const now = !b.classList.contains('on');
    b.classList.toggle('on', now);
    b.setAttribute('aria-pressed', now ? 'true' : 'false');
    sfx.click();
    onToggle && onToggle(now);
  });
  return b;
}

export function avatar(member, { size = '', verdict = null } = {}) {
  const v = verdict ? { love: '❤️', ok: '👍', no: '🙅', unknown: '❓' }[verdict] : null;
  return h('span', { class: 'avatar ' + size + (verdict ? ' v-' + verdict : ''), title: member.name + (v ? ' ' + v : '') },
    h('span', { class: 'avatar-emoji' }, member.emoji),
    v ? h('span', { class: 'avatar-badge' }, v) : null);
}

export function stars(n) {
  return h('span', { class: 'stars', title: `Kid-friendly ${n}/5` }, '⭐'.repeat(n));
}

export function emptyState(emoji, title, text, action) {
  return h('div', { class: 'empty' }, h('div', { class: 'empty-emoji' }, emoji), h('h3', {}, title), text ? h('p', {}, text) : null, action || null);
}

export function section(title, ...kids) {
  return h('section', { class: 'card' }, title ? h('h2', { class: 'card-title' }, title) : null, ...kids);
}

export function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', { class: 'label' }, label), input, hint ? h('small', {}, hint) : null);
}

export function segmented(options, value, onChange) {
  const wrap = h('div', { class: 'segmented', role: 'group' });
  for (const [v, label] of options) {
    const b = h('button', { type: 'button', class: 'seg' + (v === value ? ' on' : '') }, label);
    b.addEventListener('click', () => { wrap.querySelectorAll('.seg').forEach(x => x.classList.remove('on')); b.classList.add('on'); sfx.click(); onChange(v); });
    wrap.appendChild(b);
  }
  return wrap;
}
