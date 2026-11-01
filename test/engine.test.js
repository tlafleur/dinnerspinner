import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIngredient, parseQty, formatQty, formatIngredient, aggregateIngredients, groupByAisle, violatesRules, memberVerdict, familyVerdict, pantryStatus, scoreMeals, pickWeek, autoServings, formatLineQty, pantryHas } from '../js/engine.js';
import { SEED_MEALS, SEED_SIDES } from '../js/data/seed.js';

const member = (over = {}) => ({ id: 'm', name: 'M', kid: false, appetite: 1, diets: [], dislikes: [], ratings: {}, ...over });
const state = (over = {}) => ({ settings: { houseRules: [], wildcards: {}, servings: null, nights: ['mon', 'tue', 'wed'] }, members: [], meals: SEED_MEALS.map(m => ({ ...m })), sides: SEED_SIDES, pantry: {}, history: [], ...over });

test('parseQty handles fractions and mixed numbers', () => {
  assert.equal(parseQty('1'), 1);
  assert.equal(parseQty('1/2'), 0.5);
  assert.equal(parseQty('1 1/2'), 1.5);
  assert.equal(parseQty('½'), 0.5);
  assert.equal(parseQty('2.5'), 2.5);
  assert.equal(parseQty('abc'), null);
});

test('parseIngredient splits quantity, unit, name and guesses aisle', () => {
  assert.deepEqual(parseIngredient('1.5 lb chicken thighs'), { n: 'chicken thighs', q: 1.5, u: 'lb', a: 'meat', staple: false });
  assert.deepEqual(parseIngredient('2 cups rice'), { n: 'rice', q: 2, u: 'cup', a: 'pantry', staple: false });
  assert.deepEqual(parseIngredient('1 onion, diced'), { n: 'onion', q: 1, u: '', a: 'produce', staple: false });
  assert.deepEqual(parseIngredient('salt'), { n: 'salt', q: null, u: '', a: 'spices', staple: true });
  assert.equal(parseIngredient('   '), null);
  assert.equal(parseIngredient('1 bag frozen peas').a, 'frozen');
  assert.equal(parseIngredient('2 can tuna').a, 'pantry');
  assert.equal(parseIngredient('1/2 cup of milk').n, 'milk');
});

test('every seed ingredient parses', () => {
  for (const m of [...SEED_MEALS, ...SEED_SIDES]) for (const line of m.ing) {
    const p = parseIngredient(line);
    assert.ok(p && p.n, `${m.name}: ${line}`);
    assert.ok(p.q != null, `${m.name}: ${line} has no quantity`);
  }
});

test('seed meals have unique ids and valid fields', () => {
  const ids = new Set();
  for (const m of SEED_MEALS) {
    assert.ok(!ids.has(m.id), 'dup ' + m.id); ids.add(m.id);
    assert.ok(m.kid >= 1 && m.kid <= 5);
    assert.ok(m.time > 0);
  }
});

test('formatQty uses kitchen fractions and rounds whole items up', () => {
  assert.equal(formatQty(1.5, 'cup'), '1½');
  assert.equal(formatQty(0.33, 'cup'), '⅓');
  assert.equal(formatQty(0.75, 'lb'), '¾');
  assert.equal(formatQty(2, 'lb'), '2');
  assert.equal(formatQty(1.5, ''), '2');
  assert.equal(formatQty(12.4, 'oz'), '12');
});

test('formatIngredient scales and pluralizes', () => {
  const ing = parseIngredient('1 onion');
  assert.equal(formatIngredient(ing, 2), '2 onions');
  assert.equal(formatIngredient(parseIngredient('2 tomato'), 1), '2 tomatoes');
  assert.equal(formatIngredient(parseIngredient('1 cup rice'), 2), '2 cups rice');
  assert.equal(formatIngredient(parseIngredient('1 clove garlic'), 3), '3 cloves garlic');
});

test('aggregateIngredients merges same items across meals and scales to servings', () => {
  const a = { serves: 4, ing: ['1 lb chicken breast', '2 cup rice', '1 onion'] };
  const b = { serves: 4, ing: ['1 lb chicken breast', '1 cup rice', '2 lime'] };
  const lines = aggregateIngredients([{ item: a, label: 'A' }, { item: b, label: 'B' }], 6);
  const chicken = lines.find(l => l.key === 'chicken breast');
  assert.equal(chicken.qtys[0].q, 3);
  assert.deepEqual(chicken.from, ['A', 'B']);
  assert.equal(formatLineQty(lines.find(l => l.key === 'rice')), '4½ cups');
  const groups = groupByAisle(lines);
  assert.ok(groups.find(g => g.id === 'produce').lines.some(l => l.key === 'lime'));
});

test('aggregateIngredients keeps different units separate', () => {
  const lines = aggregateIngredients([{ item: { serves: 4, ing: ['1 cup milk', '2 tbsp milk'] }, label: 'x' }], 4);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].qtys.length, 2);
});

