import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../js/questions.js';
import {
  dateKey, dayNumber, keyFromDayNumber, pickDailyQuestions, scoreRound, levelFor,
  currentStreak, applyRound, emptyState, earnedBadgeIds, isDoneToday,
} from '../js/logic.js';

test('question bank: every answer is one of its options and ids are unique', () => {
  const ids = new Set();
  for (const q of QUESTIONS) {
    assert.ok(q.options.includes(q.answer), `${q.id} answer missing from options`);
    assert.equal(new Set(q.options).size, q.options.length, `${q.id} has duplicate options`);
    assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
    ids.add(q.id);
  }
});

test('daily picks are the same for everyone on the same day', () => {
  const a = pickDailyQuestions(QUESTIONS, '2026-10-12');
  const b = pickDailyQuestions(QUESTIONS, '2026-10-12');
  assert.deepEqual(a, b);
  assert.equal(a.length, 5);
  assert.equal(new Set(a.map((q) => q.id)).size, 5);
});

test('daily picks change from day to day', () => {
  const a = pickDailyQuestions(QUESTIONS, '2026-10-12').map((q) => q.id).join();
  const b = pickDailyQuestions(QUESTIONS, '2026-10-13').map((q) => q.id).join();
  assert.notEqual(a, b);
});

test('dateKey uses the local calendar date', () => {
  assert.equal(dateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(dateKey(new Date(2026, 11, 31, 0, 1)), '2026-12-31');
});

test('day numbers round-trip', () => {
  for (const k of ['2026-02-28', '2026-03-01', '2028-02-29']) {
    assert.equal(keyFromDayNumber(dayNumber(k)), k);
  }
  assert.equal(dayNumber('2026-10-13') - dayNumber('2026-10-12'), 1);
});

test('scoring: points per right answer and perfect bonus', () => {
  const qs = pickDailyQuestions(QUESTIONS, '2026-10-12');
  const allRight = qs.map((q) => q.answer);
  assert.deepEqual(scoreRound(qs, allRight), { correct: 5, total: 5, perfect: true, points: 70 });
  const fourRight = allRight.map((a, i) => (i === 0 ? qs[0].options.find((o) => o !== a) : a));
  assert.deepEqual(scoreRound(qs, fourRight), { correct: 4, total: 5, perfect: false, points: 40 });
  const none = qs.map(() => '__wrong__');
  assert.equal(scoreRound(qs, none).points, 0);
});

test('levels step up at the thresholds', () => {
  assert.equal(levelFor(0).name, 'Starter');
  assert.equal(levelFor(99).name, 'Starter');
  assert.equal(levelFor(100).name, 'Learner');
  assert.equal(levelFor(100).next.name, 'Reader');
  assert.equal(levelFor(1000000).next, null);
});

const result = (correct, total = 5) => ({ correct, total, perfect: correct === total, points: correct * 10 + (correct === total ? 20 : 0) });

test('streak: consecutive days count, a missed day resets it', () => {
  let s = emptyState();
  s = applyRound(s, '2026-10-10', result(3)).state;
  assert.equal(currentStreak(s, '2026-10-10'), 1);
  s = applyRound(s, '2026-10-11', result(5)).state;
  s = applyRound(s, '2026-10-12', result(4)).state;
  assert.equal(s.streak, 3);
  assert.equal(s.bestStreak, 3);
  assert.equal(currentStreak(s, '2026-10-13'), 3, 'still alive until the day is missed');
  assert.equal(currentStreak(s, '2026-10-14'), 0, 'gone after two missed days');
  s = applyRound(s, '2026-10-14', result(2)).state;
  assert.equal(s.streak, 1);
  assert.equal(s.bestStreak, 3, 'best streak is kept');
});

test('a second round on the same day earns nothing', () => {
  let s = applyRound(emptyState(), '2026-10-12', result(5)).state;
  const again = applyRound(s, '2026-10-12', result(5));
  assert.equal(again.earned, 0);
  assert.equal(again.state.points, s.points);
  assert.equal(again.state.rounds, 1);
  assert.ok(isDoneToday(s, '2026-10-12'));
});

test('badges unlock from state', () => {
  let s = emptyState();
  assert.deepEqual(earnedBadgeIds(s), []);
  s = applyRound(s, '2026-10-12', result(5)).state;
  const ids = earnedBadgeIds(s);
  assert.ok(ids.includes('first_round'));
  assert.ok(ids.includes('perfect'));
  assert.ok(!ids.includes('streak_3'));
});

test('history keeps only the last 14 days', () => {
  let s = emptyState();
  for (let i = 0; i < 20; i++) s = applyRound(s, keyFromDayNumber(dayNumber('2026-10-01') + i), result(1)).state;
  assert.equal(s.history.length, 14);
  assert.equal(s.history[0].key, keyFromDayNumber(dayNumber('2026-10-01') + 6));
});
