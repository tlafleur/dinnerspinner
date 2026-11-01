// Tonight: the prize wheel.
import { h, timeLabel, todayDay } from '../util.js';
import { store, mealById, sideById } from '../store.js';
import { scoreMeals, weightedSample, todayISO } from '../engine.js';
import { chip, emptyState, toast } from './components.js';
import { createWheel } from './wheel.js';
import { showMealSheet, showRatingSheet, showSideWheel, markCooked, verdictRow } from './mealsheet.js';
import { sfx, say } from '../sound.js';
import { burst } from '../fx.js';
import { CUISINES } from '../data/seed.js';
import { openSheet } from './components.js';

export const spinUI = { filters: { pantry: false, kids: false, quick: false, veg: false, cuisine: '' }, picks: null, rotation: 0 };
const CUISINE_EMOJI = { American: '🍔', Italian: '🍝', Mexican: '🌮', Asian: '🥡', Indian: '🍛', Mediterranean: '🫒', Comfort: '🍲', BBQ: '🍖' };
let wheel = null;

function candidates(st) {
  return scoreMeals(st, spinUI.filters);
}

function pickSubset(st) {
  const cands = candidates(st);
  spinUI.picks = weightedSample(cands, 8);
  return spinUI.picks;
}

export function renderSpin(root) {
  const st = store.get();
  const hasKids = st.members.some(m => m.kid);
  const section = h('section', { class: 'screen spin' });

  // Tonight card
  if (st.tonight && st.tonight.date === todayISO()) {
    const meal = mealById(st.tonight.id);
    const side = st.tonight.sideId ? sideById(st.tonight.sideId) : null;
    if (meal) {
      section.append(h('div', { class: 'card tonight-card' },
        h('div', { class: 'tonight-emoji' }, meal.emoji),
        h('div', { class: 'tonight-text' },
          h('div', { class: 'eyebrow' }, st.tonight.done ? "Tonight's dinner" : "Tonight's pick"),
          h('div', { class: 'tonight-name' }, meal.name, side ? h('span', { class: 'muted' }, ` + ${side.emoji} ${side.name}`) : null),
          h('div', { class: 'row gap-sm wrap' },
            h('button', { class: 'btn btn-sm', onClick: () => showMealSheet(meal.id, { onSide: m => showSideWheel(s => setSide(s.id)) }) }, '📋 Details'),
            h('button', { class: 'btn btn-sm btn-ghost', onClick: () => showRatingSheet(meal.id) }, '⭐ Rate it'),
            h('button', { class: 'btn btn-sm btn-ghost', onClick: () => shareTonight(meal, side) }, '📤'),
            h('button', { class: 'btn btn-sm btn-ghost', onClick: () => { store.update(s => { s.tonight = null; }); toast('Cleared. Spin again!'); } }, '✕'))),
      ));
    }
  }

  section.append(h('h1', { class: 'title' }, "What's for dinner?"));

  // Filter chips
  const chips = h('div', { class: 'chips' },
    chip({ label: 'Fridge raid', emoji: '🧺', on: spinUI.filters.pantry, onToggle: v => setFilter('pantry', v) }),
    hasKids ? chip({ label: 'Kid-approved', emoji: '👧', on: spinUI.filters.kids, onToggle: v => setFilter('kids', v) }) : null,
    chip({ label: 'Quick', emoji: '⚡', on: spinUI.filters.quick, onToggle: v => setFilter('quick', v) }),
    chip({ label: 'Veggie', emoji: '🥦', on: spinUI.filters.veg, onToggle: v => setFilter('veg', v) }),
    chip({ label: spinUI.filters.cuisine || 'Cuisine', emoji: CUISINE_EMOJI[spinUI.filters.cuisine] || '🌍', on: !!spinUI.filters.cuisine, onToggle: v => v ? pickCuisine() : setFilter('cuisine', '') }),
  );
  section.append(chips);

  const picks = spinUI.picks && spinUI.picks.length ? spinUI.picks : pickSubset(st);
  if (!picks.length) {
    section.append(emptyState('🤷', 'Nothing on the wheel', spinUI.filters.pantry ? 'Nothing in your pantry makes a meal yet. Add what you have in the Pantry tab, or turn off Fridge raid.' : 'Loosen the filters or add some meals in the library.',
      h('button', { class: 'btn btn-primary', onClick: () => { Object.keys(spinUI.filters).forEach(k => spinUI.filters[k] = false); spinUI.picks = null; rerender(root); } }, 'Clear filters')));
    root.replaceChildren(section);
    return;
  }

  const canvas = h('canvas', { class: 'wheel-canvas' });
  const hub = h('button', { class: 'hub', 'aria-label': 'Spin the wheel' }, 'SPIN');
  const wrap = h('div', { class: 'wheel-wrap' }, h('div', { class: 'pointer' }), canvas, hub);
  section.append(wrap);
  const hint = h('p', { class: 'hint center' }, 'Tap the wheel or give it a flick! Bigger slice = family favorite.');
  section.append(hint);
  section.append(h('div', { class: 'row center gap' },
    h('button', { class: 'btn btn-ghost btn-sm', onClick: () => { sfx.whoosh(); spinUI.picks = null; rerender(root); } }, '🎲 Reshuffle wheel'),
    h('button', { class: 'btn btn-ghost btn-sm', onClick: () => showWheelList(picks) }, '📋 See the list')));

  wheel && wheel.destroy();
  wheel = createWheel(canvas, {
    onTick: () => { wrap.classList.add('tick'); setTimeout(() => wrap.classList.remove('tick'), 70); },
    onDone: idx => onLanded(picks[idx], canvas, root),
    onTap: () => spin(picks),
    onFlick: v => { store.update(s => { s.stats.flicks++; }, { silent: true }); spin(picks, v); },
  });
  wheel.setSegments(picks.map(p => ({ label: p.meal.name, emoji: p.meal.emoji, weight: Math.max(0.35, Math.sqrt(p.weight)) })));
  hub.addEventListener('click', () => spin(picks));
  requestAnimationFrame(() => wheel.resize());
  root.replaceChildren(section);

  function spin(picks, flick = 0) {
    if (wheel.isSpinning()) return;
    sfx.click();
    say('Round and round it goes!', { delay: 200 });
    document.body.classList.add('spinning');
    // choose winner by weight, so bigger slices really are likelier
    const total = picks.reduce((s, p) => s + Math.max(0.35, Math.sqrt(p.weight)), 0);
    let r = Math.random() * total, winner = picks.length - 1;
    for (let i = 0; i < picks.length; i++) { r -= Math.max(0.35, Math.sqrt(picks[i].weight)); if (r <= 0) { winner = i; break; } }
    hint.textContent = 'Round and round it goes…';
    const speed = Math.min(1, Math.abs(flick) / 12);
    wheel.spin(winner, flick ? { dir: flick > 0 ? 1 : -1, turns: 3 + speed * 6, duration: 3200 + speed * 2500 } : {});
    store.update(s => { s.stats.spins++; }, { silent: true });
  }
}

