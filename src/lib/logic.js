// Pure game logic: no DOM, no storage. Easy to test with `npm test`.

export const QUESTIONS_PER_DAY = 5;
export const POINTS_PER_CORRECT = 10;
export const PERFECT_BONUS = 20;
export const HISTORY_DAYS = 14;

export const LEVELS = [
  { name: 'Starter', min: 0 },
  { name: 'Learner', min: 100 },
  { name: 'Reader', min: 250 },
  { name: 'Explorer', min: 500 },
  { name: 'Scholar', min: 900 },
  { name: 'Expert', min: 1400 },
  { name: 'Master', min: 2000 },
];

export const BADGES = [
  { id: 'first_round', icon: '🌱', name: 'First Step', desc: 'Finish your first daily round.', earned: (s) => s.rounds >= 1 },
  { id: 'streak_3', icon: '🔥', name: 'On Fire', desc: 'Reach a 3-day streak.', earned: (s) => s.bestStreak >= 3 },
  { id: 'streak_7', icon: '🏆', name: 'Week Warrior', desc: 'Reach a 7-day streak.', earned: (s) => s.bestStreak >= 7 },
  { id: 'perfect', icon: '⭐', name: 'Perfect Round', desc: 'Get all 5 right in one round.', earned: (s) => s.perfects >= 1 },
  { id: 'words_50', icon: '📚', name: '50 Right', desc: 'Get 50 answers right in total.', earned: (s) => s.correct >= 50 },
  { id: 'level_3', icon: '🚀', name: 'Reader', desc: 'Reach level 3.', earned: (s) => levelFor(s.points).index >= 2 },
];

export function emptyState() {
  return { points: 0, streak: 0, bestStreak: 0, lastDoneKey: null, rounds: 0, correct: 0, perfects: 0, history: [], round: null };
}

const pad = (n) => String(n).padStart(2, '0');

// Local calendar date as YYYY-MM-DD, so "today" follows the player's clock.
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Whole days since 1970-01-01 for a YYYY-MM-DD key (timezone-safe arithmetic).
export function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function keyFromDayNumber(n) {
  const dt = new Date(n * 86400000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

// Small seeded PRNG (mulberry32) so every player gets the same questions on the same day.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, rand) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Same date -> same 5 questions, same option order, for every player.
export function pickDailyQuestions(bank, key, count = QUESTIONS_PER_DAY) {
  if (bank.length < count) throw new Error('Question bank is too small');
  const rand = mulberry32(dayNumber(key) * 9973 + 12345);
  const picked = shuffle(bank.map((_, i) => i), rand).slice(0, count);
  return picked.map((i) => {
    const q = bank[i];
    return { id: q.id, q: q.q, options: shuffle(q.options, rand), answer: q.answer, why: q.why };
  });
}

export function scoreRound(questions, picks) {
  const correct = questions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
  const total = questions.length;
  const perfect = total > 0 && correct === total;
  const points = correct * POINTS_PER_CORRECT + (perfect ? PERFECT_BONUS : 0);
  return { correct, total, perfect, points };
}

export function levelFor(points) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) index = i;
  const next = LEVELS[index + 1] || null;
  return { index, level: index + 1, name: LEVELS[index].name, min: LEVELS[index].min, next };
}

// Streak is "live" only if the last completed day is today or yesterday.
export function currentStreak(state, key) {
  if (!state.lastDoneKey) return 0;
  const gap = dayNumber(key) - dayNumber(state.lastDoneKey);
  return gap === 0 || gap === 1 ? state.streak : 0;
}

export function isDoneToday(state, key) {
  return state.lastDoneKey === key;
}

// Records a finished round. Calling it twice on the same day earns nothing the second time.
export function applyRound(state, key, result) {
  if (isDoneToday(state, key)) return { state, earned: 0 };
  const gap = state.lastDoneKey ? dayNumber(key) - dayNumber(state.lastDoneKey) : null;
  const streak = gap === 1 ? state.streak + 1 : 1;
  const next = {
    ...state,
    points: state.points + result.points,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastDoneKey: key,
    rounds: state.rounds + 1,
    correct: state.correct + result.correct,
    perfects: state.perfects + (result.perfect ? 1 : 0),
    history: [...state.history, { key, correct: result.correct, total: result.total }].slice(-HISTORY_DAYS),
    round: null,
  };
  return { state: next, earned: result.points };
}

export function earnedBadgeIds(state) {
  return BADGES.filter((b) => b.earned(state)).map((b) => b.id);
}
