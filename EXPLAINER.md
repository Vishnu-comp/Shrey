# Word Streak: explainer

## What I built

**Word Streak** is a small web app. Each day you get the same 5 short English questions. They mix vocabulary, grammar and everyday general knowledge. You get 10 points for each right answer and a 20-point bonus for a perfect round. Finishing a round every day builds a streak. Points raise your level, and you unlock badges.

The app is built to be used every day. A round takes about 2 minutes. A "Last 7 days" strip shows your habit at a glance. Your streak and daily round are the main reasons to come back.

The setup and running instructions are in [README.md](README.md).

## Why this idea

- **The audience reads English as a second language.** The app teaches English while it rewards them. Every explanation is short, plain English, and it shows the reason for the answer. Learning counts as part of the reward.
- **The players are on modest phones and mobile data.** The app is built with React 18 and Vite. The production build is about 56 KB gzipped in total, uses no external fonts or images, and works offline after the first visit. Buttons are at least 52 px tall, and the text is 18 px or larger. React is a bigger download than the plain-JavaScript version I started with (about 11 KB gzipped), but it makes the screens and state easier to build, test and extend, which matters for a product that will keep growing.
- **The rewards are worth real money to them.** That is the main reason I was careful with the reward design (see below).

## The rewards and why they work this way

| Mechanic | What it does |
|---|---|
| Daily challenge | One round a day. The same questions for everyone on that day, so people can compare. |
| Points | 10 per right answer. A perfect round adds 20. |
| Streak | Counts consecutive days. A missed day resets it. The best streak is kept. |
| Levels | Starter → Learner → Reader → Explorer → Scholar → Expert → Master. |
| Badges | First Step, On Fire (3-day streak), Week Warrior (7-day), Perfect Round, 50 Right, Reader (level 3). |
| Week strip | Shows the last 7 days, so the habit is visible. |

Design choices:

- **Rewards are based only on skill and consistency.** Points come from correct answers and from playing each day. Nothing is random, and nothing is paid for by ads or purchases.
- **One round per day is counted.** Replaying the same day earns nothing, so the streak cannot be farmed.
- **Everything is shown plainly.** "How points work" explains every rule in one short list, so players are never surprised.
- **Points are not presented as money.** The app says clearly that points show progress and that cash rewards are not part of this version. I did not want to suggest a money promise the app cannot keep.

## What I left out, and why

- **A leaderboard.** It needs a server, accounts and a way to stop cheating. A leaderboard with fake or local-only data would be dishonest, so I left it out.
- **Real-money redemption.** Paying out money needs accounts, server-side checks of every answer and streak, fraud protection, clear terms and KYC where required. Client-side points would be easy to fake. This is the most important next step if the product is to pay people, and it should come with a server.
- **Sign-in and cloud sync.** Progress stays on the device for now. Clearing the browser's data resets it. Sync is the next thing I would add.
- **Sound, animation and haptics.** They add weight and battery use on cheap phones. Motion is also turned off for users who prefer reduced motion.
- **Languages other than English.** The question bank is in English only. Adding translations is simple, but I wanted to keep the first version small and check the mechanics first.
- **A large question bank.** There are 42 questions, which covers about 8 days before repeating. A real product would need hundreds and a way to add new ones.

## Trade-offs and honest limits

- **Answers ship in the client.** A determined user can read the answers in the JavaScript. That is fine for a practice quiz, but not for paid rewards. It is the reason for the server point above.
- **Storage is per browser.** Using a different browser or device starts from zero.
- **Daily timing uses the device clock.** Someone can change their clock to play twice. This matters only if rewards are paid, and the fix is server-side dates.
- **Offline cache.** The service worker serves the newest files when online and falls back to the cache when offline. It does not handle every edge case of updating a cached app, and the stored progress format is versioned by its key (`word-streak-v1`).

## How I tested it

- **Unit tests** (`npm test`, 11 tests) cover question data, the same-day daily picks, scoring, levels, streak logic (including missed days and double-playing), badges and history.
- **A headless DOM run of the React app** (jsdom, outside the repo) went through the full flow: resume a half-finished round, answer, see the locked options and feedback, the result screen, the level-up, the badge unlock, and back to home with the saved progress.
- **Production build:** `npm run build` succeeds with no errors.
- **Not tested:** I could not run a real browser or a real Android phone in my environment, so I have not checked the layout visually or measured the speed on a real device. Please open it on a phone first, which is also how the team said they will review it.

## Where I used AI tools

I used an AI coding assistant (Arena.ai Agent Mode) to help write the code, first in plain JavaScript and then moved to React, the question bank and the documentation. I reviewed the design choices, checked the rules against the brief, ran the tests and the headless run, and edited the output. The product decisions (the idea, the reward rules, and what to leave out) are mine.

## Next steps, if this were a product

1. A small server with accounts, so points and streaks are checked on the server.
2. Real redemption rules, with clear terms and payouts only after server checks.
3. Hundreds of questions, with translations into the users' languages.
4. Sync across devices, and a weekly leaderboard among friends (with server-side checks).
5. Real-device testing on low-end Android phones and slow networks.
