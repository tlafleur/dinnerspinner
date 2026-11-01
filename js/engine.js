// Pure logic: ingredient parsing, dietary rules, picky-eater verdicts,
// weighted selection for the wheel and the slot machine, grocery aggregation.
// No DOM here, so it can be unit tested with node:test.

export const AISLES = [
  ['produce', 'Produce', '🥬'],
  ['meat', 'Meat & Seafood', '🥩'],
  ['dairy', 'Dairy & Eggs', '🧀'],
  ['bakery', 'Bakery', '🍞'],
  ['frozen', 'Frozen', '🧊'],
  ['pantry', 'Pantry', '🥫'],
  ['spices', 'Spices & Sauces', '🧂'],
  ['other', 'Other', '🛒'],
];

const AISLE_KEYWORDS = [
  ['frozen', ['frozen', 'ice cream', 'pierogi', 'tater tot', 'fish sticks', 'nuggets', 'edamame']],
  ['spices', ['salt', 'pepper flakes', 'black pepper', 'cumin', 'paprika', 'chili powder', 'oregano', 'italian seasoning', 'garlic powder', 'cinnamon', 'curry', 'taco seasoning', 'fajita seasoning', 'garam masala', 'thyme', 'mustard powder', 'seasoning', 'soy sauce', 'teriyaki', 'bbq sauce', 'ketchup', 'mustard', 'mayo', 'hot sauce', 'vinegar', 'sesame oil', 'worcestershire', 'dressing', 'tartar', 'tzatziki', 'pesto', 'honey', 'maple syrup', 'tahini', 'sesame seeds', 'olive oil', 'vegetable oil']],
  ['bakery', ['bread', 'bun', 'tortilla', 'pita', 'naan', 'baguette', 'roll', 'taco shell', 'croutons', 'bagel', 'pizza dough']],
  ['dairy', ['milk', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'ricotta', 'feta', 'butter', 'yogurt', 'cream', 'egg', 'pie crust', 'tortellini', 'blue cheese', 'hummus']],
  ['meat', ['chicken', 'beef', 'pork', 'turkey', 'sausage', 'bacon', 'ham', 'steak', 'lamb', 'meatball', 'hot dog', 'kielbasa', 'salmon', 'shrimp', 'fish', 'cod', 'tilapia', 'pepperoni', 'rotisserie']],
  ['produce', ['onion', 'garlic', 'tomato', 'lettuce', 'romaine', 'pepper', 'carrot', 'celery', 'potato', 'broccoli', 'spinach', 'cilantro', 'lime', 'lemon', 'avocado', 'cucumber', 'zucchini', 'mushroom', 'ginger', 'scallion', 'green onion', 'corn', 'apple', 'banana', 'berries', 'grapes', 'cabbage', 'kale', 'basil', 'parsley', 'jalapeño', 'squash', 'asparagus', 'green beans', 'snap peas', 'bok choy', 'salad', 'coleslaw', 'cauliflower', 'watermelon', 'orange', 'strawberr', 'herbs']],
  ['pantry', ['pasta', 'spaghetti', 'penne', 'ziti', 'linguine', 'fettuccine', 'noodle', 'rice', 'quinoa', 'flour', 'sugar', 'oil', 'beans', 'broth', 'stock', 'marinara', 'pizza sauce', 'pasta sauce', 'salsa', 'peanut butter', 'tomatoes', 'tomato soup', 'coconut milk', 'breadcrumbs', 'chips', 'lentils', 'chickpeas', 'tuna', 'cornstarch', 'mix', 'applesauce', 'olives', 'pickles', 'ramen', 'wine', 'syrup', 'oats', 'cereal', 'crackers']],
];

export const STAPLES = ['salt', 'black pepper', 'olive oil', 'vegetable oil', 'butter', 'sugar', 'brown sugar', 'flour', 'soy sauce', 'garlic powder', 'ketchup', 'mayo', 'mustard', 'hot sauce', 'vinegar', 'honey', 'cornstarch', 'italian seasoning', 'paprika', 'cumin', 'chili powder', 'oregano', 'thyme', 'red pepper flakes', 'sesame oil', 'maple syrup', 'rice vinegar', 'apple cider vinegar', 'worcestershire sauce', 'mustard powder'];

