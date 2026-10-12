import { QUESTIONS } from './questions.js';
import {
  BADGES, QUESTIONS_PER_DAY, POINTS_PER_CORRECT, PERFECT_BONUS, emptyState, dateKey, dayNumber, keyFromDayNumber,
  pickDailyQuestions, scoreRound, levelFor, currentStreak, isDoneToday, applyRound, earnedBadgeIds,
} from './logic.js';

const STORAGE_KEY = 'word-streak-v1';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const app = document.getElementById('app');
const topStats = document.getElementById('topStats');

let state = loadState();
let view = 'home';     // 'home' | 'quiz' | 'result'
let questions = [];    // today's questions while a round is open
let feedback = null;   // { index, picked } while the answer to one question is shown
let result = null;     // summary of the last finished round

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked: keep playing */ }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderTop() {
  const streak = currentStreak(state, dateKey());
  topStats.innerHTML =
    `<span class="pill" aria-label="${state.points} points">⭐ ${state.points}</span>` +
    `<span class="pill" aria-label="${streak} day streak">🔥 ${streak}</span>`;
}

function weekHtml(key) {
  const n = dayNumber(key);
  const cells = [6, 5, 4, 3, 2, 1, 0].map((back) => {
    const dayKey = keyFromDayNumber(n - back);
    const h = state.history.find((x) => x.key === dayKey);
    const name = DAY_NAMES[new Date((n - back) * 86400000).getUTCDay()];
    let cls = '';
    let mark = '–';
    let label = 'not played';
    if (h) {
      const perfect = h.correct === h.total;
      cls = perfect ? 'full' : 'part';
      mark = perfect ? '★' : `${h.correct}/${h.total}`;
      label = `${h.correct} of ${h.total} right`;
    }
    return `<div><div class="day">${name}</div>` +
      `<div class="dot ${cls}${back === 0 ? ' today' : ''}" aria-label="${name}: ${label}">${mark}</div></div>`;
  });
  return `<div class="week">${cells.join('')}</div>`;
}

function renderHome() {
  const key = dateKey();
  const done = isDoneToday(state, key);
  const streak = currentStreak(state, key);
  const lv = levelFor(state.points);
  const openPicks = state.round && state.round.key === key ? state.round.picks.length : 0;
  const pct = lv.next ? Math.round(((state.points - lv.min) / (lv.next.min - lv.min)) * 100) : 100;
  const toNext = lv.next ? lv.next.min - state.points : 0;

  let action;
  if (done) {
    const last = state.history[state.history.length - 1];
    action = `<p><strong>✅ Done for today!</strong></p>
      <p>You got ${last.correct} of ${last.total} right. A new challenge starts tomorrow.</p>`;
  } else if (openPicks > 0) {
    action = `<p>You are on question ${openPicks + 1} of ${QUESTIONS_PER_DAY}.</p>
      <button class="btn" data-action="continue">Continue today's challenge</button>`;
  } else {
    action = `<button class="btn" data-action="start">Start today's ${QUESTIONS_PER_DAY} questions</button>`;
  }

  const badgeCards = BADGES.map((b) => {
    const got = b.earned(state);
    return `<div class="badge ${got ? '' : 'locked'}">
      <div class="ico" aria-hidden="true">${b.icon}</div>
      <strong>${esc(b.name)}</strong>
      <span>${esc(b.desc)}${got ? ' ✓' : ''}</span></div>`;
  }).join('');

  app.innerHTML = `
    <section class="card hero">
      <h1>Today's challenge</h1>
      <p class="muted">${QUESTIONS_PER_DAY} short questions. About 2 minutes.</p>
      ${action}
    </section>

    <section class="grid-3" aria-label="Your stats">
      <div class="stat"><strong>${state.points}</strong><span>Points</span></div>
      <div class="stat"><strong>${streak}</strong><span>Day streak</span></div>
      <div class="stat"><strong>${state.correct}</strong><span>Right answers</span></div>
    </section>

    <section class="card">
      <h2>Level ${lv.level}: ${esc(lv.name)}</h2>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Progress to next level">
        <div style="width:${pct}%"></div></div>
      <p class="small muted">${lv.next ? `${toNext} points to ${esc(lv.next.name)}` : 'You reached the top level!'}</p>
    </section>

    <section class="card">
      <h2>Last 7 days</h2>
      <p class="small muted">★ = all right. Numbers = right answers. – = not played.</p>
      ${weekHtml(key)}
    </section>

    <section class="card">
      <h2>Badges</h2>
      <div class="badges">${badgeCards}</div>
    </section>

    <section class="card">
      <details>
        <summary>How points work</summary>
        <ul>
          <li>You get ${POINTS_PER_CORRECT} points for each right answer.</li>
          <li>A perfect round (${QUESTIONS_PER_DAY} of ${QUESTIONS_PER_DAY} right) gives a +${PERFECT_BONUS} bonus.</li>
          <li>You can play one round per day. Playing again the same day earns nothing more.</li>
          <li>Finish a round every day to keep your streak. If you miss a day, the streak starts again at 1.</li>
          <li>Your level goes up as your points go up.</li>
          <li class="muted">Points show your progress in this app. Cash or other rewards are not part of this version.</li>
        </ul>
        <p><button class="link danger" data-action="reset">Reset my progress on this device</button></p>
      </details>
    </section>`;
}

