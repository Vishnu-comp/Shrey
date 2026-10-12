import { dayNumber, keyFromDayNumber } from '../lib/logic.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekStrip({ history, today }) {
  const n = dayNumber(today);
  const cells = [6, 5, 4, 3, 2, 1, 0].map((back) => {
    const dayKey = keyFromDayNumber(n - back);
    const h = history.find((x) => x.key === dayKey);
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
    return (
      <div key={dayKey}>
        <div className="day">{name}</div>
        <div className={`dot ${cls}${back === 0 ? ' today' : ''}`} aria-label={`${name}: ${label}`}>
          {mark}
        </div>
      </div>
    );
  });
  return <div className="week">{cells}</div>;
}
