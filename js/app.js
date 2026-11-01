import { h } from './util.js';
import { store } from './store.js';
import { unlock, resume, setEnabled, setVoice, sfx, say } from './sound.js';
import { setFxEnabled, burst } from './fx.js';
import { newlyEarned } from './badges.js';
import { toast } from './ui/components.js';
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
  setVoice(s.voice);
  setFxEnabled(s.fx);
  document.documentElement.dataset.text = s.textSize || 'normal';
  const b = document.getElementById('soundbtn');
  if (b) { b.textContent = s.sound ? '🔊' : '🔇'; b.classList.toggle('muted', !s.sound); b.title = s.sound ? 'Mute' : 'Unmute'; }
}

document.getElementById('soundbtn').addEventListener('click', () => {
  store.update(s => { s.settings.sound = !s.settings.sound; }, { silent: true });
  applyPrefs();
  if (store.get().settings.sound) sfx.ding();
});

// Award stickers whenever state changes.
let awarding = false;
function checkBadges(state) {
  if (awarding) return;
  const earned = newlyEarned(state);
  if (!earned.length) return;
  awarding = true;
  store.update(s => { for (const b of earned) s.badges[b.id] = new Date().toISOString().slice(0, 10); }, { silent: true });
  earned.forEach((b, i) => setTimeout(() => {
    sfx.badge(); burst({ count: 70, emoji: [b.emoji, '⭐'] });
    toast(`Sticker unlocked: ${b.name}!`, { emoji: b.emoji, ms: 3000 });
    if (i === 0) say(`Sticker unlocked! ${b.name}!`, { delay: 300 });
  }, 900 + i * 2200));
  setTimeout(() => { awarding = false; }, 1000 + earned.length * 2200);
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

// Unlock audio on the first touch (iOS requirement), and re-wake it on every later tap
// in case iOS interrupted it (speech, a call, backgrounding).
let unlocked = false;
const wake = () => { if (!unlocked) { unlock(); unlocked = true; } else resume(); };
window.addEventListener('touchstart', wake, { passive: true });
window.addEventListener('pointerdown', wake, { passive: true });
window.addEventListener('click', wake);
document.addEventListener('visibilitychange', () => { if (!document.hidden) resume(); });

window.addEventListener('hashchange', route);
store.subscribe(rerender);
store.subscribe(checkBadges);
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
