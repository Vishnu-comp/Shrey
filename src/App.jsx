import { useEffect, useMemo, useRef, useState } from 'react';
import { QUESTIONS } from './lib/questions.js';
import {
  BADGES, dateKey, pickDailyQuestions, scoreRound, levelFor, currentStreak, applyRound, earnedBadgeIds, emptyState,
} from './lib/logic.js';
import { useProgress } from './hooks/useProgress.js';
import TopBar from './components/TopBar.jsx';
import Home from './components/Home.jsx';
import Quiz from './components/Quiz.jsx';
import Result from './components/Result.jsx';

export default function App() {
  const [state, setState] = useProgress();
  const [view, setView] = useState('home'); // 'home' | 'quiz' | 'result'
  const [feedback, setFeedback] = useState(null); // { index, picked } while one answer is shown
  const [result, setResult] = useState(null); // summary of the last finished round
  const mainRef = useRef(null);

  const today = dateKey();
  const questions = useMemo(
    () => (state.round ? pickDailyQuestions(QUESTIONS, state.round.key) : []),
    [state.round?.key]
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [view]);

  function startRound() {
    setState((s) => ({ ...s, round: { key: today, picks: [] } }));
    setFeedback(null);
    setView('quiz');
  }

  function continueRound() {
    if (!state.round || state.round.key !== today) return startRound();
    setFeedback(null);
    setView('quiz');
  }

  function answer(i) {
    if (feedback || !state.round) return;
    const picks = state.round.picks;
    const picked = questions[picks.length].options[i];
    setState((s) => ({ ...s, round: { ...s.round, picks: [...s.round.picks, picked] } }));
    setFeedback({ index: picks.length, picked });
  }

  function next() {
    if (!feedback) return;
    if (state.round.picks.length >= questions.length) return finishRound();
    setFeedback(null);
  }

  function finishRound() {
    const { key, picks } = state.round;
    const score = scoreRound(questions, picks);
    const levelBefore = levelFor(state.points).index;
    const badgesBefore = earnedBadgeIds(state);
    const applied = applyRound(state, key, score);
    const after = levelFor(applied.state.points);
    const newBadges = earnedBadgeIds(applied.state)
      .filter((id) => !badgesBefore.includes(id))
      .map((id) => BADGES.find((b) => b.id === id));
    setState(applied.state);
    setResult({
      ...score,
      earned: applied.earned,
      streak: currentStreak(applied.state, key),
      levelUp: after.index > levelBefore,
      level: after.level,
      levelName: after.name,
      newBadges,
    });
    setFeedback(null);
    setView('result');
  }

  function goHome() {
    setFeedback(null);
    setView('home');
  }

  function reset() {
    if (!confirm('Reset all your progress on this device? This cannot be undone.')) return;
    setState(emptyState());
    setResult(null);
    goHome();
  }

  const showQuiz = view === 'quiz' && state.round;
  const showResult = view === 'result' && result;

  return (
    <>
      <TopBar state={state} showProgress={!showQuiz && !showResult} />
      <main ref={mainRef} className="wrap" tabIndex={-1}>
        {showQuiz ? (
          <Quiz
            questions={questions}
            picks={state.round.picks}
            feedback={feedback}
            onAnswer={answer}
            onNext={next}
            onStop={goHome}
          />
        ) : showResult ? (
          <Result result={result} onHome={goHome} />
        ) : (
          <Home state={state} today={today} onStart={startRound} onContinue={continueRound} onReset={reset} />
        )}
      </main>
      <footer className="footer">Practice English a little every day. Works offline after the first visit.</footer>
    </>
  );
    }
