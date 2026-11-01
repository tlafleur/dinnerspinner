// Week: slot machine to fill the week, then the plan view.
import { h, dayLabel, timeLabel, shuffle, todayDay } from '../util.js';
import { store, mealById, sideById } from '../store.js';
import { pickWeek, scoreMeals, familyVerdict, todayISO } from '../engine.js';
import { chip, emptyState, toast, confirm, avatar } from './components.js';
import { createReel } from './reels.js';
import { showMealSheet, showRatingSheet, showSideWheel, markCooked, showQuickPick, verdictRow } from './mealsheet.js';
import { WILDCARDS } from '../data/seed.js';
import { sfx } from '../sound.js';
import { burst, rain } from '../fx.js';

export const weekUI = { view: null, filters: { kids: false, quick: false, veg: false }, reels: null, held: [], result: null, spinning: false };

function symbolFor(id) {
  if (!id) return { id: null, emoji: '❔', name: '' };
  const w = WILDCARDS[id];
  if (w) return { id, emoji: w.emoji, name: w.name, wild: true };
  const m = mealById(id);
  return m ? { id, emoji: m.emoji, name: m.name } : { id: null, emoji: '❔', name: '' };
}

export function renderWeek(root) {
  const st = store.get();
  const view = weekUI.view || (st.plan ? 'plan' : 'machine');
  root.replaceChildren(view === 'plan' && st.plan ? renderPlan(root, st) : renderMachine(root, st));
}

