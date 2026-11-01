// Tonight: the prize wheel.
import { h, timeLabel, todayDay } from '../util.js';
import { store, mealById, sideById } from '../store.js';
import { scoreMeals, weightedSample, todayISO } from '../engine.js';
import { chip, emptyState, toast } from './components.js';
import { createWheel } from './wheel.js';
import { showMealSheet, showRatingSheet, showSideWheel, markCooked, verdictRow } from './mealsheet.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';

export const spinUI = { filters: { pantry: false, kids: false, quick: false, veg: false }, picks: null, rotation: 0 };
let wheel = null;

function candidates(st) {
  return scoreMeals(st, spinUI.filters);
}

function pickSubset(st) {
  const cands = candidates(st);
  spinUI.picks = weightedSample(cands, 10);
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
  const hint = h('p', { class: 'hint center' }, `${picks.length} meals on the wheel · bigger slice = family favorite`);
  section.append(hint);
  section.append(h('div', { class: 'row center gap' },
    h('button', { class: 'btn btn-ghost btn-sm', onClick: () => { sfx.whoosh(); spinUI.picks = null; rerender(root); } }, '🎲 Reshuffle wheel'),
    h('button', { class: 'btn btn-ghost btn-sm', onClick: () => showWheelList(picks) }, '📋 See the list')));

  wheel && wheel.destroy();
  wheel = createWheel(canvas, {
    onTick: () => { wrap.classList.add('tick'); setTimeout(() => wrap.classList.remove('tick'), 70); },
    onDone: idx => onLanded(picks[idx], canvas, root),
    onTap: () => spin(picks),
  });
  wheel.setSegments(picks.map(p => ({ label: p.meal.name, emoji: p.meal.emoji, weight: Math.max(0.35, Math.sqrt(p.weight)) })));
  hub.addEventListener('click', () => spin(picks));
  requestAnimationFrame(() => wheel.resize());
  root.replaceChildren(section);

  function spin(picks) {
    if (wheel.isSpinning()) return;
    sfx.click();
    document.body.classList.add('spinning');
    // choose winner by weight, so bigger slices really are likelier
    const total = picks.reduce((s, p) => s + Math.max(0.35, Math.sqrt(p.weight)), 0);
    let r = Math.random() * total, winner = picks.length - 1;
    for (let i = 0; i < picks.length; i++) { r -= Math.max(0.35, Math.sqrt(picks[i].weight)); if (r <= 0) { winner = i; break; } }
    hint.textContent = 'Round and round it goes…';
    wheel.spin(winner);
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
  setTimeout(() => showMealSheet(p.meal.id, {
    onCook: meal => cookTonight(meal.id, root),
    onSide: meal => showSideWheel(side => { cookTonight(meal.id, root, side.id); }),
    onSpinAgain: () => { sfx.click(); },
  }), 650);
}

function cookTonight(mealId, root, sideId = null) {
  store.update(s => { s.tonight = { id: mealId, sideId, date: todayISO(), done: false }; });
  sfx.cheer();
  burst({ count: 60, emoji: ['🍽️', '👩‍🍳'] });
  const m = mealById(mealId);
  toast(`${m.emoji} ${m.name} it is! Ingredients are in the details.`, { ms: 3000 });
  renderSpin(root);
}

function setSide(sideId) { store.update(s => { if (s.tonight) s.tonight.sideId = sideId; }); }

function showWheelList(picks) {
  import('./components.js').then(({ openSheet }) => {
    const sheet = openSheet({ title: 'On the wheel' });
    sheet.setBody(h('div', { class: 'pick-list' }, picks.map(p => h('button', { class: 'pick-row', onClick: () => { sheet.close(); showMealSheet(p.meal.id, { onCook: meal => cookTonight(meal.id, document.getElementById('main')) }); } },
      h('span', { class: 'pick-emoji' }, p.meal.emoji), h('span', { class: 'pick-name' }, p.meal.name, p.why.length ? h('small', { class: 'muted' }, ' · ' + p.why.join(', ')) : null), h('span', { class: 'pick-meta' }, timeLabel(p.meal.time))))));
  });
}

export function cleanupSpin() { if (wheel) { wheel.destroy(); wheel = null; } document.body.classList.remove('spinning'); }