function setFilter(k, v) { spinUI.filters[k] = v; spinUI.picks = null; rerender(document.getElementById('main')); }
function rerender(root) { renderSpin(root); }

function onLanded(p, canvas, root) {
  document.body.classList.remove('spinning');
  sfx.fanfare();
  const r = canvas.getBoundingClientRect();
  burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 120, emoji: [p.meal.emoji, '🎉', '✨'] });
  say(`${p.meal.name}!`, { delay: 300 });
  setTimeout(() => showResult(p.meal.id, root), 650);
}

function showResult(mealId, root) {
  showMealSheet(mealId, {
    onCook: meal => cookTonight(meal.id, root),
    onSide: meal => showSideWheel(side => { cookTonight(meal.id, root, side.id); }),
    onFaceoff: meal => faceoff(meal, root),
    onSpinAgain: () => { sfx.click(); },
    onVeto: () => { spinUI.picks = null; renderSpin(root); setTimeout(() => document.querySelector('.hub') && document.querySelector('.hub').click(), 500); },
  });
}

/** Two meals enter, one meal leaves. The family taps the winner. */
function faceoff(champ, root) {
  const st = store.get();
  const cands = scoreMeals(st, { ...spinUI.filters, excludeIds: [champ.id] });
  const pick = weightedSample(cands, 1)[0];
  if (!pick) { toast('No challenger available', { emoji: '🤷' }); return; }
  const chal = pick.meal;
  sfx.faceoff(); say(`${champ.name} versus ${chal.name}. Tap the winner!`, { delay: 100 });
  const sheet = openSheet({ title: '⚔️ Face-off! Tap the winner' });
  const card = m => h('button', { class: 'faceoff-card' }, h('span', { class: 'big' }, m.emoji), m.name, h('span', { class: 'muted small' }, timeLabel(m.time)));
  const a = card(champ), b = card(chal);
  const wrap = h('div', { class: 'faceoff' }, a, h('span', { class: 'faceoff-vs' }, 'VS'), b);
  const choose = (winner, wEl, lEl) => {
    wEl.classList.add('winner'); lEl.classList.add('loser');
    sfx.fanfare(); say(`${winner.name} wins!`);
    const r = wEl.getBoundingClientRect();
    burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 90, emoji: [winner.emoji, '🏆'] });
    store.update(s => { s.stats.faceoffs++; }, { silent: true });
    setTimeout(() => { sheet.close(); showResult(winner.id, root); }, 900);
  };
  a.addEventListener('click', () => choose(champ, a, b));
  b.addEventListener('click', () => choose(chal, b, a));
  sheet.setBody(h('div', {}, wrap, h('p', { class: 'hint center' }, 'Let the kids decide. The winner goes to the result card.')));
}