const UNITS = {
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb', oz: 'oz', ounce: 'oz', ounces: 'oz',
  cup: 'cup', cups: 'cup', tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  clove: 'clove', cloves: 'clove', can: 'can', cans: 'can', pkg: 'pkg', package: 'pkg', packages: 'pkg', bunch: 'bunch', bunches: 'bunch',
  head: 'head', heads: 'head', g: 'g', kg: 'kg', ml: 'ml', l: 'l', slice: 'slice', slices: 'slice', stalk: 'stalk', stalks: 'stalk',
  pinch: 'pinch', handful: 'handful', bag: 'bag', bags: 'bag', box: 'box', boxes: 'box', jar: 'jar', jars: 'jar', bottle: 'bottle', bottles: 'bottle',
  sprig: 'sprig', sprigs: 'sprig', ear: 'ear', ears: 'ear', piece: 'piece', pieces: 'piece', pint: 'pint', pints: 'pint', quart: 'quart', quarts: 'quart',
};
const PLURAL_UNITS = { cup: 'cups', clove: 'cloves', can: 'cans', bunch: 'bunches', head: 'heads', slice: 'slices', stalk: 'stalks', bag: 'bags', box: 'boxes', jar: 'jars', bottle: 'bottles', sprig: 'sprigs', ear: 'ears', piece: 'pieces', pint: 'pints', quart: 'quarts', pkg: 'pkgs' };
const PLURAL_NAMES = { tomato: 'tomatoes', potato: 'potatoes', 'sweet potato': 'sweet potatoes', 'russet potato': 'russet potatoes', 'chicken breast': 'chicken breasts', 'pork chop': 'pork chops', 'hot dog': 'hot dogs', 'egg': 'eggs', 'onion': 'onions', 'carrot': 'carrots', 'lemon': 'lemons', 'lime': 'limes', 'avocado': 'avocados', 'banana': 'bananas', 'apple': 'apples', 'cucumber': 'cucumbers', 'bell pepper': 'bell peppers', 'scallion': 'scallions', 'pita': 'pitas', 'hamburger bun': 'hamburger buns', 'corn tortilla': 'corn tortillas', 'flour tortilla': 'flour tortillas', 'taco shell': 'taco shells', 'sub roll': 'sub rolls', 'naan': 'naan', 'orange': 'oranges' };

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };

export function parseQty(s) {
  if (!s) return null;
  s = s.trim();
  let total = 0, matched = false;
  for (const part of s.split(/\s+/)) {
    if (FRACTIONS[part] != null) { total += FRACTIONS[part]; matched = true; continue; }
    const m = part.match(/^(\d+)\/(\d+)$/);
    if (m) { total += +m[1] / +m[2]; matched = true; continue; }
    const n = Number(part);
    if (!Number.isNaN(n)) { total += n; matched = true; continue; }
    return null;
  }
  return matched ? total : null;
}

/** Guess the grocery aisle for an ingredient name. */
export function guessAisle(name) {
  const n = name.toLowerCase();
  for (const [aisle, words] of AISLE_KEYWORDS) {
    if (words.some(w => n.includes(w))) return aisle;
  }
  return 'other';
}

/** Parse "1 1/2 lb chicken thighs" → { n, q, u, a, staple }. */
export function parseIngredient(line) {
  let s = String(line || '').trim().replace(/\s+/g, ' ');
  if (!s) return null;
  const m = s.match(/^((?:\d+\/\d+|\d+(?:\.\d+)?|[½¼¾⅓⅔⅛])(?:\s+(?:\d+\/\d+|[½¼¾⅓⅔⅛]))?)\s*(.*)$/);
  let q = null, rest = s;
  if (m) { q = parseQty(m[1]); rest = m[2]; }
  let u = '';
  const um = rest.match(/^([A-Za-z]+)\.?\s+(.+)$/);
  if (um && UNITS[um[1].toLowerCase()]) { u = UNITS[um[1].toLowerCase()]; rest = um[2]; }
  rest = rest.replace(/^of\s+/i, '').trim();
  const n = rest.replace(/\s*,.*$/, '').trim().toLowerCase();
  if (!n) return null;
  return { n, q, u, a: guessAisle(n), staple: STAPLES.includes(n) };
}

export function ingredientsOf(item) {
  if (!item || !item.ing) return [];
  return item.ing.map(x => (typeof x === 'string' ? parseIngredient(x) : x)).filter(Boolean);
}

