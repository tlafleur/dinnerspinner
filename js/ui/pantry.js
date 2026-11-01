// Pantry: what we have at home. Drives "Fridge raid" mode.
import { h, uid } from '../util.js';
import { store } from '../store.js';
import { ingredientsOf, keyOf, groupByAisle, pantryStatus, scoreMeals, STAPLES, guessAisle, pantryHas } from '../engine.js';
import { toast, confirm } from './components.js';
import { spinUI } from './spin.js';
import { sfx } from '../sound.js';

const pantryUI = { q: '' };

function allIngredients(st) {
  const map = new Map();
  for (const item of [...st.meals, ...st.sides]) {
    if (item.hidden) continue;
    for (const ing of ingredientsOf(item)) { const k = keyOf(ing.n); if (!map.has(k)) map.set(k, { key: k, name: ing.n, a: ing.a, staple: ing.staple }); }
  }
  for (const k of Object.keys(st.pantry)) if (!map.has(k)) map.set(k, { key: k, name: k, a: guessAisle(k), staple: STAPLES.includes(k) });
  return [...map.values()];
}

export function renderPantry(root) {
  const st = store.get();
  const section = h('section', { class: 'screen pantry' });
  const have = Object.keys(st.pantry).length;
  section.append(h('div', { class: 'row between' }, h('h1', { class: 'title' }, 'Pantry'), h('span', { class: 'pill' }, `${have} items`)));

  // readiness summary
  const scored = scoreMeals(st, {});
  const ready = scored.filter(p => p.pantry.missing.length === 0);
  const almost = scored.filter(p => p.pantry.missing.length > 0 && p.pantry.missing.length <= 2);
  section.append(h('div', { class: 'card ready-card' },
    h('div', { class: 'ready-stats' },
      h('div', { class: 'stat' }, h('div', { class: 'stat-n' }, ready.length), h('div', { class: 'stat-l' }, 'ready to cook')),
      h('div', { class: 'stat' }, h('div', { class: 'stat-n' }, almost.length), h('div', { class: 'stat-l' }, 'missing 1–2 things'))),
    h('button', { class: 'btn btn-primary full', disabled: !(ready.length || almost.length), onClick: () => { spinUI.filters.pantry = true; spinUI.picks = null; sfx.whoosh(); location.hash = '#spin'; } }, '🧺 Fridge raid spin!'),
    (ready.length || almost.length) ? h('details', { class: 'details' }, h('summary', {}, 'What could we make?'),
      h('ul', { class: 'plain-list' },
        ready.map(p => h('li', {}, `${p.meal.emoji} ${p.meal.name} `, h('span', { class: 'pill pill-good' }, 'ready'))),
        almost.map(p => h('li', {}, `${p.meal.emoji} ${p.meal.name} `, h('span', { class: 'muted small' }, 'need ' + p.pantry.missing.join(', ')))))) : null));

  // search / add
  const input = h('input', { type: 'search', placeholder: 'Search or add an item…', value: pantryUI.q, autocomplete: 'off' });
  input.addEventListener('input', () => { pantryUI.q = input.value; renderChips(); });
  const addBtn = h('button', { class: 'btn btn-sm', type: 'submit' }, '＋');
  section.append(h('form', { class: 'add-row', onSubmit: e => { e.preventDefault(); const v = keyOf(input.value); if (!v) return; store.update(s => { s.pantry[v] = true; }); pantryUI.q = ''; sfx.pop(); toast(`Added ${v}`, { emoji: '🧺' }); } }, input, addBtn));
  section.append(h('div', { class: 'row gap-sm wrap' },
    h('button', { class: 'btn btn-ghost btn-sm', onClick: () => { store.update(s => { for (const k of STAPLES) s.pantry[k] = true; }); sfx.click(); toast('Staples marked as stocked'); } }, '🧂 I have the staples'),
    h('button', { class: 'btn btn-ghost btn-sm', onClick: async () => { if (await confirm('Empty the whole pantry list?', { ok: 'Empty it', danger: true })) store.update(s => { s.pantry = {}; }); } }, '🗑 Empty pantry')));
  section.append(h('p', { class: 'hint' }, 'Tap what you have at home. Checked items are skipped on the shopping list.'));

  const chipsWrap = h('div');
  section.append(chipsWrap);
  function renderChips() {
    const q = keyOf(pantryUI.q);
    const items = allIngredients(store.get()).filter(i => !q || i.name.includes(q));
    const groups = groupByAisle(items.map(i => ({ ...i })));
    chipsWrap.replaceChildren(...groups.map(g => h('div', { class: 'card aisle' }, h('h3', { class: 'aisle-title' }, g.emoji + ' ' + g.label),
      h('div', { class: 'chips wrap' }, g.lines.map(i => {
        const on = !!store.get().pantry[i.key];
        const b = h('button', { class: 'chip chip-sm' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false' }, i.name);
        b.addEventListener('click', () => {
          const now = !b.classList.contains('on');
          b.classList.toggle('on', now); b.setAttribute('aria-pressed', now ? 'true' : 'false');
          now ? sfx.pop() : sfx.click();
          store.update(s => { if (now) s.pantry[i.key] = true; else delete s.pantry[i.key]; }, { silent: true });
          refreshHeader();
        });
        return b;
      })))));
  }
  function refreshHeader() {
    const s = store.get();
    const sc = scoreMeals(s, {});
    section.querySelector('.pill').textContent = `${Object.keys(s.pantry).length} items`;
    const ns = section.querySelectorAll('.stat-n');
    ns[0].textContent = sc.filter(p => p.pantry.missing.length === 0).length;
    ns[1].textContent = sc.filter(p => p.pantry.missing.length > 0 && p.pantry.missing.length <= 2).length;
  }
  renderChips();
  root.replaceChildren(section);
}