function pickCuisine() {
  const sheet = openSheet({ title: '🌍 Pick a cuisine' });
  sheet.setBody(h('div', { class: 'pick-list' }, CUISINES.map(c => h('button', { class: 'pick-row', onClick: () => { sheet.close(); setFilter('cuisine', c); } }, h('span', { class: 'pick-emoji' }, CUISINE_EMOJI[c] || '🍽️'), h('span', { class: 'pick-name' }, c)))));
}

async function shareTonight(meal, side) {
  const text = `🍽️ Tonight we're having ${meal.emoji} ${meal.name}${side ? ` with ${side.emoji} ${side.name}` : ''}! (picked by Dinner Spinner 🎡)`;
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast('Copied!', { emoji: '📋' }); }
  } catch (e) { if (e && e.name !== 'AbortError') toast('Could not share', { emoji: '😬' }); }
}

function cookTonight(mealId, root, sideId = null) {
  store.update(s => { s.tonight = { id: mealId, sideId, date: todayISO(), done: false }; });
  sfx.cheer();
  burst({ count: 60, emoji: ['🍽️', '👩‍🍳'] });
  const m = mealById(mealId);
  say(`${m.name} it is! Dinner is served.`);
  toast(`${m.emoji} ${m.name} it is! Ingredients are in the details.`, { ms: 3000 });
  renderSpin(root);
}

function setSide(sideId) { store.update(s => { if (s.tonight) s.tonight.sideId = sideId; }); }

function showWheelList(picks) {
  {
    const sheet = openSheet({ title: 'On the wheel' });
    sheet.setBody(h('div', { class: 'pick-list' }, picks.map(p => h('button', { class: 'pick-row', onClick: () => { sheet.close(); showMealSheet(p.meal.id, { onCook: meal => cookTonight(meal.id, document.getElementById('main')) }); } },
      h('span', { class: 'pick-emoji' }, p.meal.emoji), h('span', { class: 'pick-name' }, p.meal.name, p.why.length ? h('small', { class: 'muted' }, ' · ' + p.why.join(', ')) : null), h('span', { class: 'pick-meta' }, timeLabel(p.meal.time))))));
  }
}

export function cleanupSpin() { if (wheel) { wheel.destroy(); wheel = null; } document.body.classList.remove('spinning'); }
