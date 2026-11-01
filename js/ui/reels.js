// A vertical slot-machine reel built from DOM nodes and a CSS transform transition.
import { h, clear, reducedMotion } from '../util.js';
import { sfx } from '../sound.js';


/** symbols: [{ id, emoji, name }] */
export function createReel({ label = '', onStop } = {}) {
  const strip = h('div', { class: 'reel-strip' });
  const window_ = h('div', { class: 'reel-window' }, strip, h('div', { class: 'reel-shade' }));
  const el = h('div', { class: 'reel' }, label ? h('div', { class: 'reel-label' }, label) : null, window_);
  let current = null;
  let spinning = false;

  function sym(s) {
    return h('div', { class: 'reel-sym' + (s.wild ? ' wild' : '') }, h('div', { class: 'reel-emoji' }, s.emoji), h('div', { class: 'reel-name' }, s.name));
  }

  const symH = () => (strip.firstChild ? strip.firstChild.offsetHeight : 0);
  /** translateY that centers symbol `idx` in the window. */
  function offsetFor(idx) { return (window_.clientHeight - symH()) / 2 - idx * symH(); }
  function place(idx, tries = 0) {
    if ((!symH() || !window_.clientHeight) && tries < 20) { requestAnimationFrame(() => place(idx, tries + 1)); return; }
    strip.style.transform = `translateY(${offsetFor(idx)}px)`;
  }

  function show(s) {
    current = s;
    strip.style.transition = 'none';
    clear(strip);
    strip.append(sym({ emoji: '✨', name: '' }), sym(s), sym({ emoji: '✨', name: '' }));
    place(1);
  }

  /** Spin through `filler` symbols and land on `final`. Resolves when stopped. */
  function spinTo(final, filler, { duration = 1500, delay = 0 } = {}) {
    return new Promise(resolve => {
      spinning = true;
      el.classList.add('spinning');
      const reduce = reducedMotion();
      const count = reduce ? 3 : 10 + Math.floor(duration / 110);
      clear(strip);
      strip.style.transition = 'none';
      const list = [current || { emoji: '✨', name: '' }];
      for (let i = 0; i < count; i++) list.push(filler[Math.floor(Math.random() * filler.length)] || { emoji: '✨', name: '' });
      list.push(final, { emoji: '✨', name: '' });
      for (const s of list) strip.append(sym(s));
      strip.style.transform = `translateY(${offsetFor(0)}px)`;
      void strip.offsetHeight; // reflow
      const finalIndex = list.length - 2;
      setTimeout(() => {
        sfx.reelSpin();
        strip.style.transition = `transform ${reduce ? 400 : duration}ms cubic-bezier(.12,.75,.2,1.06)`;
        strip.style.transform = `translateY(${offsetFor(finalIndex)}px)`;
        const done = () => {
          strip.removeEventListener('transitionend', done);
          spinning = false;
          el.classList.remove('spinning');
          el.classList.add('landed');
          setTimeout(() => el.classList.remove('landed'), 400);
          current = final;
          sfx.clunk();
          onStop && onStop(final);
          resolve(final);
        };
        strip.addEventListener('transitionend', done);
        setTimeout(() => { if (spinning) done(); }, (reduce ? 400 : duration) + 300); // safety
      }, delay);
    });
  }

  return { el, show, spinTo, get current() { return current; }, isSpinning: () => spinning };
}
