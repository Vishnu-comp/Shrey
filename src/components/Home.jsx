import { BADGES, QUESTIONS_PER_DAY, POINTS_PER_CORRECT, PERFECT_BONUS, levelFor, currentStreak, isDoneToday } from '../lib/logic.js';
import WeekStrip from './WeekStrip.jsx';

export default function Home({ state, today, onStart, onContinue, onReset }) {
  const done = isDoneToday(state, today);
  const streak = currentStreak(state, today);
  const lv = levelFor(state.points);
  const openPicks = state.round && state.round.key === today ? state.round.picks.length : 0;
  const pct = lv.next ? Math.round(((state.points - lv.min) / (lv.next.min - lv.min)) * 100) : 100;
  const toNext = lv.next ? lv.next.min - state.points : 0;
  const last = state.history[state.history.length - 1];

  let action;
  if (done) {
    action = (
      <>
        <p><strong>✅ Done for today!</strong></p>
        <p>You got {last.correct} of {last.total} right. A new challenge starts tomorrow.</p>
      </>
    );
  } else if (openPicks > 0) {
    action = (
      <>
        <p>You are on question {openPicks + 1} of {QUESTIONS_PER_DAY}.</p>
        <button className="btn" onClick={onContinue}>Continue today's challenge</button>
      </>
    );
  } else {
    action = <button className="btn" onClick={onStart}>Start today's {QUESTIONS_PER_DAY} questions</button>;
  }

  return (
    <>
      <section className="card hero">
        <h1>Today's challenge</h1>
        <p className="muted">{QUESTIONS_PER_DAY} short questions. About 2 minutes.</p>
        {action}
      </section>

      <section className="grid-3" aria-label="Your stats">
        <div className="stat"><strong>{state.points}</strong><span>Points</span></div>
        <div className="stat"><strong>{streak}</strong><span>Day streak</span></div>
        <div className="stat"><strong>{state.correct}</strong><span>Right answers</span></div>
      </section>

      <section className="card">
        <h2>Level {lv.level}: {lv.name}</h2>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress to next level">
          <div style={{ width: `${pct}%` }} />
        </div>
        <p className="small muted">{lv.next ? `${toNext} points to ${lv.next.name}` : 'You reached the top level!'}</p>
      </section>

      <section className="card">
        <h2>Last 7 days</h2>
        <p className="small muted">★ = all right. Numbers = right answers. – = not played.</p>
        <WeekStrip history={state.history} today={today} />
      </section>

      <section className="card">
        <h2>Badges</h2>
        <div className="badges">
          {BADGES.map((b) => {
            const got = b.earned(state);
            return (
              <div key={b.id} className={`badge ${got ? '' : 'locked'}`}>
                <div className="ico" aria-hidden="true">{b.icon}</div>
                <strong>{b.name}</strong>
                <span>{b.desc}{got ? ' ✓' : ''}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <details>
          <summary>How points work</summary>
          <ul>
            <li>You get {POINTS_PER_CORRECT} points for each right answer.</li>
            <li>A perfect round ({QUESTIONS_PER_DAY} of {QUESTIONS_PER_DAY} right) gives a +{PERFECT_BONUS} bonus.</li>
            <li>You can play one round per day. Playing again the same day earns nothing more.</li>
            <li>Finish a round every day to keep your streak. If you miss a day, the streak starts again at 1.</li>
            <li>Your level goes up as your points go up.</li>
            <li className="muted">Points show your progress in this app. Cash or other rewards are not part of this version.</li>
          </ul>
          <p><button className="link danger" onClick={onReset}>Reset my progress on this device</button></p>
        </details>
      </section>
    </>
  );
}
