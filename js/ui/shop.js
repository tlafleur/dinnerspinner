// Shopping list derived from the week plan (and tonight's pick), scaled to the family.
import { h, uid } from '../util.js';
import { store, mealById, sideById } from '../store.js';
import { aggregateIngredients, groupByAisle, formatLineQty, servingsOf, pantryHas, keyOf, guessAisle, AISLES, todayISO } from '../engine.js';
import { emptyState, toast, confirm } from './components.js';
import { WILDCARDS } from '../data/seed.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';

export function buildList(st) {
  const entries = [];
  if (st.plan) for (const slot of st.plan.slots) {
    if (WILDCARDS[slot.id] || slot.cooked) continue;
    const meal = mealById(slot.id); if (meal) entries.push({ item: meal, label: meal.name });
    const side = slot.sideId ? sideById(slot.sideId) : null; if (side) entries.push({ item: side, label: side.name });
  }
  if (st.tonight && st.tonight.date === todayISO() && !st.tonight.done && !(st.plan && st.plan.slots.some(s => s.id === st.tonight.id))) {
    const meal = mealById(st.tonight.id); if (meal) entries.push({ item: meal, label: meal.name + ' (tonight)' });
    const side = st.tonight.sideId ? sideById(st.tonight.sideId) : null; if (side) entries.push({ item: side, label: side.name });
  }
  const lines = aggregateIngredients(entries, servingsOf(st), st.settings.scaleDown).filter(l => !st.grocery.removed[l.key]);
  for (const x of st.grocery.extras) lines.push({ key: 'x:' + x.id, name: x.name, a: x.a || guessAisle(x.name), staple: false, qtys: x.qty ? [{ q: null, u: '', text: x.qty }] : [], from: ['added by you'], extra: true, extraId: x.id });
  return lines;
}

export function renderShop(root) {
  const st = store.get();
  const section = h('section', { class: 'screen shop' });
  const lines = buildList(st);
  const mealsCount = st.plan ? st.plan.slots.filter(s => !WILDCARDS[s.id] && !s.cooked).length : 0;
  section.append(h('div', { class: 'row between' }, h('h1', { class: 'title' }, 'Shopping list'), lines.length ? h('span', { class: 'pill' }, `for ${servingsOf(st)}`) : null));

  const hide = st.settings.shopHidePantry;
  const checked = st.grocery.checked;
  const visible = lines.filter(l => !l.staple);
  const staples = lines.filter(l => l.staple);
  const inPantry = visible.filter(l => !l.extra && pantryHas(st.pantry, l.name));
  const toBuy = hide ? visible.filter(l => l.extra || !pantryHas(st.pantry, l.name)) : visible;
  const done = toBuy.filter(l => checked[l.key]).length;

  if (!lines.length) {
    section.append(emptyState('🛒', 'Nothing to buy yet', 'Spin up a week and lock it in. The list builds itself from the meals you pick.',
      h('a', { class: 'btn btn-primary', href: '#week' }, '🎰 Plan the week')));
  } else {
    section.append(h('p', { class: 'muted' }, `${mealsCount} dinner${mealsCount === 1 ? '' : 's'} planned · ${toBuy.length} items · ${done} in the cart`));
    const bar = h('div', { class: 'progress' }, h('div', { class: 'progress-fill', style: { width: (toBuy.length ? (100 * done / toBuy.length) : 0) + '%' } }));
    section.append(bar);
  }

  // add item
  const input = h('input', { type: 'text', placeholder: 'Add something… (e.g. 2 bananas)', enterkeyhint: 'done', autocomplete: 'off' });
  const addBtn = h('button', { class: 'btn btn-sm', type: 'submit' }, '＋');
  const form = h('form', { class: 'add-row', onSubmit: e => { e.preventDefault(); const v = input.value.trim(); if (!v) return; store.update(s => { s.grocery.extras.push({ id: uid(), name: v }); }); input.value = ''; sfx.pop(); } }, input, addBtn);
  section.append(form);

  for (const g of groupByAisle(toBuy)) {
    const card = h('div', { class: 'card aisle' }, h('h3', { class: 'aisle-title' }, g.emoji + ' ' + g.label));
    for (const l of g.lines) card.append(lineRow(l, !!checked[l.key]));
    section.append(card);
  }

  if (hide && inPantry.length) {
    section.append(h('details', { class: 'details card' }, h('summary', {}, `🧺 Already in pantry (${inPantry.length})`),
      h('ul', { class: 'plain-list' }, inPantry.map(l => h('li', {}, `${l.name} · ${formatLineQty(l)}`, h('button', { class: 'link', onClick: () => { store.update(s => { delete s.pantry[keyOf(l.name)]; }); } }, 'out of it'))))));
  }
  if (staples.length) {
    section.append(h('details', { class: 'details card' }, h('summary', {}, `🧂 Staples to double-check (${staples.length})`),
      h('ul', { class: 'plain-list' }, staples.map(l => h('li', {}, `${l.name} · ${formatLineQty(l)}`)))));
  }

  if (lines.length) {
    section.append(h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn btn-ghost grow', onClick: () => share(toBuy, st) }, '📤 Share'),
      h('button', { class: 'btn btn-ghost grow', onClick: () => { store.update(s => { s.settings.shopHidePantry = !s.settings.shopHidePantry; }); } }, hide ? '👁 Show pantry items' : '🙈 Hide pantry items'),
      h('button', { class: 'btn btn-mint grow', onClick: () => finish(toBuy) }, '🏁 Done shopping')));
  }
  root.replaceChildren(section);
}

