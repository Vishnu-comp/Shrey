Ref: KL-7Q4

# Word Streak

A 5-question English quiz you can finish in about 2 minutes. Come back every day to keep your streak, earn points, level up and unlock badges.

- **No build step, no dependencies.** Plain HTML, CSS and JavaScript.
- **Works on modest Android phones and slow mobile data.** Under 60 KB total, no external fonts or images.
- **Works offline** after the first visit (service worker).
- **Installable** on the home screen (web app manifest).

See [EXPLAINER.md](EXPLAINER.md) for the product choices, what was left out, and where AI tools were used.

## Requirements

- **Node.js 18 or newer** (for the local server and tests). Check with `node -v`.
- A modern browser. Chrome, Edge, Firefox or Safari.

No `npm install` is needed. The project has no runtime packages.

## Run it locally

```bash
git clone https://github.com/Vishnu-comp/Shrey.git
cd Shrey
git checkout arena/cfb64826-shrey   # the branch with the app
npm start
```

Then open **http://localhost:8080**.

To test on a phone on the same Wi-Fi, open `http://<your-computer-ip>:8080` on the phone. Find your computer's IP with `ipconfig` (Windows) or `ifconfig` / `ip addr` (macOS and Linux).

You can also use any static server, for example `python3 -m http.server 8080` from the project folder.

## Run the tests

```bash
npm test
```

The tests cover the game rules: the daily question picks, scoring, levels, streaks, badges, and the rule that a second round on the same day earns nothing.

## Project structure

```
index.html              App shell and page metadata
css/style.css           All styles (mobile first)
js/app.js               UI: screens, buttons, rendering, saving progress
js/logic.js             Game rules as pure functions (no DOM, easy to test)
js/questions.js         The question bank (add questions here)
sw.js                   Service worker for offline use (network first)
manifest.webmanifest    "Add to home screen" settings
icons/icon.svg          App icon
tests/logic.test.js     Unit tests for the game rules
scripts/serve.mjs       Zero-dependency local server
EXPLAINER.md            What was built, why, and what was left out
```

## How to change things

- **Add questions:** add an object to `QUESTIONS` in `js/questions.js`. Give it a unique `id`, a `q` (question), `options` (4 choices), `answer` (must match one option exactly) and `why` (a one-line explanation). Keep the English simple.
- **Change points or levels:** edit the constants at the top of `js/logic.js` (`POINTS_PER_CORRECT`, `PERFECT_BONUS`, `LEVELS`) and `BADGES`.
- **Storage:** progress is saved in the browser's `localStorage` under the key `word-streak-v1`. The **Reset my progress** button in "How points work" clears it.

## Deploying

The app is static files, so any free static host works, for example GitHub Pages, Netlify or Cloudflare Pages. Publish the project root with no build command. The service worker and manifest use relative paths, so the app also works from a subfolder URL.

## Notes

- Daily questions are the same for everyone on the same calendar day. The day follows the device's local time.
- Progress lives on the device only. Clearing browser data resets it.
- When you change files, a normal reload is enough, because the service worker fetches the network first.
