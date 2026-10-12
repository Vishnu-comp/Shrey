import { currentStreak, dateKey } from '../lib/logic.js';

export default function TopBar({ state }) {
  const streak = currentStreak(state, dateKey());
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">W</span> Word Streak
      </div>
      <div className="topbar-stats" aria-live="polite">
        <span className="pill" aria-label={`${state.points} points`}>⭐ {state.points}</span>
        <span className="pill" aria-label={`${streak} day streak`}>🔥 {streak}</span>
      </div>
    </header>
  );
}