function renderQuiz() {
  const total = questions.length;
  const picks = state.round.picks;
  const idx = feedback ? feedback.index : picks.length;
  const q = questions[idx];
  const shown = idx + (feedback ? 1 : 0);
  const pct = Math.round((shown / total) * 100);

  const options = q.options.map((o, i) => {
    let cls = 'option';
    let dis = '';
    if (feedback) {
      dis = 'disabled';
      if (o === q.answer) cls += ' correct';
      else if (o === feedback.picked) cls += ' wrong';
    }
    return `<button class="${cls}" data-action="answer" data-index="${i}" ${dis}>${esc(o)}</button>`;
  }).join('');

  let fb = '';
  if (feedback) {
    const ok = feedback.picked === q.answer;
    const headline = ok
      ? `✔ Correct! +${POINTS_PER_CORRECT} points`
      : `✘ Not quite. The answer is: ${esc(q.answer)}`;
    const isLast = idx + 1 >= total;
    fb = `<div class="feedback ${ok ? 'good' : 'bad'}" role="status"><strong>${headline}</strong><p>${esc(q.why)}</p></div>
      <div style="margin-top:14px"><button class="btn" data-action="next">${isLast ? 'See my result' : 'Next question'}</button></div>`;
  }

  app.innerHTML = `
    <div class="quiz-head">
      <span class="muted">Question ${idx + 1} of ${total}</span>
      <button class="link" data-action="home">Stop for now</button>
    </div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div style="width:${pct}%"></div></div>
    <section class="card">
      <p class="question">${esc(q.q)}</p>
      <div class="options">${options}</div>
      ${fb}
    </section>
    <p class="small muted">Your progress is saved. You can stop and come back today.</p>`;

  if (feedback) document.querySelector('.feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderResult() {
  const r = result;
  const headline = r.perfect ? 'Perfect! Amazing work.' : r.correct >= 3 ? 'Good work!' : 'Nice try. Practice again tomorrow.';
  const bonus = r.perfect ? `<li>Perfect round bonus: +${PERFECT_BONUS}</li>` : '';
  const levelUp = r.levelUp ? `<p><strong>🎉 Level up! You are now level ${r.level}: ${esc(r.levelName)}.</strong></p>` : '';
  const badges = r.newBadges.length
    ? `<h2>New badge${r.newBadges.length > 1 ? 's' : ''}!</h2><div class="badges stack">${r.newBadges.map((b) =>
        `<div class="badge new-badge"><div class="ico" aria-hidden="true">${b.icon}</div><strong>${esc(b.name)}</strong><span>${esc(b.desc)}</span></div>`).join('')}</div>`
    : '';

  app.innerHTML = `
    <section class="card stack">
      <h1>Round complete!</h1>
      <p>${headline}</p>
      <div class="result-big">${r.correct} / ${r.total}</div>
      <p>You got ${r.correct} right.</p>
      <ul>
        <li>${r.correct} × ${POINTS_PER_CORRECT} = ${r.correct * POINTS_PER_CORRECT} points</li>
        ${bonus}
      </ul>
      <p><strong>+${r.earned} points today</strong></p>
      <p>🔥 ${r.streak} day${r.streak === 1 ? '' : 's'} in a row</p>
      ${levelUp}
    </section>
    ${badges ? `<section class="card">${badges}</section>` : ''}
    <button class="btn" data-action="home">Back to home</button>`;
}

function render() {
  renderTop();
  if (view === 'quiz') renderQuiz();
  else if (view === 'result') renderResult();
  else renderHome();
  app.focus({ preventScroll: true });
}

function startRound() {
  state.round = { key: dateKey(), picks: [] };
  questions = pickDailyQuestions(QUESTIONS, state.round.key);
  feedback = null;
  view = 'quiz';
  saveState();
  render();
  window.scrollTo({ top: 0 });
}

function resumeRound() {
  const key = dateKey();
  if (!state.round || state.round.key !== key) return startRound();
  questions = pickDailyQuestions(QUESTIONS, key);
  feedback = null;
  view = 'quiz';
  render();
}

function answer(i) {
  if (feedback || view !== 'quiz') return;
  const q = questions[state.round.picks.length];
  const picked = q.options[i];
  state.round.picks.push(picked);
  saveState();
  feedback = { index: state.round.picks.length - 1, picked };
  render();
}

function next() {
  if (!feedback) return;
  if (state.round.picks.length >= questions.length) return finishRound();
  feedback = null;
  render();
  window.scrollTo({ top: 0 });
}

function finishRound() {
  const key = state.round.key;
  const picks = state.round.picks;
  const levelBefore = levelFor(state.points).index;
  const badgesBefore = earnedBadgeIds(state);
  const score = scoreRound(questions, picks);
  const applied = applyRound(state, key, score);
  state = applied.state;
  saveState();

  const after = levelFor(state.points);
  const newBadges = earnedBadgeIds(state)
    .filter((id) => !badgesBefore.includes(id))
    .map((id) => BADGES.find((b) => b.id === id));
  result = {
    ...score,
    earned: applied.earned,
    streak: currentStreak(state, key),
    levelUp: after.index > levelBefore,
    level: after.level,
    levelName: after.name,
    newBadges,
  };
  feedback = null;
  view = 'result';
  render();
  window.scrollTo({ top: 0 });
}

function goHome() {
  view = 'home';
  feedback = null;
  render();
  window.scrollTo({ top: 0 });
}

function reset() {
  if (!confirm('Reset all your progress on this device? This cannot be undone.')) return;
  state = emptyState();
  saveState();
  goHome();
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  switch (el.dataset.action) {
    case 'start': startRound(); break;
    case 'continue': resumeRound(); break;
    case 'answer': answer(Number(el.dataset.index)); break;
    case 'next': next(); break;
    case 'home': goHome(); break;
    case 'reset': reset(); break;
  }
});

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
