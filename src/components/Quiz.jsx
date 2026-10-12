import { useEffect, useRef } from 'react';
import { POINTS_PER_CORRECT } from '../lib/logic.js';

export default function Quiz({ questions, picks, feedback, onAnswer, onNext, onStop }) {
  const total = questions.length;
  const idx = feedback ? feedback.index : picks.length;
  const q = questions[idx];
  const shown = idx + (feedback ? 1 : 0);
  const pct = Math.round((shown / total) * 100);
  const feedbackRef = useRef(null);

  // Start each new question at the top of the page.
  useEffect(() => {
    if (!feedback) window.scrollTo({ top: 0 });
  }, [idx, feedback]);

  // After an answer, bring the explanation into view.
  useEffect(() => {
    if (feedback) feedbackRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [feedback]);

  const ok = feedback && feedback.picked === q.answer;
  const isLast = idx + 1 >= total;

  return (
    <>
      <div className="quiz-head">
        <span className="muted">Question {idx + 1} of {total}</span>
        <button className="link" onClick={onStop}>Stop for now</button>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div style={{ width: `${pct}%` }} />
      </div>

      <section className="card">
        <p className="question">{q.q}</p>
        <div className="options">
          {q.options.map((o, i) => {
            let cls = 'option';
            if (feedback) {
              if (o === q.answer) cls += ' correct';
              else if (o === feedback.picked) cls += ' wrong';
            }
            return (
              <button key={o} className={cls} disabled={!!feedback} onClick={() => onAnswer(i)}>
                {o}
              </button>
            );
          })}
        </div>

        {feedback && (
          <>
            <div ref={feedbackRef} className={`feedback ${ok ? 'good' : 'bad'}`} role="status">
              <strong>{ok ? `✔ Correct! +${POINTS_PER_CORRECT} points` : `✘ Not quite. The answer is: ${q.answer}`}</strong>
              <p>{q.why}</p>
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn" onClick={onNext}>{isLast ? 'See my result' : 'Next question'}</button>
            </div>
          </>
        )}
      </section>
      <p className="small muted">Your progress is saved. You can stop and come back today.</p>
    </>
  );
}