test('violatesRules applies house rules', () => {
  const beef = SEED_MEALS.find(m => m.id === 'beef-tacos');
  const curry = SEED_MEALS.find(m => m.id === 'coconut-curry');
  assert.deepEqual(violatesRules(beef, new Set(['no-beef'])), ['no-beef']);
  assert.deepEqual(violatesRules(beef, new Set(['veg'])), ['veg']);
  assert.deepEqual(violatesRules(curry, new Set(['veg', 'vegan', 'gf', 'df', 'nf'])), []);
  const salmon = SEED_MEALS.find(m => m.id === 'salmon-rice');
  assert.deepEqual(violatesRules(salmon, new Set(['pesc'])), []);
  assert.deepEqual(violatesRules(beef, new Set(['pesc'])), ['pesc']);
});

test('memberVerdict uses ratings and dislikes', () => {
  const meal = SEED_MEALS.find(m => m.id === 'pita-pizzas'); // has mushrooms
  const kid = member({ kid: true, dislikes: ['mushroom'] });
  assert.equal(memberVerdict(kid, meal).v, 'no');
  assert.deepEqual(memberVerdict(kid, meal).dislikes, ['mushrooms']);
  const fan = member({ ratings: { 'pita-pizzas': 'love' } });
  assert.equal(memberVerdict(fan, meal).v, 'love');
  assert.equal(memberVerdict(member(), meal).v, 'unknown');
  const fv = familyVerdict([kid, fan], meal);
  assert.equal(fv.anyNo, true); assert.equal(fv.kidsNo, true); assert.equal(fv.loves, 1);
});

test('pantryStatus ignores staples and tolerates plurals', () => {
  const meal = { ing: ['1 lb chicken breast', '2 cup rice', 'salt', '1 onion'] };
  const ps = pantryStatus(meal, { 'chicken breasts': true, rice: true });
  assert.equal(ps.total, 3);
  assert.deepEqual(ps.missing, ['onion']);
  assert.ok(pantryHas({ tomatoes: true }, 'tomato'));
  assert.ok(pantryHas({ egg: true }, 'eggs'));
});

test('scoreMeals filters by kids, time, veg and pantry', () => {
  const kid = member({ id: 'k', kid: true, ratings: { 'beef-tacos': 'no' } });
  const st = state({ members: [kid] });
  const all = scoreMeals(st, {});
  assert.ok(all.some(p => p.meal.id === 'beef-tacos'));
  const kidsOnly = scoreMeals(st, { kids: true });
  assert.ok(!kidsOnly.some(p => p.meal.id === 'beef-tacos'));
  assert.ok(scoreMeals(st, { quick: true }).every(p => p.meal.time <= 30));
  assert.ok(scoreMeals(st, { veg: true }).every(p => p.meal.ok.includes('veg') || p.meal.ok.includes('vegan')));
  const fridge = scoreMeals(state({ pantry: { 'rice': true, 'egg': true, 'frozen peas and carrots': true, 'soy sauce': true, 'scallion': true, 'garlic': true, 'sesame oil': true, 'vegetable oil': true } }), { pantry: true });
  assert.ok(fridge.some(p => p.meal.id === 'veggie-fried-rice' && p.pantry.missing.length === 0));
});

test('recently cooked meals are heavily down-weighted', () => {
  const today = new Date('2026-11-01T12:00:00');
  const st = state({ history: [{ mealId: 'lasagna', date: '2026-10-30' }] });
  const w = id => scoreMeals(st, {}, today).find(p => p.meal.id === id).weight;
  assert.ok(w('lasagna') < w('baked-ziti') / 3);
});

test('pickWeek respects holds, avoids duplicates and prefers variety', () => {
  const st = state({ settings: { houseRules: [], wildcards: { 'w:takeout': true }, nights: ['mon', 'tue', 'wed', 'thu', 'fri'] } });
  let seed = 42; const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const slots = [{ held: true, id: 'lasagna' }, { held: false, id: null }, { held: false, id: null }, { held: false, id: null }, { held: false, id: null }];
  for (let i = 0; i < 20; i++) {
    const ids = pickWeek(st, slots, {}, rng);
    assert.equal(ids[0], 'lasagna');
    assert.equal(new Set(ids).size, 5, 'duplicates: ' + ids);
    assert.ok(ids.every(Boolean));
  }
});

test('autoServings sums appetites', () => {
  assert.equal(autoServings([member({ appetite: 1 }), member({ appetite: 1 }), member({ appetite: 0.6 })]), 2.5);
  assert.equal(autoServings([]), 1);
});

test('scaleFactor never shrinks a recipe unless scaleDown is on', async () => {
  const { scaleFactor, effectiveServings } = await import('../js/engine.js');
  const item = { serves: 4 };
  assert.equal(scaleFactor(item, 2.5), 1);
  assert.equal(scaleFactor(item, 2.5, true), 0.625);
  assert.equal(scaleFactor(item, 6), 1.5);
  assert.equal(effectiveServings(item, 2.5), 4);
  assert.equal(effectiveServings(item, 6), 6);
});