function lineRow(l, on) {
  const row = h('label', { class: 'line' + (on ? ' on' : '') });
  const cb = h('input', { type: 'checkbox', checked: on });
  cb.addEventListener('change', () => { row.classList.toggle('on', cb.checked); cb.checked ? sfx.pop() : sfx.click(); store.update(s => { if (cb.checked) s.grocery.checked[l.key] = true; else delete s.grocery.checked[l.key]; }, { silent: true }); });
  row.append(cb, h('span', { class: 'line-box' }, '✓'), h('span', { class: 'line-text' }, h('span', { class: 'line-name' }, l.name), h('span', { class: 'line-qty' }, l.qtys[0] && l.qtys[0].text ? l.qtys[0].text : formatLineQty(l)), h('span', { class: 'line-from' }, l.from.join(', '))));
  row.append(h('button', { class: 'line-x', type: 'button', title: 'Remove', onClick: e => { e.preventDefault(); store.update(s => { if (l.extra) s.grocery.extras = s.grocery.extras.filter(x => x.id !== l.extraId); else s.grocery.removed[l.key] = true; }); } }, '✕'));
  return row;
}

function listText(lines, st) {
  const out = ['🍽️ Dinner Spinner shopping list', ''];
  for (const g of groupByAisle(lines)) {
    out.push(`${g.emoji} ${g.label.toUpperCase()}`);
    for (const l of g.lines) out.push(`${st.grocery.checked[l.key] ? '☑' : '☐'} ${l.name}${formatLineQty(l) ? ' — ' + formatLineQty(l) : ''}`);
    out.push('');
  }
  return out.join('\n');
}

async function share(lines, st) {
  const text = listText(lines, st);
  try {
    if (navigator.share) { await navigator.share({ title: 'Shopping list', text }); return; }
    await navigator.clipboard.writeText(text);
    toast('List copied to clipboard', { emoji: '📋' });
  } catch (e) { if (e && e.name !== 'AbortError') toast('Could not share', { emoji: '😬' }); }
}

async function finish(lines) {
  const st = store.get();
  const bought = lines.filter(l => st.grocery.checked[l.key] && !l.extra);
  const ok = await confirm(`Add ${bought.length} checked item${bought.length === 1 ? '' : 's'} to your pantry and clear the checks?`, { ok: 'Yes, stock the pantry' });
  if (!ok) return;
  store.update(s => {
    for (const l of bought) s.pantry[keyOf(l.name)] = true;
    s.grocery.checked = {};
    s.grocery.extras = s.grocery.extras.filter(x => !st.grocery.checked['x:' + x.id]);
  });
  sfx.fanfare();
  burst({ count: 90, emoji: ['🛒', '🧺', '🥕'] });
  toast('Pantry stocked! Time to spin.', { emoji: '🧺' });
}
