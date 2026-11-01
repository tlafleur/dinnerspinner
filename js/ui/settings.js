import { h, DAYS } from '../util.js';
import { store, restoreSampleMeals, mealById } from '../store.js';
import { autoServings, lastCooked } from '../engine.js';
import { openSheet, toast, confirm, field, chip, segmented, section } from './components.js';
import { DIET_TAGS, WILDCARDS, CUISINES } from '../data/seed.js';
import { sfx, setEnabled, setVoice, say } from '../sound.js';
import { BADGES } from '../badges.js';
import { setFxEnabled, burst } from '../fx.js';

export function renderSettings(root) {
  const st = store.get();
  const s = st.settings;
  const el = h('section', { class: 'screen settings' });
  el.append(h('h1', { class: 'title' }, 'Settings'));

  // Nights
  el.append(section('📅 Dinner nights',
    h('div', { class: 'chips wrap' }, DAYS.map(([id, label]) => chip({ label, small: true, on: s.nights.includes(id), onToggle: v => store.update(x => { x.settings.nights = DAYS.map(d => d[0]).filter(d => v ? (x.settings.nights.includes(d) || d === id) : (x.settings.nights.includes(d) && d !== id)); }, { silent: true }) }))),
    h('p', { class: 'hint' }, 'Each night is a reel on the slot machine.'),
    h('details', { class: 'details', open: Object.values(s.themes || {}).some(Boolean) }, h('summary', {}, '🎉 Theme nights (Taco Tuesday, anyone?)'),
      h('div', {}, s.nights.map(d => { const sel = h('select', {}, h('option', { value: '', selected: !s.themes[d] }, 'Anything goes'), h('option', { value: 'veg', selected: s.themes[d] === 'veg' }, '🥦 Veggie night'), CUISINES.map(c => h('option', { value: c, selected: s.themes[d] === c }, c + ' night'))); sel.addEventListener('change', () => store.update(x => { x.settings.themes[d] = sel.value; }, { silent: true })); return h('div', { class: 'theme-row' }, h('span', { class: 'day' }, DAYS.find(x => x[0] === d)[1]), sel); })),
      h('p', { class: 'hint' }, 'The slot machine only lands on matching meals for that night.'))));

  // Servings
  const auto = autoServings(st.members);
  const servInput = h('input', { type: 'number', min: 1, max: 30, step: 0.5, value: s.servings || auto, inputmode: 'decimal' });
  servInput.addEventListener('change', () => store.update(x => { x.settings.servings = +servInput.value || null; }, { silent: true }));
  el.append(section('🍽️ Servings',
    segmented([[null, `Auto (${auto})`], ['custom', 'Custom']], s.servings ? 'custom' : null, v => { store.update(x => { x.settings.servings = v ? +servInput.value || auto : null; }); }),
    s.servings ? field('Servings per dinner', servInput, 'Recipes and the shopping list scale to this.') : h('p', { class: 'hint' }, 'Auto adds up everyone\'s appetite from the Family tab.'),
    h('div', { class: 'chips wrap' }, chip({ label: 'Scale recipes down too', emoji: '📉', small: true, on: !!s.scaleDown, onToggle: v => store.update(x => { x.settings.scaleDown = v; }, { silent: true }) })),
    h('p', { class: 'hint' }, 'Off: recipes are scaled up for big families but never below what they make as written (leftovers!). On: shrink them to exactly your servings.')));

  // Weeknight time
  el.append(section('⚡ Quick weeknights',
    segmented([[20, '≤20 min'], [30, '≤30'], [45, '≤45'], [60, '≤60'], [0, 'Any']], s.weekdayMaxTime, v => store.update(x => { x.settings.weekdayMaxTime = v; }, { silent: true })),
    h('p', { class: 'hint' }, 'Max cooking time when the "Quick weeknights" chip is on.')));

  // House rules
  el.append(section('🥗 House rules',
    h('div', { class: 'chips wrap' }, DIET_TAGS.map(([k, label, e]) => chip({ label, emoji: e, small: true, on: s.houseRules.includes(k), onToggle: v => store.update(x => { x.settings.houseRules = v ? [...x.settings.houseRules, k] : x.settings.houseRules.filter(y => y !== k); }, { silent: true }) }))),
    h('p', { class: 'hint' }, 'Applies to every meal. Individual diets live on each family member.')));

  // Wildcards
  el.append(section('🃏 Wildcard nights',
    h('div', { class: 'chips wrap' }, Object.values(WILDCARDS).map(w => chip({ label: w.name, emoji: w.emoji, small: true, on: !!s.wildcards[w.id], onToggle: v => store.update(x => { x.settings.wildcards[w.id] = v; }, { silent: true }) }))),
    h('p', { class: 'hint' }, 'Can show up on the slot machine. Nothing to shop for on those nights.')));

  // Fun
  el.append(section('🔊 Fun stuff',
    h('div', { class: 'chips wrap' },
      chip({ label: 'Sound effects', emoji: '🔊', on: s.sound, onToggle: v => { store.update(x => { x.settings.sound = v; }, { silent: true }); setEnabled(v); if (v) sfx.ding(); } }),
      chip({ label: 'Confetti', emoji: '🎉', on: s.fx, onToggle: v => { store.update(x => { x.settings.fx = v; }, { silent: true }); setFxEnabled(v); if (v) burst({ count: 60 }); } }),
      chip({ label: 'Announcer voice', emoji: '🎙️', on: s.voice, onToggle: v => { store.update(x => { x.settings.voice = v; }, { silent: true }); setVoice(v); if (v) say('Welcome to Dinner Spinner!'); } })),
    h('p', { class: 'hint' }, 'The 🔊 button at the top mutes everything in one tap.')));

  // Text size
  el.append(section('🔤 Text size',
    segmented([['normal', 'Normal'], ['large', 'Large'], ['huge', 'Huge']], s.textSize || 'normal', v => { store.update(x => { x.settings.textSize = v; }, { silent: true }); document.documentElement.dataset.text = v; }),
    h('p', { class: 'hint' }, 'Also follows the iOS text size setting.')));

  // Stats
  const top = {};
  for (const hst of st.history) top[hst.mealId] = (top[hst.mealId] || 0) + 1;
  const fame = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ meal: mealById(id), n })).filter(x => x.meal);
  el.append(section('🏅 Sticker book',
    h('p', { class: 'hint' }, `${Object.keys(st.badges).length} of ${BADGES.length} collected`),
    h('div', { class: 'stickers' }, BADGES.map(b => h('button', { class: 'sticker' + (st.badges[b.id] ? '' : ' locked'), onClick: () => toast(`${b.name}: ${b.desc}${st.badges[b.id] ? ' ✓' : ''}`, { emoji: b.emoji, ms: 2500 }) }, h('span', { class: 'big' }, b.emoji), h('span', { class: 'nm' }, b.name))))));

  el.append(section('🏆 Hall of fame',
    h('div', { class: 'stat-grid' },
      stat(st.stats.cooked, 'dinners cooked'), stat(st.stats.spins, 'wheel spins'), stat(st.stats.pulls, 'lever pulls'), stat(st.stats.jackpots, 'jackpots'), stat(new Set(st.history.map(x => x.mealId)).size, 'different meals'), stat(st.stats.vetoes, 'vetoes')),
    fame.length ? h('ol', { class: 'fame' }, fame.map(f => h('li', {}, `${f.meal.emoji} ${f.meal.name} `, h('span', { class: 'muted' }, `×${f.n}`)))) : h('p', { class: 'hint' }, 'Cook something to start the leaderboard.')));

  // Data
  el.append(section('💾 Your data',
    h('p', { class: 'hint' }, 'Everything lives in this browser. Export to back up or move to another device.'),
    h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn btn-ghost grow', onClick: exportData }, '⬇️ Export'),
      h('button', { class: 'btn btn-ghost grow', onClick: importData }, '⬆️ Import'),
      h('button', { class: 'btn btn-ghost grow', onClick: () => { restoreSampleMeals(); toast('Sample meals restored'); } }, '🍝 Restore samples'),
      h('button', { class: 'btn btn-danger grow', onClick: async () => { if (await confirm('Erase everything and start fresh?', { ok: 'Erase', danger: true })) { store.reset(); toast('Fresh start!'); location.hash = '#spin'; } } }, '🧨 Reset'))));

  el.append(h('p', { class: 'hint center' }, 'Dinner Spinner · runs entirely in your browser · nothing is uploaded'));
  root.replaceChildren(el);
}

