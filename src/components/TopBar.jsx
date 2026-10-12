import Icon from './Icon.jsx';
import { currentStreak, dateKey } from '../lib/logic.js';

export default function TopBar({ state, showProgress }) {
  const streak = currentStreak(state, dateKey());
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">W</span> Word Streak
      </div>
      {showProgress && <a className="header-link" href="#your-progress">Your progress</a>}
      <div className="topbar-stats" aria-live="polite">
        <span className="pill" aria-label={`${state.points} points`}><Icon name="star" /> {state.points}</span>
        <span className="pill" aria-label={`${streak} day streak`}><Icon name="flame" /> {streak}</span>
      </div>
    </header>
  );
}
