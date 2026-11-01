// Single-object app state persisted to localStorage, with a tiny pub/sub.
import { SEED_MEALS, SEED_SIDES, DEFAULT_MEMBERS } from './data/seed.js';
import { uid } from './util.js';

export const STORAGE_KEY = 'dinnerspinner.v1';
const VERSION = 1;

function defaultSettings() {
  return {
    sound: true,
    fx: true,
    nights: ['mon', 'tue', 'wed', 'thu', 'fri'],
    servings: null, // null = auto from family
    weekdayMaxTime: 45,
    houseRules: [],
    wildcards: { 'w:takeout': true, 'w:leftovers': false, 'w:kids': false, 'w:eatout': false },
    shopHidePantry: true,
    scaleDown: false,
  };
}

export function freshState() {
  return {
    v: VERSION,
    onboarded: false,
    settings: defaultSettings(),
    members: DEFAULT_MEMBERS.map(m => ({ id: uid(), diets: [], dislikes: [], ratings: {}, plate: {}, ...m })),
    meals: SEED_MEALS.map(m => ({ ...m, custom: false, hidden: false })),
    sides: SEED_SIDES.map(s => ({ ...s, custom: false, hidden: false })),
    pantry: {},
    plan: null,          // { weekOf, slots: [{ day, id, sideId, cooked }] }
    tonight: null,       // { id, sideId, date, done }
    grocery: { checked: {}, extras: [], removed: {} },
    history: [],         // [{ mealId, date }]
    stats: { spins: 0, pulls: 0, cooked: 0, jackpots: 0, sides: 0, plates: 0 },
  };
}

function migrate(s) {
  if (!s || typeof s !== 'object') return freshState();
  const fresh = freshState();
  s.settings = { ...fresh.settings, ...(s.settings || {}) };
  s.settings.wildcards = { ...fresh.settings.wildcards, ...(s.settings.wildcards || {}) };
  for (const k of ['members', 'meals', 'sides', 'history']) if (!Array.isArray(s[k])) s[k] = fresh[k];
  s.pantry = s.pantry || {};
  s.grocery = { ...fresh.grocery, ...(s.grocery || {}) };
  s.stats = { ...fresh.stats, ...(s.stats || {}) };
  for (const m of s.members) { m.id = m.id || uid(); m.diets = m.diets || []; m.dislikes = m.dislikes || []; m.ratings = m.ratings || {}; m.plate = m.plate || {}; }
  s.v = VERSION;
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { console.warn('Could not load saved data', e); }
  return freshState();
}

let state = load();
const subs = new Set();
let saveTimer = null;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.warn('Could not save', e); }
  }, 50);
}

export const store = {
  get: () => state,
  /** Mutate state in place, then persist and notify. */
  update(fn, opts = {}) { fn(state); save(); if (!opts.silent) emit(); },
  replace(next) { state = migrate(next); save(); emit(); },
  reset() { state = freshState(); save(); emit(); },
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  export: () => JSON.stringify(state, null, 2),
};

function emit() { for (const fn of subs) { try { fn(state); } catch (e) { console.error(e); } } }

// ---------- Convenience accessors ----------
export const mealById = id => state.meals.find(m => m.id === id) || null;
export const sideById = id => state.sides.find(m => m.id === id) || null;
export const memberById = id => state.members.find(m => m.id === id) || null;

export function restoreSampleMeals() {
  store.update(s => {
    for (const m of SEED_MEALS) if (!s.meals.some(x => x.id === m.id)) s.meals.push({ ...m, custom: false, hidden: false });
    for (const m of SEED_SIDES) if (!s.sides.some(x => x.id === m.id)) s.sides.push({ ...m, custom: false, hidden: false });
    for (const m of s.meals) m.hidden = false;
  });
}