const stat = (n, l) => h('div', { class: 'stat' }, h('div', { class: 'stat-n' }, n), h('div', { class: 'stat-l' }, l));

function exportData() {
  const text = store.export();
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `dinner-spinner-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  const sheet = openSheet({ title: 'Export' });
  const ta = h('textarea', { rows: 6, readOnly: true }, text);
  sheet.setBody(h('div', {}, h('p', { class: 'hint' }, 'A file download started. You can also copy the text below.'), ta,
    h('button', { class: 'btn btn-primary full', onClick: async () => { try { await navigator.clipboard.writeText(text); toast('Copied'); } catch { ta.select(); } } }, '📋 Copy')));
}

function importData() {
  const sheet = openSheet({ title: 'Import' });
  const file = h('input', { type: 'file', accept: 'application/json,.json' });
  const ta = h('textarea', { rows: 6, placeholder: 'or paste exported JSON here' });
  const apply = async text => {
    try {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.meals)) throw new Error('not a Dinner Spinner export');
      if (await confirm('Replace everything with this import?', { ok: 'Import', danger: true })) { store.replace(data); sheet.close(); toast('Imported!', { emoji: '✅' }); }
    } catch (e) { toast('Could not import: ' + e.message, { emoji: '😬', ms: 4000 }); }
  };
  file.addEventListener('change', () => { const f = file.files[0]; if (f) f.text().then(apply); });
  sheet.setBody(h('div', {}, field('From a file', file), field('From text', ta), h('button', { class: 'btn btn-primary full', onClick: () => ta.value.trim() && apply(ta.value) }, 'Import text')));
}
