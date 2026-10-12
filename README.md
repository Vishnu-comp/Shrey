Ref: KL-7Q4

# Word Streak

A 5-question English quiz you can finish in about 2 minutes. Come back every day to keep your streak, earn points, level up and unlock badges.

- **Built with React 18 and Vite.**
- **Light for phones:** about 56 KB gzipped in total, no external fonts or images.
- **Works offline** after the first visit (service worker, production build).
- **Installable** on the home screen (web app manifest).

See [EXPLAINER.md](EXPLAINER.md) for the product choices, what was left out, and where AI tools were used.

## Requirements

- **Node.js 18 or newer** (Node 22 is what I tested with). Check with `node -v`.
- A modern browser: Chrome, Edge, Firefox or Safari.

## Run it locally

```bash
git clone https://github.com/Vishnu-comp/Shrey.git
cd Shrey
git checkout arena/cfb64826-shrey   # the branch with the app
npm install
npm run dev
```

Then open **http://localhost:5173**. The dev server reloads the page when you save a file.

To test on a phone on the same Wi-Fi, open `http://<your-computer-ip>:5173` on the phone. Find your computer's IP with `ipconfig` (Windows) or `ifconfig` / `ip addr` (macOS and Linux).

## Other commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload (port 5173). |
| `npm run build` | Production build into `dist/`. |
| `npm start` | Builds, then serves the production build on port 8080. Use this to check offline mode. |
| `npm test` | Runs the unit tests for the game rules. |

## Project structure

```
index.html                  Page shell (loads src/main.jsx)
vite.config.js              Vite settings (relative base path, dev server on 0.0.0.0)
public/
  sw.js                     Service worker for offline use (network first)
  manifest.webmanifest      "Add to home screen" settings
  icons/icon.svg            App icon
src/
  main.jsx                  React entry point, registers the service worker
  App.jsx                   Top-level state: screens, answering, finishing a round
  styles.css                All styles (mobile first)
  components/
    TopBar.jsx              Points and streak in the header
    Home.jsx                Start/continue button, stats, level, badges, rules
    WeekStrip.jsx           Last 7 days
    Quiz.jsx                One question at a time, with feedback
    Result.jsx              Round summary, level-up and new badges
  hooks/useProgress.js      Loads and saves progress in localStorage
  lib/
    logic.js                Game rules as pure functions (no React, easy to test)
    questions.js            The question bank (add questions here)
tests/logic.test.js         Unit tests for the game rules
```

## How to change things

- **Add questions:** add an object to `QUESTIONS` in `src/lib/questions.js`. Give it a unique `id`, a `q` (question), `options` (4 choices), `answer` (must match one option exactly) and `why` (a one-line explanation). Keep the English simple.
- **Change points or levels:** edit the constants at the top of `src/lib/logic.js` (`POINTS_PER_CORRECT`, `PERFECT_BONUS`, `LEVELS`) and `BADGES`.
- **Storage:** progress is saved in the browser's `localStorage` under the key `word-streak-v1`. The **Reset my progress** button in "How points work" clears it.

## Deploying

Run `npm run build` and publish the `dist/` folder to any static host, for example GitHub Pages, Netlify or Cloudflare Pages. The build uses relative paths, so it works from a subfolder URL too.

## Notes

- Daily questions are the same for everyone on the same calendar day. The day follows the device's local time.
- Progress lives on the device only. Clearing browser data resets it.
- The service worker uses network first. After you deploy an update, a reload picks it up when online.
