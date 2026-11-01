// Family: members, diets, dislikes, meal ratings (swipe deck) and Build-a-Plate for picky eaters.
import { h, uid, shuffle, pick } from '../util.js';
import { store, memberById } from '../store.js';
import { memberVerdict, keyOf, autoServings } from '../engine.js';
import { openSheet, toast, confirm, avatar, field, segmented, chip, emptyState } from './components.js';
import { AVATARS, DIET_TAGS, PLATE_GROUPS } from '../data/seed.js';
import { createReel } from './reels.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';

const famUI = { plateKid: null };

export function renderFamily(root) {
  const st = store.get();
  const section = h('section', { class: 'screen family' });
  section.append(h('div', { class: 'row between' }, h('h1', { class: 'title' }, 'Family'), h('span', { class: 'pill' }, `${autoServings(st.members)} servings`)));

  const list = h('div', { class: 'member-list' });
  for (const m of st.members) {
    const rated = Object.keys(m.ratings).length;
    const loves = Object.values(m.ratings).filter(v => v === 'love').length;
    list.append(h('div', { class: 'card member' },
      h('button', { class: 'member-main', onClick: () => editMember(m.id) },
        avatar(m, { size: 'lg' }),
        h('div', { class: 'member-text' },
          h('div', { class: 'member-name' }, m.name, m.kid ? h('span', { class: 'tag' }, 'kid') : null),
          h('div', { class: 'member-meta' }, [
            m.diets.length ? m.diets.map(d => (DIET_TAGS.find(x => x[0] === d) || [])[1]).join(', ') : null,
            m.dislikes.length ? 'no ' + m.dislikes.join(', ') : null,
            `${loves} ❤️ · ${rated} rated`,
          ].filter(Boolean).join(' · ')))),
      h('div', { class: 'row gap-sm' },
        h('button', { class: 'btn btn-sm btn-primary grow', onClick: () => rateDeck(m.id) }, '⭐ Rate meals'),
        h('button', { class: 'btn btn-sm btn-ghost', onClick: () => editMember(m.id) }, '✏️'))));
  }
  section.append(list);
  section.append(h('button', { class: 'btn btn-ghost full', onClick: () => editMember(null) }, '＋ Add someone'));

  // Build-a-Plate
  const kids = st.members.filter(m => m.kid);
  const plate = h('div', { class: 'card plate-card' });
  plate.append(h('h2', { class: 'card-title' }, '🍽️ Build-a-Plate'), h('p', { class: 'muted' }, 'For the night the main dish gets a "no thanks". Spin a plate from foods they actually eat.'));
  if (!kids.length) plate.append(h('p', { class: 'hint' }, 'Mark someone as a kid (or a picky eater) to use this.'));
  else {
    if (!famUI.plateKid || !kids.some(k => k.id === famUI.plateKid)) famUI.plateKid = kids[0].id;
    plate.append(segmented(kids.map(k => [k.id, k.emoji + ' ' + k.name]), famUI.plateKid, v => { famUI.plateKid = v; renderFamily(root); }));
    const kid = memberById(famUI.plateKid);
    const liked = g => g.items.filter(([e, n]) => (kid.plate[g.id] || []).includes(n));
    const setup = h('div', { class: 'plate-setup' });
    for (const g of PLATE_GROUPS) {
      setup.append(h('div', { class: 'plate-group' }, h('div', { class: 'label' }, `${g.emoji} ${g.label}`),
        h('div', { class: 'chips wrap' }, g.items.map(([e, n]) => chip({ label: n, emoji: e, small: true, on: (kid.plate[g.id] || []).includes(n), onToggle: v => {
          store.update(s => { const k = s.members.find(x => x.id === kid.id); const arr = new Set(k.plate[g.id] || []); v ? arr.add(n) : arr.delete(n); k.plate[g.id] = [...arr]; }, { silent: true });
        } })))));
    }
    const anyEmpty = PLATE_GROUPS.some(g => !liked(g).length);
    plate.append(h('details', { class: 'details', open: anyEmpty }, h('summary', {}, `What ${kid.name} eats (tap to set)`), setup));
    const reels = PLATE_GROUPS.map(g => createReel({ label: g.label }));
    reels.forEach((r, i) => { const l = liked(PLATE_GROUPS[i]); r.show(l.length ? { emoji: PLATE_GROUPS[i].emoji, name: '?' } : { emoji: '❔', name: 'pick some' }); });
    const reelsWrap = h('div', { class: 'reels mini', style: { '--n': 4 } }, reels.map(r => r.el));
    const out = h('p', { class: 'plate-result' });
    const go = h('button', { class: 'btn btn-grape btn-big full' }, `🎰 Spin ${kid.name}'s plate`);
    go.addEventListener('click', async () => {
      const k = memberById(kid.id);
      const groups = PLATE_GROUPS.map(g => g.items.filter(([e, n]) => (k.plate[g.id] || []).includes(n)));
      if (groups.some(g => !g.length)) { toast('Pick at least one food in each group first', { emoji: '👆' }); return; }
      go.disabled = true; sfx.lever();
      const finals = groups.map(g => pick(g));
      await Promise.all(reels.map((r, i) => r.spinTo({ emoji: finals[i][0], name: finals[i][1] }, groups[i].map(([e, n]) => ({ emoji: e, name: n })), { duration: 1000 + i * 350, delay: i * 100 })));
      go.disabled = false;
      sfx.fanfare(); burst({ count: 80, emoji: finals.map(f => f[0]) });
      out.textContent = `${k.emoji} ${k.name}'s plate: ` + finals.map(f => `${f[0]} ${f[1]}`).join(' + ');
      store.update(s => { s.stats.plates++; }, { silent: true });
    });
    plate.append(reelsWrap, go, out);
  }
  section.append(plate);
  root.replaceChildren(section);
}

