// Shared sheets: meal result / detail, rating after cooking, side-dish wheel.
import { h, timeLabel, shuffle, pick } from '../util.js';
import { store, mealById, sideById } from '../store.js';
import { familyVerdict, pantryStatus, ingredientsOf, formatIngredient, servingsOf, scoreMeals, weightedSample, todayISO, violatesRules, activeRules, scaleFactor, effectiveServings } from '../engine.js';
import { openSheet, toast, avatar, stars } from './components.js';
import { createWheel } from './wheel.js';
import { sfx, say } from '../sound.js';
import { burst } from '../fx.js';
import { WILDCARDS } from '../data/seed.js';

export function verdictRow(meal) {
  const st = store.get();
  const fv = familyVerdict(st.members, meal);
  if (!st.members.length) return null;
  return h('div', { class: 'verdicts' }, fv.per.map(p => avatar(p.member, { verdict: p.v })));
}

export function ingredientList(item, servings) {
  const st = store.get();
  const factor = scaleFactor(item, servings, st.settings.scaleDown);
  return h('ul', { class: 'ing-list' }, ingredientsOf(item).map(ing => {
    const have = st.pantry && (st.pantry[ing.n] || ing.staple);
    return h('li', { class: have ? 'have' : '' }, h('span', { class: 'ing-check' }, have ? '✓' : '·'), formatIngredient(ing, factor));
  }));
}

/** Big result card for a meal (or wildcard). opts: { onCook, onSpinAgain, onSide, title } */
export function showMealSheet(id, opts = {}) {
  const st = store.get();
  const wild = WILDCARDS[id];
  const meal = wild || mealById(id);
  if (!meal) return;
  const servings = servingsOf(st);
  const fv = wild ? null : familyVerdict(st.members, meal);
  const ps = wild ? null : pantryStatus(meal, st.pantry);
  const sheet = openSheet({ big: true });

  const hero = h('div', { class: 'result-hero' },
    h('div', { class: 'result-emoji bounce-in' }, meal.emoji),
    h('h2', { class: 'result-name' }, meal.name),
    wild ? h('p', { class: 'muted' }, meal.blurb) : h('div', { class: 'meta' },
      h('span', { class: 'pill' }, '⏱ ' + timeLabel(meal.time)),
      h('span', { class: 'pill' }, meal.cuisine),
      stars(meal.kid || 3)),
  );

  const body = h('div', { class: 'result' }, hero);
  if (!wild) {
    if (st.members.length) body.append(h('div', { class: 'result-section' }, h('h3', {}, 'Family verdict'), verdictRow(meal),
      fv.anyNo ? h('p', { class: 'warn' }, fv.per.filter(p => p.v === 'no').map(p => `${p.member.name}: ${p.dislikes.length ? 'contains ' + p.dislikes.join(', ') : 'thumbs down'}`).join(' · ')) : null,
      fv.kidsLove ? h('p', { class: 'yay' }, '🎉 Every kid loves this one!') : null));
    body.append(h('div', { class: 'result-section' },
      h('h3', {}, `Ingredients · ${effectiveServings(meal, servings, st.settings.scaleDown)} servings`,
        ps.total ? h('span', { class: 'pill ' + (ps.missing.length === 0 ? 'pill-good' : ps.missing.length <= 2 ? 'pill-warn' : '') }, ps.missing.length === 0 ? '🧺 all in pantry' : `missing ${ps.missing.length}`) : null),
      ingredientList(meal, servings),
      meal.tip ? h('p', { class: 'tip' }, '💡 ' + meal.tip) : null,
      meal.link ? h('a', { class: 'btn btn-ghost btn-sm', href: meal.link, target: '_blank', rel: 'noopener' }, '📖 Open recipe ↗') : null));
  }
  const actions = h('div', { class: 'result-actions' });
  if (opts.onCook) actions.append(h('button', { class: 'btn btn-primary btn-big', onClick: () => { sheet.close(); opts.onCook(meal); } }, opts.cookLabel || '🍽️ Cook it tonight!'));
  if (opts.onSide && !wild) actions.append(h('button', { class: 'btn btn-mint', onClick: () => { sheet.close(); opts.onSide(meal); } }, '🥗 Spin a side'));
  if (opts.onFaceoff && !wild) actions.append(h('button', { class: 'btn btn-grape', onClick: () => { sheet.close(); opts.onFaceoff(meal); } }, '⚔️ Face-off with another'));
  if (opts.onSpinAgain) actions.append(h('button', { class: 'btn btn-ghost', onClick: () => { sheet.close(); opts.onSpinAgain(); } }, opts.againLabel || '🔁 Nah, spin again'));
  if (opts.onVeto && !wild && st.members.length) actions.append(h('button', { class: 'btn btn-ghost', onClick: () => { sheet.close(); showVeto(meal, opts.onVeto); } }, '🙅 Veto!'));
  if (opts.extraActions) actions.append(...opts.extraActions(sheet));
  body.append(actions);
  sheet.setBody(body);
  return sheet;
}

/** Who's vetoing? Records a 🙅 for that person and hands back to the caller. */
export function showVeto(meal, onVetoed) {
  const st = store.get();
  const sheet = openSheet({ title: `Who's vetoing ${meal.emoji} ${meal.name}?` });
  sheet.setBody(h('div', {},
    h('div', { class: 'veto-row' }, st.members.map(m => h('button', { class: 'veto-btn', onClick: () => {
      store.update(s => { const mm = s.members.find(x => x.id === m.id); if (mm) mm.ratings[meal.id] = 'no'; s.stats.vetoes++; });
      sfx.buzz(); say('Vetoed!');
      sheet.close();
      toast(`${m.name} vetoed it. Fewer ${meal.name} spins from now on.`, { emoji: '🙅', ms: 2800 });
      onVetoed && onVetoed(m);
    } }, avatar(m, { size: 'md' }), m.name))),
    h('p', { class: 'hint center' }, 'A veto counts as a thumbs-down from that person.')));
}

