// Collectible stickers. Pure checks over state; app.js awards them.
import { mealById } from './store.js';

function streak(history) {
  const days = [...new Set((history || []).map(h => h.date))].sort().reverse();
  let n = 0, prev = null;
  for (const d of days) {
    if (prev && (new Date(prev) - new Date(d)) / 86400000 !== 1) break;
    n++; prev = d;
  }
  return n;
}

export const BADGES = [
  { id: 'first-spin', emoji: '🎡', name: 'First Spin', desc: 'Spin the wheel once', test: s => s.stats.spins >= 1 },
  { id: 'high-roller', emoji: '🎰', name: 'High Roller', desc: 'Pull the lever', test: s => s.stats.pulls >= 1 },
  { id: 'planner', emoji: '📅', name: 'Planner', desc: 'Lock in a week', test: s => s.stats.weeks >= 1 },
  { id: 'flick', emoji: '🤌', name: 'Flick Master', desc: 'Spin the wheel with a flick', test: s => s.stats.flicks >= 1 },
  { id: 'chef', emoji: '👩‍🍳', name: 'Home Chef', desc: 'Cook 5 dinners', test: s => s.stats.cooked >= 5 },
  { id: 'master', emoji: '🏆', name: 'Master Chef', desc: 'Cook 25 dinners', test: s => s.stats.cooked >= 25 },
  { id: 'streak', emoji: '🔥', name: 'On a Roll', desc: 'Cook 3 nights in a row', test: s => streak(s.history) >= 3 },
  { id: 'world', emoji: '🌍', name: 'World Tour', desc: 'Cook 5 different cuisines', test: s => new Set(s.history.map(h => (mealById(h.mealId) || {}).cuisine).filter(Boolean)).size >= 5 },
  { id: 'jackpot', emoji: '💎', name: 'Jackpot!', desc: 'Hit a Family Jackpot', test: s => s.stats.jackpots >= 1 },
  { id: 'critic', emoji: '🎴', name: 'Food Critic', desc: 'Someone rates 20 meals', test: s => s.members.some(m => Object.keys(m.ratings || {}).length >= 20) },
  { id: 'tough', emoji: '🙅', name: 'Tough Crowd', desc: 'Veto 3 spins', test: s => s.stats.vetoes >= 3 },
  { id: 'faceoff', emoji: '⚔️', name: 'Showdown', desc: 'Settle a face-off', test: s => s.stats.faceoffs >= 1 },
  { id: 'raider', emoji: '🧺', name: 'Fridge Raider', desc: 'Stock 15 pantry items', test: s => Object.keys(s.pantry).length >= 15 },
  { id: 'plate', emoji: '🍽️', name: 'Plate Builder', desc: 'Build a plate', test: s => s.stats.plates >= 1 },
  { id: 'author', emoji: '✍️', name: 'Author', desc: 'Add your own meal', test: s => s.meals.some(m => m.custom) },
  { id: 'family', emoji: '👨‍👩‍👧‍👦', name: 'Full Table', desc: 'Add 4 family members', test: s => s.members.length >= 4 },
];

/** Returns newly earned badges (not yet in state.badges). */
export function newlyEarned(state) {
  return BADGES.filter(b => !state.badges[b.id] && safe(() => b.test(state)));
}
function safe(fn) { try { return fn(); } catch { return false; } }
