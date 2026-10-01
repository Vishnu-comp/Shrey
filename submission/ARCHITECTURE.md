# Architecture Note

How the Autonomous Trailer Director is built: planning, memory, multimodal
grounding, verification, and failure recovery.

## 1. Design principle

> **Creative generation proposes. Independent verification disposes.**

The system is split into roles that do not share state they shouldn't:

- **Catalog** — the episode package, validated once at ingest. It is the
  *ground truth*. Anything that doesn't resolve against it fails by
  construction (scene ids, timecode ranges, evidence refs).
- **Creative planner** — states the audience promise, picks beats, ranks
  candidates, builds the EDL. It *proposes*.
- **Validator** — a separate module that re-runs all eight checks against the
  *final* EDL and the catalog. It never receives the planner's confidence,
  and it treats the planner's `reason` text as a *claim to be checked* (story
  truth), not as authority.
- **Repair** — surgical: only segments named by a failing check are
  revisited, using the ranked candidate list already computed for that beat.
  If no safe alternative exists, the trailer is **REJECTED with a written
  explanation**. The system never silences a failing check.
- **Change handler** — surprise events mutate catalog state, then the
  evidence graph identifies *exactly* which decisions are affected; only
  those are re-validated and (if needed) repaired.

## 2. Planning

**Pass 1 — Story map** (one model call): characters, relationships, major
events, emotional turns, *protected facts* (the spoiler map), sensitive
content. Protected facts come from the platform's own spoiler list in the
package, not from guesswork — each carries a `teaser` level per audience
(0 = no hint, 1 = subtle mystery framing only, 2 = explicit allowed) and the
identity of its reveal scene, which is never usable in any trailer.

**Pass 2 — Audience promise** (one model call per audience): objective,
central promise, positioning, and the arc beats (`hook → … → title`) with
target durations. The promise is stated **before any clip is selected**
(brief step 3), and later *checked* against the cut it describes.

**Pass 3 — Candidate retrieval** (one model call per beat): every catalog
scene is fit-scored for the beat. Score = mood overlap (dominant term) +
dialect-line presence for dialect beats + narrative-opening bonus for hook
beats + emotional-turn bonus + story weight. Historic CTR enters at
**weight 0.1 as a documented tie-breaker hypothesis only** — the brief
explicitly forbids engagement-driven selection, and the decision log records
every `history_hypothesis` contribution. Rights and spoiler constraints are
*not* applied here (that's the validator's job) — the creative layer may
propose; the check layer disposes. The top 8 candidates are cached per beat
for repair.

