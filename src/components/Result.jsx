import Icon, { badgeIcons } from './Icon.jsx';
import { BADGES } from '../lib/logic.js';
import { PERFECT_BONUS, POINTS_PER_CORRECT } from '../lib/logic.js';

export default function Result({ result: r, onHome }) {
  const headline = r.perfect ? 'Perfect! Amazing work.' : r.correct >= 3 ? 'Good work!' : 'Nice try. Practice again tomorrow.';
  return (
    <>
      <section className="card stack">
        <h1>Round complete!</h1>
        <p>{headline}</p>
        <div className="result-big">{r.correct} / {r.total}</div>
        <p>You got {r.correct} right.</p>
        <ul>
          <li>{r.correct} × {POINTS_PER_CORRECT} = {r.correct * POINTS_PER_CORRECT} points</li>
          {r.perfect && <li>Perfect round bonus: +{PERFECT_BONUS}</li>}
        </ul>
        <p><strong>+{r.earned} points today</strong></p>
        <p className="streak-line"><Icon name="flame" /> {r.streak} day{r.streak === 1 ? '' : 's'} in a row</p>
        {r.levelUp && <p><strong>Level up! You are now level {r.level}: {r.levelName}.</strong></p>}
      </section>

      {r.newBadges.length > 0 && (
        <section className="card">
          <h2>New badge{r.newBadges.length > 1 ? 's' : ''}!</h2>
          <div className="badges stack">
            {r.newBadges.map((b) => (
              <div key={b.id} className="badge new-badge">
                <div className="ico" aria-hidden="true"><Icon name={badgeIcons[BADGES.findIndex(badge => badge.id === b.id)]} /></div>
                <strong>{b.name}</strong>
                <span>{b.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className="btn" onClick={onHome}>Back to home</button>
    </>
  );
}
