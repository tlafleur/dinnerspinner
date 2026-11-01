// Meal library: browse, add, edit, hide.
import { h, uid, timeLabel } from '../util.js';
import { store, mealById } from '../store.js';
import { parseIngredient, ingredientsOf, formatIngredient, familyVerdict, keyOf } from '../engine.js';
import { openSheet, toast, confirm, field, chip, stars, emptyState, avatar } from './components.js';
import { CUISINES, PROTEINS, DIET_TAGS } from '../data/seed.js';
import { showMealSheet } from './mealsheet.js';
import { sfx } from '../sound.js';

const libUI = { q: '', showHidden: false };
const EMOJIS = ['🍝', '🌮', '🍗', '🍔', '🍕', '🍜', '🍛', '🥗', '🍲', '🥘', '🍣', '🍤', '🥩', '🍖', '🌯', '🥙', '🫔', '🥟', '🍱', '🍚', '🍳', '🥞', '🧇', '🥪', '🌭', '🥣', '🫕', '🧆', '🥧', '🫓', '🐟', '🦐', '🥦', '🍆', '🌽', '🥔', '🧀', '🥓', '🍠', '🫘', '🥬', '🍄', '🫑', '🧅', '🥚', '🍞', '🥐', '🍽️'];

export function renderMeals(root) {
  const st = store.get();
  const section = h('section', { class: 'screen meals' });
  section.append(h('div', { class: 'row between' }, h('h1', { class: 'title' }, 'Meal library'), h('span', { class: 'pill' }, `${st.meals.filter(m => !m.hidden).length} meals`)));
  const input = h('input', { type: 'search', placeholder: 'Search meals…', value: libUI.q, autocomplete: 'off' });
  input.addEventListener('input', () => { libUI.q = input.value; renderList(); });
  section.append(h('div', { class: 'add-row' }, input, h('button', { class: 'btn btn-sm btn-primary', onClick: () => editMeal(null) }, '＋ New')));
  section.append(h('div', { class: 'row gap-sm wrap' },
    chip({ label: 'Show hidden', emoji: '🙈', small: true, on: libUI.showHidden, onToggle: v => { libUI.showHidden = v; renderList(); } })));
  const list = h('div', { class: 'meal-list' });
  section.append(list);
  function renderList() {
    const s = store.get();
    const q = keyOf(libUI.q);
    const meals = s.meals.filter(m => (libUI.showHidden || !m.hidden) && (!q || m.name.toLowerCase().includes(q) || m.cuisine.toLowerCase().includes(q) || (m.protein || '').includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
    list.replaceChildren(...(meals.length ? meals.map(m => {
      const fv = familyVerdict(s.members, m);
      return h('div', { class: 'meal-row' + (m.hidden ? ' hidden-meal' : '') },
        h('button', { class: 'meal-row-main', onClick: () => showMealSheet(m.id, { extraActions: sheet => [h('button', { class: 'btn btn-primary', onClick: () => { sheet.close(); editMeal(m.id); } }, '✏️ Edit')] }) },
          h('span', { class: 'meal-emoji' }, m.emoji),
          h('span', { class: 'meal-text' }, h('span', { class: 'meal-name' }, m.name), h('span', { class: 'meal-meta' }, `${timeLabel(m.time)} · ${m.cuisine}`, m.custom ? ' · yours' : '')),
          h('span', { class: 'plan-verdicts' }, fv.per.map(p => p.v !== 'unknown' ? avatar(p.member, { size: 'xs', verdict: p.v }) : null))),
        h('button', { class: 'icon-btn', title: 'Edit', onClick: () => editMeal(m.id) }, '✏️'));
    }) : [emptyState('🔍', 'No meals found', '')]));
  }
  renderList();
  root.replaceChildren(section);
}

export function editMeal(id) {
  const st = store.get();
  const m = id ? mealById(id) : { id: null, name: '', emoji: '🍽️', cuisine: 'American', protein: 'chicken', time: 30, kid: 3, ok: ['nf'], serves: 4, ing: [], tip: '', custom: true };
  const draft = { ...m, ok: [...(m.ok || [])] };
  const sheet = openSheet({ title: id ? 'Edit meal' : 'New meal', big: true });
  const name = h('input', { type: 'text', value: draft.name, placeholder: 'e.g. Grandma\'s chicken soup', autocomplete: 'off' });
  const emojiRow = h('div', { class: 'chips wrap avatars' }, EMOJIS.map(e => { const b = h('button', { class: 'avatar-pick' + (e === draft.emoji ? ' on' : ''), type: 'button' }, e); b.addEventListener('click', () => { emojiRow.querySelectorAll('.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); draft.emoji = e; sfx.click(); }); return b; }));
  const cuisine = h('select', {}, CUISINES.map(c => h('option', { value: c, selected: c === draft.cuisine }, c)));
  const protein = h('select', {}, PROTEINS.map(p => h('option', { value: p, selected: p === draft.protein }, p)));
  const time = h('input', { type: 'number', min: 5, max: 600, step: 5, value: draft.time, inputmode: 'numeric' });
  const serves = h('input', { type: 'number', min: 1, max: 20, value: draft.serves || 4, inputmode: 'numeric' });
  const kidRow = h('div', { class: 'star-row' }, [1, 2, 3, 4, 5].map(n => { const b = h('button', { type: 'button', class: 'star' + (n <= draft.kid ? ' on' : '') }, '⭐'); b.addEventListener('click', () => { draft.kid = n; kidRow.querySelectorAll('.star').forEach((x, i) => x.classList.toggle('on', i < n)); sfx.click(); }); return b; }));
  const ing = h('textarea', { rows: 8, placeholder: '1 lb chicken thighs\n2 cup rice\n1 head broccoli\n…one per line, quantity first' }, (draft.ing || []).map(x => typeof x === 'string' ? x : formatIngredient(x)).join('\n'));
  const tip = h('input', { type: 'text', value: draft.tip || '', placeholder: 'Optional note or link' });
  const preview = h('div', { class: 'ing-preview muted small' });
  const updatePreview = () => { const parsed = ing.value.split('\n').map(parseIngredient).filter(Boolean); preview.textContent = parsed.length ? parsed.map(p => `${formatIngredient(p)} (${p.a})`).join(' · ') : ''; };
  ing.addEventListener('input', updatePreview); updatePreview();
  const body = h('div', {},
    field('Name', name), field('Emoji', emojiRow),
    h('div', { class: 'grid2' }, field('Cuisine', cuisine), field('Main protein', protein), field('Minutes', time), field('Serves', serves)),
    field('Kid-friendly', kidRow, 'A starting guess; the family\'s ratings take over.'),
    field('Works for', h('div', { class: 'chips wrap' }, DIET_TAGS.filter(d => ['veg', 'vegan', 'gf', 'df', 'nf'].includes(d[0])).map(([k, label, e]) => chip({ label, emoji: e, small: true, on: draft.ok.includes(k), onToggle: v => { draft.ok = v ? [...draft.ok, k] : draft.ok.filter(x => x !== k); } })))),
    field('Ingredients', ing, 'For the number of servings above. Aisles are guessed automatically.'), preview,
    field('Tip', tip),
    h('div', { class: 'row gap' },
      id ? h('button', { class: 'btn btn-danger', onClick: async () => {
        if (m.custom) { if (await confirm(`Delete ${m.name}?`, { ok: 'Delete', danger: true })) { store.update(s => { s.meals = s.meals.filter(x => x.id !== id); }); sheet.close(); } }
        else { store.update(s => { const x = s.meals.find(y => y.id === id); x.hidden = !x.hidden; }); toast(m.hidden ? 'Meal is back' : 'Meal hidden from the wheel'); sheet.close(); }
      } }, m.custom ? '🗑' : (m.hidden ? '👁 Unhide' : '🙈 Hide')) : null,
      h('button', { class: 'btn btn-primary grow', onClick: () => {
        const nm = name.value.trim(); if (!nm) { toast('Give it a name', { emoji: '✏️' }); return; }
        const parsed = ing.value.split('\n').map(parseIngredient).filter(Boolean);
        const data = { name: nm, emoji: draft.emoji, cuisine: cuisine.value, protein: protein.value, time: +time.value || 30, serves: +serves.value || 4, kid: draft.kid, ok: draft.ok, ing: parsed, tip: tip.value.trim() };
        store.update(s => {
          if (id) Object.assign(s.meals.find(x => x.id === id), data);
          else s.meals.push({ id: 'c-' + uid(), custom: true, hidden: false, ...data });
        });
        sfx.cheer(); toast(id ? 'Saved' : 'Added to the wheel!', { emoji: draft.emoji }); sheet.close();
      } }, id ? 'Save' : 'Add meal')));
  sheet.setBody(body);
}