// ---------------- Slot machine ----------------
function renderMachine(root, st) {
  const nights = st.settings.nights;
  const section = h('section', { class: 'screen week' });
  section.append(h('h1', { class: 'title' }, 'Spin up a week'));
  if (!nights.length) {
    section.append(emptyState('📅', 'No dinner nights picked', 'Choose which nights you cook in Settings.', h('a', { class: 'btn btn-primary', href: '#settings' }, 'Open settings')));
    return section;
  }
  const hasKids = st.members.some(m => m.kid);
  section.append(h('div', { class: 'chips' },
    hasKids ? chip({ label: 'Kid-approved', emoji: '👧', on: weekUI.filters.kids, onToggle: v => { weekUI.filters.kids = v; } }) : null,
    chip({ label: 'Quick weeknights', emoji: '⚡', on: weekUI.filters.quick, onToggle: v => { weekUI.filters.quick = v; } }),
    chip({ label: 'Veggie', emoji: '🥦', on: weekUI.filters.veg, onToggle: v => { weekUI.filters.veg = v; } })));

  // Reels
  if (!weekUI.result || weekUI.result.length !== nights.length) {
    weekUI.result = nights.map((day, i) => (st.plan && st.plan.slots[i] && st.plan.slots[i].day === day ? st.plan.slots[i].id : null));
    weekUI.held = nights.map(() => false);
  }
  const reels = nights.map((day, i) => createReel({ label: dayLabel(day) }));
  weekUI.reels = reels;
  reels.forEach((r, i) => r.show(symbolFor(weekUI.result[i])));

  const holdBtns = nights.map((day, i) => {
    const b = h('button', { class: 'hold' + (weekUI.held[i] ? ' on' : ''), type: 'button', 'aria-pressed': weekUI.held[i] ? 'true' : 'false' }, weekUI.held[i] ? '🔒 Held' : 'Hold');
    b.addEventListener('click', () => {
      if (weekUI.spinning || !weekUI.result[i]) return;
      weekUI.held[i] = !weekUI.held[i];
      b.classList.toggle('on', weekUI.held[i]); b.textContent = weekUI.held[i] ? '🔒 Held' : 'Hold';
      b.setAttribute('aria-pressed', weekUI.held[i] ? 'true' : 'false');
      sfx.click();
    });
    return b;
  });

  const reelsWrap = h('div', { class: 'reels', style: { '--n': nights.length } }, reels.map((r, i) => h('div', { class: 'reel-col' }, r.el, holdBtns[i])));
  const marquee = h('div', { class: 'marquee' }, Array.from({ length: 14 }, () => h('span', { class: 'bulb' })));
  const payline = h('div', { class: 'payline' }, weekUI.result.some(Boolean) ? 'Hold the ones you like, then pull again.' : 'Pull the lever! 🎰');
  const lever = h('button', { class: 'lever', 'aria-label': 'Pull the lever' }, h('div', { class: 'lever-stick' }, h('div', { class: 'lever-knob' })), h('div', { class: 'lever-base' }));
  const machine = h('div', { class: 'machine' }, marquee, h('div', { class: 'machine-body' }, reelsWrap, lever), payline);
  section.append(machine);

  const pullBtn = h('button', { class: 'btn btn-primary btn-big grow' }, '🎰 Pull!');
  const lockBtn = h('button', { class: 'btn btn-mint btn-big grow', disabled: !weekUI.result.every(Boolean) }, '✅ Lock in week');
  const actions = h('div', { class: 'row gap' }, pullBtn, lockBtn);
  section.append(actions);
  if (st.plan) section.append(h('button', { class: 'btn btn-ghost full', onClick: () => { weekUI.view = 'plan'; renderWeek(root); } }, '← Back to this week'));
  section.append(h('p', { class: 'hint center' }, `${nights.length} nights · ${scoreMeals(st, weekUI.filters).length} meals in the mix`));

  async function pull() {
    if (weekUI.spinning) return;
    const fresh = store.get();
    const filters = { kids: weekUI.filters.kids, veg: weekUI.filters.veg, maxTime: weekUI.filters.quick ? (fresh.settings.weekdayMaxTime || 30) : 0 };
    const slots = nights.map((d, i) => ({ held: weekUI.held[i], id: weekUI.result[i] }));
    const ids = pickWeek(fresh, slots, filters);
    if (ids.filter((id, i) => !slots[i].held).every(x => !x)) { toast('No meals match those filters', { emoji: '🤷' }); return; }
    weekUI.spinning = true;
    machine.classList.add('spinning');
    lever.classList.add('pulled');
    setTimeout(() => lever.classList.remove('pulled'), 700);
    sfx.lever();
    pullBtn.disabled = true; lockBtn.disabled = true;
    payline.textContent = 'Spinning…';
    store.update(s => { s.stats.pulls++; }, { silent: true });
    const pool = scoreMeals(fresh, {}).map(p => symbolFor(p.meal.id));
    const filler = pool.length ? shuffle(pool) : [symbolFor(null)];
    const promises = [];
    nights.forEach((d, i) => {
      if (slots[i].held) return;
      const id = ids[i];
      weekUI.result[i] = id;
      promises.push(reels[i].spinTo(symbolFor(id), filler, { duration: 1400 + i * 420, delay: i * 120 }));
    });
    await Promise.all(promises);
    weekUI.spinning = false;
    machine.classList.remove('spinning');
    pullBtn.disabled = false;
    lockBtn.disabled = !weekUI.result.every(Boolean);
    evaluate(fresh);
  }

  function evaluate(fresh) {
    const meals = weekUI.result.map(id => mealById(id)).filter(Boolean);
    const kids = fresh.members.filter(m => m.kid);
    const allKidsOk = kids.length && meals.length && meals.every(m => !familyVerdict(fresh.members, m).kidsNo);
    const allLove = kids.length && meals.length && meals.every(m => familyVerdict(fresh.members, m).kidsLove);
    const cuisines = new Set(meals.map(m => m.cuisine)).size;
    if (allLove) {
      machine.classList.add('jackpot');
      setTimeout(() => machine.classList.remove('jackpot'), 4000);
      sfx.jackpot();
      rain({ count: 80, emoji: ['🏆', '⭐', '🎉'] });
      burst({ count: 140, emoji: ['🏆', '⭐'] });
      payline.textContent = '🏆 FAMILY JACKPOT! Every kid loves every meal!';
      store.update(s => { s.stats.jackpots++; }, { silent: true });
    } else if (allKidsOk) {
      sfx.fanfare();
      burst({ count: 70, emoji: ['👧', '👦', '✅'] });
      payline.textContent = '✅ Kid-safe week! Nobody vetoed anything.';
    } else if (cuisines >= Math.min(4, meals.length)) {
      sfx.cheer();
      payline.textContent = '🌍 World tour! ' + cuisines + ' different cuisines.';
    } else {
      sfx.ding();
      payline.textContent = 'Hold the keepers and pull again, or lock it in!';
    }
  }

  function lockIn() {
    if (!weekUI.result.every(Boolean)) return;
    const ids = weekUI.result;
    store.update(s => {
      s.plan = { weekOf: todayISO(), slots: nights.map((day, i) => ({ day, id: ids[i], sideId: null, cooked: false })) };
      s.grocery.checked = {};
    });
    sfx.fanfare();
    burst({ count: 100, emoji: ['🛒', '📅', '🎉'] });
    toast('Week locked in! Your shopping list is ready.', { emoji: '🛒', ms: 3000 });
    weekUI.view = 'plan';
    weekUI.result = null; weekUI.held = [];
    renderWeek(root);
  }

  lever.addEventListener('click', pull);
  pullBtn.addEventListener('click', pull);
  lockBtn.addEventListener('click', lockIn);
  return section;
}