function editMember(id) {
  const st = store.get();
  const m = id ? memberById(id) : { id: null, name: '', emoji: pick(AVATARS.slice(0, 10)), kid: false, appetite: 1, diets: [], dislikes: [], ratings: {}, plate: {} };
  const draft = { ...m, diets: [...m.diets], dislikes: [...m.dislikes] };
  const sheet = openSheet({ title: id ? 'Edit ' + m.name : 'Add someone', big: true });
  const name = h('input', { type: 'text', value: draft.name, placeholder: 'Name', autocomplete: 'off' });
  const emojiRow = h('div', { class: 'chips wrap avatars' }, AVATARS.map(a => { const b = h('button', { class: 'avatar-pick' + (a === draft.emoji ? ' on' : ''), type: 'button' }, a); b.addEventListener('click', () => { emojiRow.querySelectorAll('.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); draft.emoji = a; sfx.click(); }); return b; }));
  const dislikes = h('input', { type: 'text', value: draft.dislikes.join(', '), placeholder: 'mushrooms, onions, spicy…', autocomplete: 'off' });
  const body = h('div', {},
    field('Name', name),
    field('Avatar', emojiRow),
    field('Role', segmented([[false, '🧑 Grown-up'], [true, '🧒 Kid / picky eater']], draft.kid, v => { draft.kid = v; })),
    field('Appetite', segmented([[0.6, '🥄 Small'], [1, '🍽️ Normal'], [1.5, '🍖 Big']], draft.appetite, v => { draft.appetite = v; }), 'Adds up to the servings everything is scaled to.'),
    field('Diet', h('div', { class: 'chips wrap' }, DIET_TAGS.map(([k, label, e]) => chip({ label, emoji: e, small: true, on: draft.diets.includes(k), onToggle: v => { draft.diets = v ? [...draft.diets, k] : draft.diets.filter(x => x !== k); } }))), 'Meals that break these rules never show up for the whole family.'),
    field('Won\'t eat (ingredients)', dislikes, 'Comma-separated. Meals containing these get a 🙅 from this person.'),
    h('div', { class: 'row gap' },
      id ? h('button', { class: 'btn btn-danger', onClick: async () => { if (await confirm(`Remove ${m.name}?`, { ok: 'Remove', danger: true })) { store.update(s => { s.members = s.members.filter(x => x.id !== id); }); sheet.close(); } } }, '🗑') : null,
      h('button', { class: 'btn btn-primary grow', onClick: () => {
        draft.name = name.value.trim() || 'Someone';
        draft.dislikes = dislikes.value.split(',').map(keyOf).filter(Boolean);
        store.update(s => {
          if (id) { const x = s.members.find(y => y.id === id); Object.assign(x, { name: draft.name, emoji: draft.emoji, kid: draft.kid, appetite: draft.appetite, diets: draft.diets, dislikes: draft.dislikes }); }
          else s.members.push({ ...draft, id: uid() });
        });
        sfx.cheer(); sheet.close();
      } }, id ? 'Save' : 'Add')));
  sheet.setBody(body);
}

/** Swipe-style rating deck: one meal at a time. Kids love this part. */
function rateDeck(memberId) {
  const st = store.get();
  const m = memberById(memberId);
  const meals = st.meals.filter(x => !x.hidden);
  const unrated = shuffle(meals.filter(x => !m.ratings[x.id]));
  const rated = shuffle(meals.filter(x => m.ratings[x.id]));
  const queue = [...unrated, ...rated];
  let i = 0;
  const sheet = openSheet({ title: `${m.emoji} ${m.name}, what do you think?`, big: true, onClose: () => store.update(() => {}) });
  const progress = h('div', { class: 'muted center small' });
  const stage = h('div', { class: 'deck' });
  const btns = h('div', { class: 'deck-btns' });
  function card(meal) {
    const v = memberVerdict(m, meal);
    return h('div', { class: 'deck-card' },
      h('div', { class: 'deck-emoji' }, meal.emoji),
      h('div', { class: 'deck-name' }, meal.name),
      h('div', { class: 'muted small' }, meal.cuisine),
      v.dislikes.length ? h('div', { class: 'warn small' }, 'contains ' + v.dislikes.join(', ')) : null,
      m.ratings[meal.id] ? h('div', { class: 'small' }, 'Currently: ' + { love: '❤️ love', ok: '👍 fine', no: '🙅 nope' }[m.ratings[meal.id]]) : null);
  }
  function show() {
    if (i >= queue.length) {
      stage.replaceChildren(h('div', { class: 'deck-done' }, h('div', { class: 'deck-emoji' }, '🏆'), h('div', { class: 'deck-name' }, 'All rated!')));
      btns.replaceChildren(h('button', { class: 'btn btn-primary grow', onClick: () => sheet.close() }, 'Done'));
      sfx.fanfare(); burst({ count: 80, emoji: ['🏆', '⭐'] });
      return;
    }
    progress.textContent = `${i + 1} / ${queue.length}`;
    stage.replaceChildren(card(queue[i]));
  }
  function rate(v) {
    const meal = queue[i];
    store.update(s => { const mm = s.members.find(x => x.id === memberId); mm.ratings[meal.id] = v; }, { silent: true });
    const c = stage.firstChild;
    c.classList.add('fly-' + v);
    v === 'love' ? sfx.sparkle() : v === 'no' ? sfx.boo() : sfx.click();
    if (v === 'love') burst({ count: 30, emoji: ['❤️', meal.emoji], power: 8 });
    i++;
    setTimeout(show, 220);
  }
  btns.append(
    h('button', { class: 'deck-btn no', onClick: () => rate('no') }, '🙅', h('small', {}, 'Nope')),
    h('button', { class: 'deck-btn ok', onClick: () => rate('ok') }, '👍', h('small', {}, 'Fine')),
    h('button', { class: 'deck-btn love', onClick: () => rate('love') }, '❤️', h('small', {}, 'Love it')));
  sheet.setBody(h('div', {}, progress, stage, btns, h('button', { class: 'btn btn-ghost full', onClick: () => { i++; show(); } }, 'Skip →')));
  show();
}