/** After cooking: quick thumbs for each family member. */
export function showRatingSheet(mealId, onDone) {
  const st = store.get();
  const meal = mealById(mealId);
  if (!meal || !st.members.length) { onDone && onDone(); return; }
  const sheet = openSheet({ title: `How was ${meal.name}? ${meal.emoji}`, onClose: () => onDone && onDone() });
  const rows = st.members.map(m => {
    const cur = m.ratings[meal.id];
    const row = h('div', { class: 'rate-row' }, avatar(m, { size: 'md' }), h('span', { class: 'rate-name' }, m.name));
    const btns = h('div', { class: 'rate-btns' });
    for (const [v, e, l] of [['no', '🙅', 'Nope'], ['ok', '👍', 'Fine'], ['love', '❤️', 'Loved it']]) {
      const b = h('button', { class: 'rate-btn' + (cur === v ? ' on' : ''), title: l }, e);
      b.addEventListener('click', () => {
        btns.querySelectorAll('.rate-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        v === 'love' ? sfx.sparkle() : v === 'no' ? sfx.boo() : sfx.click();
        store.update(s => { const mm = s.members.find(x => x.id === m.id); if (mm) mm.ratings[meal.id] = v; }, { silent: true });
      });
      btns.append(b);
    }
    row.append(btns);
    return row;
  });
  sheet.setBody(h('div', {}, ...rows, h('button', { class: 'btn btn-primary btn-big', onClick: () => { sheet.close(); } }, 'Done ✓')));
}

/** Sides wheel in a sheet. onPick(side) */
export function showSideWheel(onPick, mainMeal = null) {
  const st = store.get();
  const rules = activeRules(st);
  let sides = st.sides.filter(s => !s.hidden && !violatesRules({ ...s, protein: 'none' }, rules));
  if (!sides.length) { toast('No sides available', { emoji: '🤷' }); return; }
  sides = shuffle(sides).slice(0, 10);
  const sheet = openSheet({ title: 'Spin for a side 🥗' });
  const canvas = h('canvas', { class: 'wheel-canvas' });
  const wrap = h('div', { class: 'wheel-wrap small' }, h('div', { class: 'pointer' }), canvas, h('button', { class: 'hub', 'aria-label': 'Spin' }, 'SPIN'));
  const msg = h('p', { class: 'muted center' }, 'Tap the wheel!');
  sheet.setBody(h('div', {}, wrap, msg));
  const wheel = createWheel(canvas, {
    onTick: () => wrap.classList.add('tick') || setTimeout(() => wrap.classList.remove('tick'), 60),
    onDone: idx => {
      const side = sides[idx];
      sfx.ding();
      const r = canvas.getBoundingClientRect();
      burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 50, emoji: [side.emoji] });
      msg.textContent = `${side.emoji} ${side.name}!`;
      setTimeout(() => { sheet.close(); onPick(side); }, 700);
    },
    onTap: () => go(),
  });
  wheel.setSegments(sides.map(s => ({ label: s.name, emoji: s.emoji, weight: 1 + (s.kid || 3) * 0.1 })));
  requestAnimationFrame(() => wheel.resize());
  const go = () => { if (wheel.isSpinning()) return; const w = pick(sides.map((_, i) => i)); wheel.spin(w, { duration: 2800 }); msg.textContent = 'Spinning…'; };
  wrap.querySelector('.hub').addEventListener('click', go);
}

/** Mark a meal cooked today: history, stats, tonight. */
export function markCooked(mealId, { sideId = null } = {}) {
  const date = todayISO();
  store.update(s => {
    s.history.push({ mealId, date });
    s.stats.cooked++;
    s.tonight = { id: mealId, sideId, date, done: true };
    if (s.plan) { const slot = s.plan.slots.find(x => x.id === mealId && !x.cooked); if (slot) slot.cooked = true; }
  });
}

/** A quick single-reel style "re-roll" picker: returns a sheet listing weighted suggestions. */
export function showQuickPick(title, filters, onPick, excludeIds = []) {
  const st = store.get();
  const sheet = openSheet({ title });
  function render() {
    const scored = scoreMeals(st, { ...filters, excludeIds });
    const picks = weightedSample(scored, 6);
    const list = h('div', { class: 'pick-list' }, picks.map(p => h('button', { class: 'pick-row', onClick: () => { sfx.pop(); sheet.close(); onPick(p.meal.id); } },
      h('span', { class: 'pick-emoji' }, p.meal.emoji), h('span', { class: 'pick-name' }, p.meal.name), h('span', { class: 'pick-meta' }, timeLabel(p.meal.time)))));
    const all = h('details', { class: 'details' }, h('summary', {}, 'Choose from all meals'),
      h('div', { class: 'pick-list' }, scoreMeals(st, {}).map(p => h('button', { class: 'pick-row', onClick: () => { sfx.pop(); sheet.close(); onPick(p.meal.id); } },
        h('span', { class: 'pick-emoji' }, p.meal.emoji), h('span', { class: 'pick-name' }, p.meal.name), h('span', { class: 'pick-meta' }, timeLabel(p.meal.time))))));
    sheet.setBody(h('div', {}, picks.length ? list : h('p', { class: 'muted' }, 'Nothing matches the filters.'), h('button', { class: 'btn btn-ghost', onClick: () => { sfx.whoosh(); render(); } }, '🎲 Shuffle'), all));
  }
  render();
}

export { sideById };