// ---------------- Plan view ----------------
function renderPlan(root, st) {
  const section = h('section', { class: 'screen week' });
  const plan = st.plan;
  const today = todayDay();
  const cooked = plan.slots.filter(s => s.cooked).length;
  section.append(h('div', { class: 'row between' }, h('h1', { class: 'title' }, 'This week'), h('span', { class: 'pill' }, `${cooked}/${plan.slots.length} cooked`)));
  section.append(h('div', { class: 'row gap' },
    h('a', { class: 'btn btn-primary grow', href: '#shop' }, '🛒 Shopping list'),
    h('button', { class: 'btn btn-ghost grow', onClick: () => { weekUI.view = 'machine'; weekUI.result = null; renderWeek(root); } }, '🎰 Re-spin')));

  const list = h('div', { class: 'plan-list' });
  plan.slots.forEach((slot, i) => {
    const wild = WILDCARDS[slot.id];
    const meal = wild || mealById(slot.id);
    const side = slot.sideId ? sideById(slot.sideId) : null;
    const isToday = slot.day === today;
    const card = h('div', { class: 'plan-card' + (slot.cooked ? ' cooked' : '') + (isToday ? ' today' : '') });
    card.append(h('div', { class: 'plan-day' }, dayLabel(slot.day), isToday ? h('span', { class: 'today-tag' }, 'today') : null));
    const body = h('button', { class: 'plan-meal', onClick: () => meal && showMealSheet(slot.id, {
      cookLabel: '✅ Mark cooked', onCook: () => cookSlot(i, root),
      onSide: () => showSideWheel(s => setSide(i, s.id)),
      extraActions: sheet => [h('button', { class: 'btn btn-ghost', onClick: () => { sheet.close(); swap(i, root); } }, '🔁 Swap this night')],
    }) },
      h('span', { class: 'plan-emoji' }, meal ? meal.emoji : '❔'),
      h('span', { class: 'plan-text' },
        h('span', { class: 'plan-name' }, meal ? meal.name : 'Pick a meal'),
        h('span', { class: 'plan-meta' }, meal && !wild ? `${timeLabel(meal.time)} · ${meal.cuisine}` : (wild ? wild.blurb : ''), side ? ` · ${side.emoji} ${side.name}` : '')),
      meal && !wild ? h('span', { class: 'plan-verdicts' }, familyVerdict(st.members, meal).per.filter(p => p.member.kid).map(p => avatar(p.member, { size: 'xs', verdict: p.v }))) : null);
    card.append(body);
    card.append(h('div', { class: 'plan-actions' },
      h('button', { class: 'icon-btn', title: 'Swap', onClick: () => swap(i, root) }, '🔁'),
      !wild ? h('button', { class: 'icon-btn', title: 'Side', onClick: () => showSideWheel(s => setSide(i, s.id)) }, '🥗') : null,
      !wild ? h('button', { class: 'icon-btn' + (slot.cooked ? ' on' : ''), title: 'Cooked', onClick: () => slot.cooked ? uncook(i) : cookSlot(i, root) }, slot.cooked ? '✅' : '🍳') : null));
    list.append(card);
  });
  section.append(list);
  section.append(h('button', { class: 'btn btn-ghost full', onClick: async () => { if (await confirm('Clear this week\'s plan?', { ok: 'Clear it', danger: true })) { store.update(s => { s.plan = null; }); weekUI.view = 'machine'; weekUI.result = null; renderWeek(root); } } }, '🗑 Clear week'));
  return section;
}

function cookSlot(i, root) {
  const st = store.get();
  const slot = st.plan.slots[i];
  if (!slot || WILDCARDS[slot.id]) return;
  store.update(s => { s.plan.slots[i].cooked = true; s.history.push({ mealId: slot.id, date: todayISO() }); s.stats.cooked++; s.tonight = { id: slot.id, sideId: slot.sideId, date: todayISO(), done: true }; });
  sfx.cheer();
  burst({ count: 60, emoji: ['🍽️', '✅'] });
  showRatingSheet(slot.id);
}
function uncook(i) {
  store.update(s => { const slot = s.plan.slots[i]; slot.cooked = false; const idx = s.history.map(x => x.mealId).lastIndexOf(slot.id); if (idx >= 0) s.history.splice(idx, 1); s.stats.cooked = Math.max(0, s.stats.cooked - 1); });
}
function setSide(i, sideId) { store.update(s => { s.plan.slots[i].sideId = sideId; }); toast('Side added', { emoji: '🥗' }); }
function swap(i, root) {
  const st = store.get();
  const others = st.plan.slots.map(s => s.id).filter((id, j) => j !== i);
  showQuickPick(`Swap ${dayLabel(st.plan.slots[i].day, true)}`, { kids: weekUI.filters.kids }, id => {
    store.update(s => { s.plan.slots[i].id = id; s.plan.slots[i].cooked = false; s.plan.slots[i].sideId = null; });
    sfx.ding();
  }, others);
}