**Pass 4 — Selection** (one model call per chosen segment): a timecode
window **inside the scene's real bounds** (clamped — a phantom timecode is
impossible), anchored on the best quotable line (grief/tender beats anchor
on the emotional landing line; dialect beats anchor on an authentic dialect
line). Dialogue lines from rights-restricted characters (e.g. a
stills-only actor's voice) are excluded from the window's dialogue and
subtitles.

**Assembly**: transitions (dissolve on emotional turns), text cards,
voice-over, per-audience music choice from the *contracted* track list,
duration fitting (trim/extend windows within bounds, ±10% of target),
per-segment `reason` + resolvable `evidence` ids (`scene:07`,
`contract:music-03`, `dialogue:scene_12:0`), risk flags, human-approval
items, and a **lower-cost fallback plan** (cached top-1 candidates, no
re-ranking, no VO) that the budget can fall back to.

## 3. Memory

- **Working memory** — `PlanSession`: catalog, story map, compiled rules,
  model client, cost ledger. Plans never read each other's state.
- **Per-plan working state** — `PlanDraft`: chosen segments, cached ranked
  candidates per beat, used-scene set, notes. Repair operates on this, so a
  revision never re-plans from scratch.
- **Long-term memory (persisted)** — `decision_log.jsonl`, append-only:
  every model call (task, model, cost, refs), every vet rejection, every
  repair (`revision_of` links the new decision to the one it supersedes),
  every state mutation and rejection. Revisions never rewrite history.
- **Compiled constraints as memory** — policies and contracts are compiled
  to `CompiledRule` objects with a resolvable `source` evidence id. A change
  replaces/invalidates rule objects; impact analysis then finds every
  segment citing that source.

## 4. Multimodal processing

The episode package is a structured multimodal bundle: video scenes with
stable timecodes, source dialogue + two dialect subtitle tracks, scene
descriptions (human + AI), music metadata, and business documents.

- **Grounding is structural, not prompt-based.** Every EDL reference
  (scene id, timecode, dialogue line, evidence id) is checked against the
  catalog by the `source_accuracy` check. A model recommending
  `scene_26` — a scene that doesn't exist — cannot enter a plan: the
  builder refuses it, and the change handler *replays* that exact scenario
  and logs the rejection.
- **Scene descriptions are data, never instructions.** The brief's
  "description contains an instruction to ignore a contract" trap is
  handled by construction: description text is only ever read as evidence
  and is never parsed for directives; the injection change event
  demonstrates this (the constraint stays in force, the event is logged).
- **Mock grounding strategy (replay mode).** In mock mode, "model" passes
  are deterministic policy functions over the structured metadata
  (moods, flags, dialect lines, protected facts). This is deliberate: the
  assignment requires a replay mode that works without the evaluator's API
  keys, and determinism makes every decision reproducible and testable.
  The `ModelClient` interface (prompt contract, cost, logging) is identical
  to live mode, so a real LLM/vision backend can be swapped in behind
  `mode=live` without touching planning or verification code
  (`agents/live.py` is a stub that refuses to run without an explicit key).
- **Dialect handling** is content-based: dialect lines are real lines from
  the supplied subtitle tracks (with official translations), dialect beats
  *require* an authentic dialect line (scoring penalty otherwise), and the
  cultural check blocks serious dialect lines framed as comedy.

## 5. Verification

Eight independent checks per plan (the brief's non-negotiables):

| Check | What it enforces |
|---|---|
| `source_accuracy` | every scene id exists; every timecode inside real scene bounds; every dialogue line tc in-scene; every evidence id resolves |
| `spoiler` | reveal scenes never used; post-reveal content blocked per teaser level; protected-fact keywords beyond teaser level blocked |
| `rights` | music tracks contracted, unexpired, audience- and territory-correct; actor usage terms (full / dialogue_and_video / background_only / stills_only / none) enforced on video **and** voice |
| `rating` | audience age/regional policies as compiled field rules (frightening, strong language, twist, grief, death_reference…) |
| `story_truth` | segment reasons' claims must be supported by the scene's moods; title cards & promise checked against a hard-claim vocabulary (murder/romance/crime/…) requiring actual scene content; **every spoken line scanned for relationship claims unsupported by the story map** (catches the dialect-shift trap); post-reveal implied events flagged as misleading intensity |
| `cultural` | dialect trailers must carry ≥2 authentic dialect-line segments; no stereotype markers in creative surfaces; serious dialect lines never comedy-framed; inherited-correlation bias (comedy=0.9) logged as questioned |
| `accessibility` | dialogue ⇒ subtitles; text cards ≥3s readable; voice-over ⇒ on-screen text |
| `budget` | model calls and total cost within the configured caps |

Status: `PASS` / `PASS_WITH_WARNINGS` / `FAIL` → repair → `PASS…` or
`REJECTED`. Warnings are always surfaced in `validation_report.md`.

## 6. Failure recovery

- **Repair loop** (max 3 rounds): failing segments are replaced by the next
  ranked candidate for their beat that passes the fast pre-vet; if none, the
  segment is dropped; if the trailer falls below 4 story beats, or the
  creative promise itself is unsupported by any safe cut, the trailer is
  REJECTED with the reason in the artifact and the log.
- **Change handler** (`change` command / `change/impact.py`) supports the
  brief's surprise events: `contract_expired`, `actor_terms_changed`,
  `audience_bias`, `phantom_recommendation`, `clickbait_request`,
  `dialect_shift`, `injection`, `model_unavailable`. Each: (a) model review
  (corroborating), (b) state mutation, (c) evidence-graph impact analysis
  (segments citing the changed contract/actor/line), (d) selective
  re-validation + repair, (e) version bump (`v1 → v2`) and decision-log
  entries. Untouched trailers keep byte-identical cut points.
- **Degradation**: preferred-model unavailability degrades to text-only
  grounding (plans re-validated, limitation recorded in assumptions);
  budget exhaustion stops planning gracefully and REJECTS with an
  explanation instead of crashing.

## 7. Budget & cost control

- Every model call goes through `session.model_call` → costed from the
  cost sheet, logged, counted against caps (`max_model_calls`,
  `max_total_usd`).
- Per-trailer `cost_estimate` in each EDL (calls, task cost, media share,
  total, `within_budget`), plus the cheaper `fallback_plan`.
- The budget check is one of the eight validators; the decision log is the
  audit trail (`cost` command summarizes it).

## 8. Reproducibility

Mock mode is fully deterministic: fixed clock, no randomness, stable
sorting. `python -m trailer_director run …` twice produces byte-identical
EDLs (verify with `git diff` on `sample_run/`). Tests run the same pipeline
in temp dirs and assert on the decisions, not on the clock.
