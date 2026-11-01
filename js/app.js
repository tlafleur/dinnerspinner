import { h } from './util.js';
import { store } from './store.js';
import { unlock, setEnabled, sfx } from './sound.js';
import { setFxEnabled } from './fx.js';
import { renderSpin, cleanupSpin } from './ui/spin.js';
import { renderWeek } from './ui/week.js';
import { renderShop } from './ui/shop.js';
import { renderPantry } from './ui/pantry.js';
import { renderFamily } from './ui/family.js';
import { renderMeals } from './ui/meals.js';
import { renderSettings } from './ui/settings.js';
import { openSheet } from './ui/components.js';

const ROUTES = {
  spin: { render: renderSpin, cleanup: cleanupSpin, title: 'Tonight' },
  week: { render: renderWeek, title: 'Week' },
  shop: { render: renderShop, title: 'Shop' },
  pantry: { render: renderPantry, title: 'Pantry' },
  family: { render: renderFamily, title: 'Family' },
  meals: { render: renderMeals, title: 'Meals' },
  settings: { render: renderSettings, title: 'Settings' },
};

const main = document.getElementById('main');
let current = null;

function route() {
  const name = (location.hash || '#spin').slice(1).split('?')[0];
  const r = ROUTES[name] || ROUTES.spin;
  if (current && current !== r && current.cleanup) current.cleanup();
  current = r;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.getAttribute('href') === '#' + name));
  document.querySelectorAll('.topbtn').forEach(t => t.classList.toggle('on', t.getAttribute('href') === '#' + name));
  main.scrollTop = 0;
  r.render(main);
}

function rerender() {
  if (!current) return;
  // Don't blow away a spinning wheel or reels mid-animation.
  if (document.body.classList.contains('spinning') || document.querySelector('.machine.spinning')) return;
  const top = main.scrollTop;
  current.render(main);
  main.scrollTop = top;
}

function applyPrefs() {
  const s = store.get().settings;
  setEnabled(s.sound);
  setFxEnabled(s.fx);
}

function onboard() {
  const st = store.get();
  if (st.onboarded) return;
  const sheet = openSheet({ title: 'Welcome to Dinner Spinner! 🎡', big: true, onClose: () => store.update(s => { s.onboarded = true; }) });
  sheet.setBody(h('div', { class: 'onboard' },
    h('p', {}, 'The game-show way to answer "what\'s for dinner?"'),
    h('ul', { class: 'onboard-list' },
      h('li', {}, h('b', {}, '🎡 Tonight'), ' — spin the wheel. Bigger slices are family favorites.'),
      h('li', {}, h('b', {}, '🎰 Week'), ' — pull the lever to fill the week, hold the keepers, lock it in.'),
      h('li', {}, h('b', {}, '🛒 Shop'), ' — the list writes itself, scaled to your family.'),
      h('li', {}, h('b', {}, '🧺 Pantry'), ' — tap what you have, then do a Fridge Raid spin.'),
      h('li', {}, h('b', {}, '👨‍👩‍👧 Family'), ' — diets, dislikes, kid ratings and Build-a-Plate for picky nights.')),
    h('div', { class: 'row gap' },
      h('a', { class: 'btn btn-primary grow', href: '#family', onClick: () => sheet.close() }, '👨‍👩‍👧 Set up the family'),
      h('button', { class: 'btn btn-ghost grow', onClick: () => sheet.close() }, '🎡 Just spin!'))));
}

// Unlock audio on the first touch (iOS requirement).
const first = () => { unlock(); window.removeEventListener('touchstart', first); window.removeEventListener('click', first); };
window.addEventListener('touchstart', first, { passive: true });
window.addEventListener('click', first);

window.addEventListener('hashchange', route);
store.subscribe(rerender);
applyPrefs();
route();
onboard();

// Add-to-home-screen nudge: show once on iOS Safari (not standalone).
const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
if (!standalone && /iphone|ipad/i.test(navigator.userAgent) && !localStorage.getItem('ds.a2hs')) {
  setTimeout(() => {
    const tip = h('div', { class: 'a2hs' }, '📲 Tap ', h('b', {}, 'Share'), ' → ', h('b', {}, 'Add to Home Screen'), ' for the full-screen app.', h('button', { class: 'link', onClick: () => { tip.remove(); localStorage.setItem('ds.a2hs', '1'); } }, 'Got it'));
    document.body.appendChild(tip);
  }, 4000);
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