/** Canonical key for pantry/grocery matching. */
export function keyOf(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function pantryHas(pantry, name) {
  const k = keyOf(name);
  if (!pantry) return false;
  if (pantry[k]) return true;
  if (k.endsWith('es') && pantry[k.slice(0, -2)]) return true;
  if (k.endsWith('s') && pantry[k.slice(0, -1)]) return true;
  if (pantry[k + 's'] || pantry[k + 'es']) return true;
  return false;
}

export function pluralizeUnit(u, q) {
  if (!u) return '';
  return q > 1 && PLURAL_UNITS[u] ? PLURAL_UNITS[u] : u;
}

export function pluralizeName(n, q, u) {
  if (u || q == null || q <= 1) return n;
  if (PLURAL_NAMES[n]) return PLURAL_NAMES[n];
  if (/(s|sh|ch|x|z|ss|ies)$/.test(n)) return n;
  if (/[^aeiou]y$/.test(n)) return n.slice(0, -1) + 'ies';
  return n + 's';
}

/** Format a quantity with kitchen fractions: 1.5 → "1½", 0.33 → "⅓". */
export function formatQty(q, u) {
  if (q == null) return '';
  if (!u) q = Math.ceil(q - 1e-9); // whole items
  if (q >= 10) return String(Math.round(q));
  const whole = Math.floor(q + 1e-9);
  const frac = q - whole;
  const opts = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']];
  let best = opts[0];
  for (const o of opts) if (Math.abs(o[0] - frac) < Math.abs(best[0] - frac)) best = o;
  let w = whole, f = best[1];
  if (best[0] === 1) { w += 1; f = ''; }
  if (w === 0 && !f) return q > 0 ? '¼' : '0';
  return (w ? String(w) : '') + f;
}

export function formatIngredient(ing, factor = 1) {
  const q = ing.q == null ? null : ing.q * factor;
  const qs = formatQty(q, ing.u);
  const us = pluralizeUnit(ing.u, q);
  const ns = pluralizeName(ing.n, q, ing.u);
  return [qs, us, ns].filter(Boolean).join(' ');
}

// ---------- Dietary rules ----------

const MEAT = new Set(['chicken', 'beef', 'pork', 'turkey', 'sausage', 'fish', 'shrimp']);
const SEAFOOD = new Set(['fish', 'shrimp']);

/** All diet rules in force for the household: house rules plus every member's diets. */
export function activeRules(state) {
  const rules = new Set(state.settings.houseRules || []);
  for (const m of state.members || []) for (const d of m.diets || []) rules.add(d);
  return rules;
}

export function violatesRules(meal, rules) {
  const ok = new Set(meal.ok || []);
  const p = meal.protein || 'none';
  const bad = [];
  for (const r of rules) {
    if (r === 'veg' && (MEAT.has(p) || !(ok.has('veg') || ok.has('vegan')))) bad.push(r);
    else if (r === 'vegan' && !ok.has('vegan')) bad.push(r);
    else if (r === 'pesc' && MEAT.has(p) && !SEAFOOD.has(p)) bad.push(r);
    else if (r === 'gf' && !ok.has('gf')) bad.push(r);
    else if (r === 'df' && !ok.has('df')) bad.push(r);
    else if (r === 'nf' && !ok.has('nf')) bad.push(r);
    else if (r === 'no-pork' && (p === 'pork' || p === 'sausage')) bad.push(r);
    else if (r === 'no-beef' && p === 'beef') bad.push(r);
  }
  return bad;
}

// ---------- Picky eater verdicts ----------

/** What a member thinks of a meal: { v: 'love'|'ok'|'no'|'unknown', dislikes: [ingredient names] } */
export function memberVerdict(member, meal) {
  const rating = (member.ratings || {})[meal.id];
  const dislikes = [];
  const dl = (member.dislikes || []).map(keyOf).filter(Boolean);
  if (dl.length) {
    for (const ing of ingredientsOf(meal)) {
      if (dl.some(d => ing.n.includes(d))) dislikes.push(ing.n);
    }
  }
  let v = rating || 'unknown';
  if (v !== 'no' && dislikes.length) v = 'no';
  return { v, dislikes, rating: rating || null };
}

/** Family verdict summary for a meal. */
export function familyVerdict(members, meal) {
  const per = (members || []).map(m => ({ member: m, ...memberVerdict(m, meal) }));
  const kids = per.filter(p => p.member.kid);
  const anyNo = per.some(p => p.v === 'no');
  const kidsNo = kids.some(p => p.v === 'no');
  const kidsLove = kids.length > 0 && kids.every(p => p.v === 'love');
  const loves = per.filter(p => p.v === 'love').length;
  return { per, anyNo, kidsNo, kidsLove, loves, approved: !anyNo };
}

// ---------- Pantry ----------

export function pantryStatus(meal, pantry) {
  const ings = ingredientsOf(meal).filter(i => !i.staple);
  const missing = ings.filter(i => !pantryHas(pantry, i.n)).map(i => i.n);
  const have = ings.length - missing.length;
  return { have, total: ings.length, missing, ready: ings.length ? have / ings.length : 1 };
}

// ---------- Candidate scoring ----------

export function daysSince(dateISO, today = new Date()) {
  if (!dateISO) return Infinity;
  const d = new Date(dateISO + 'T00:00:00');
  return Math.floor((today - d) / 86400000);
}

export function lastCooked(history, mealId) {
  let last = null;
  for (const h of history || []) if (h.mealId === mealId && (!last || h.date > last)) last = h.date;
  return last;
}

/**
 * Score every visible meal for the current family and filters.
 * filters: { pantry, kids, quick, veg, maxTime, cuisine, excludeIds }
 * Returns [{ meal, weight, verdict, pantry, why }] sorted by weight desc. weight 0 = excluded.
 */
export function scoreMeals(state, filters = {}, today = new Date()) {
  const rules = activeRules(state);
  const members = state.members || [];
  const hasKids = members.some(m => m.kid);
  const out = [];
  for (const meal of state.meals) {
    if (meal.hidden) continue;
    if (filters.excludeIds && filters.excludeIds.includes(meal.id)) continue;
    const why = [];
    let w = 1;
    const bad = violatesRules(meal, rules);
    if (bad.length) { continue; }
    const verdict = familyVerdict(members, meal);
    const ps = pantryStatus(meal, state.pantry || {});
    if (filters.kids && (verdict.anyNo)) continue;
    if (filters.kids && hasKids && verdict.per.filter(p => p.member.kid).some(p => p.v === 'unknown') && meal.kid < 3) continue;
    const maxTime = filters.maxTime || (filters.quick ? 30 : 0);
    if (maxTime && meal.time > maxTime) continue;
    if (filters.veg && !(meal.ok || []).includes('veg') && !(meal.ok || []).includes('vegan')) continue;
    if (filters.cuisine && meal.cuisine !== filters.cuisine) continue;
    if (filters.pantry) {
      if (ps.missing.length > 2) continue;
      w *= ps.missing.length === 0 ? 1.6 : ps.missing.length === 1 ? 1 : 0.5;
      if (ps.missing.length === 0) why.push('ready to cook');
    }
    // family ratings
    for (const p of verdict.per) {
      if (p.v === 'love') { w *= 1.5; }
      else if (p.v === 'no') { w *= 0.25; }
    }
    if (verdict.loves) why.push(`${verdict.loves} ❤️`);
    if (hasKids) {
      const unknownKids = verdict.per.filter(p => p.member.kid && p.v === 'unknown').length;
      if (unknownKids) w *= 0.7 + 0.15 * (meal.kid || 3); // prior from kid-friendliness
    }
    // recency
    const ds = daysSince(lastCooked(state.history, meal.id), today);
    if (ds < 7) { w *= 0.15; why.push('cooked this week'); }
    else if (ds < 14) { w *= 0.5; why.push('cooked recently'); }
    else if (ds > 45 && ds !== Infinity) { w *= 1.2; why.push("haven't had in a while"); }
    out.push({ meal, weight: w, verdict, pantry: ps, why });
  }
  out.sort((a, b) => b.weight - a.weight);
  return out;
}

export function weightedPick(items, rng = Math.random, weightOf = x => x.weight) {
  const total = items.reduce((s, x) => s + Math.max(0, weightOf(x)), 0);
  if (!total) return items.length ? items[Math.floor(rng() * items.length)] : null;
  let r = rng() * total;
  for (const x of items) { r -= Math.max(0, weightOf(x)); if (r <= 0) return x; }
  return items[items.length - 1];
}

/** Pick up to n distinct items by weight without replacement, with a diversity penalty between picks. */
export function weightedSample(items, n, rng = Math.random, penalty = null) {
  const pool = items.map(x => ({ ...x, w: x.weight }));
  const picked = [];
  while (picked.length < n && pool.length) {
    const p = weightedPick(pool, rng, x => x.w);
    if (!p) break;
    picked.push(p);
    pool.splice(pool.indexOf(p), 1);
    if (penalty) for (const q of pool) q.w *= penalty(p, q);
  }
  return picked;
}

export const varietyPenalty = (a, b) => {
  let f = 1;
  if (a.meal && b.meal) {
    if (a.meal.protein === b.meal.protein) f *= 0.45;
    if (a.meal.cuisine === b.meal.cuisine) f *= 0.6;
    if (a.meal.emoji === b.meal.emoji) f *= 0.5;
  }
  return f;
};

/**
 * Pick meals for a week. `slots` is an array of { day, held: bool, id: mealId|wildcardId|null }.
 * Honors per-day theme nights (settings.themes[day] = cuisine name or 'veg'), holds, wildcards and variety.
 * Returns the array of ids (held slots unchanged).
 */
export function pickWeek(state, slots, filters = {}, rng = Math.random, today = new Date()) {
  const themes = state.settings.themes || {};
  const wc = state.settings.wildcards || {};
  const result = slots.map(s => (s.held ? s.id : null));
  const chosen = result.filter(Boolean).map(id => ({ meal: state.meals.find(m => m.id === id) })).filter(c => c.meal);
  const usedWild = new Set(result.filter(id => id && id.startsWith('w:')));
  // Themed nights first: they are the most constrained.
  const order = slots.map((s, i) => i).filter(i => !slots[i].held)
    .sort((a, b) => (themes[slots[b].day] ? 1 : 0) - (themes[slots[a].day] ? 1 : 0));
  for (const i of order) {
    const theme = themes[slots[i].day] || '';
    const base = { ...filters, excludeIds: result.filter(Boolean) };
    let f = { ...base };
    if (theme === 'veg') f.veg = true; else if (theme) f.cuisine = theme;
    let items = scoreMeals(state, f, today).map(x => ({ ...x }));
    if (!items.length && theme) items = scoreMeals(state, base, today).map(x => ({ ...x })); // theme has no meals: fall back
    if (!theme) for (const id of ['w:takeout', 'w:leftovers', 'w:kids', 'w:eatout']) if (wc[id] && !usedWild.has(id)) items.push({ wildId: id, weight: 0.5 });
    for (const it of items) if (it.meal) for (const c of chosen) it.weight *= varietyPenalty(c, it);
    const p = weightedPick(items, rng);
    if (!p) continue;
    if (p.wildId) { usedWild.add(p.wildId); result[i] = p.wildId; }
    else { result[i] = p.meal.id; chosen.push(p); }
  }
  return result;
}

// ---------- Servings & grocery ----------

export function autoServings(members) {
  const s = (members || []).reduce((t, m) => t + (m.appetite || 1), 0);
  return Math.max(1, Math.round(s * 2) / 2);
}

export function servingsOf(state) {
  return state.settings.servings || autoServings(state.members);
}

/** Multiplier for a recipe: scale up to the family size; only scale down if the setting allows. */
export function scaleFactor(item, servings, scaleDown = false) {
  const f = servings / (item.serves || 4);
  return scaleDown ? f : Math.max(1, f);
}

/** Servings a recipe will actually make after scaling. */
export function effectiveServings(item, servings, scaleDown = false) {
  return Math.round(scaleFactor(item, servings, scaleDown) * (item.serves || 4) * 2) / 2;
}

/**
 * Aggregate ingredients for a list of {item (meal/side), label} into grocery lines.
 * Returns [{ key, name, a, staple, qtys: [{q,u}], from: [labels] }]
 */
export function aggregateIngredients(entries, servings, scaleDown = false) {
  const map = new Map();
  for (const { item, label } of entries) {
    if (!item) continue;
    const factor = scaleFactor(item, servings, scaleDown);
    for (const ing of ingredientsOf(item)) {
      const key = keyOf(ing.n);
      let line = map.get(key);
      if (!line) { line = { key, name: ing.n, a: ing.a, staple: !!ing.staple, qtys: [], from: [] }; map.set(key, line); }
      const q = ing.q == null ? null : ing.q * factor;
      const same = line.qtys.find(x => x.u === ing.u);
      if (same) { if (q != null && same.q != null) same.q += q; } else line.qtys.push({ q, u: ing.u });
      if (label && !line.from.includes(label)) line.from.push(label);
    }
  }
  return [...map.values()];
}

export function formatLineQty(line) {
  return line.qtys.map(({ q, u }) => {
    if (q == null) return '';
    return [formatQty(q, u), pluralizeUnit(u, q)].filter(Boolean).join(' ');
  }).filter(Boolean).join(' + ');
}

export function groupByAisle(lines) {
  const groups = AISLES.map(([id, label, emoji]) => ({ id, label, emoji, lines: [] }));
  for (const l of lines) (groups.find(g => g.id === l.a) || groups[groups.length - 1]).lines.push(l);
  for (const g of groups) g.lines.sort((a, b) => a.name.localeCompare(b.name));
  return groups.filter(g => g.lines.length);
}

export function todayISO(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
