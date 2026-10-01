# Submission — Autonomous Trailer Director

**OTT Dialect Platform · AI Engineering Hiring Challenge**

An agentic system that plans **three audience-specific trailer edit plans**
(Family / Young Adult / Dialect-region) from one episode package — and
**proves each plan is safe, truthful and rights-clean** before it ships.

The deliverable is a machine-readable **Edit Decision List (EDL)** per
trailer, exactly as a human editor could cut to it. Rendering is out of
scope by design (the brief allows it to be optional).

## Quickstart

```bash
pip install -e .          # from the repo root

# 1. full pipeline run (deterministic mock mode, no API keys, no network)
cd submission
python -m trailer_director run --episode sample_episode --out sample_run --mode mock

# 2. re-validate any EDL against the episode package
python -m trailer_director validate --edl sample_run/family_trailer.json --episode sample_episode

# 3. apply a surprise event / contract change to a finished run
python -m trailer_director change --run-dir sample_run --episode sample_episode \
    --change changes_specs/music-expiry-01.json

# 4. cost ledger summary
python -m trailer_director cost --run-dir sample_run

# tests (30, all deterministic)
cd .. && python -m pytest
```

`sample_run/` in this repository is a **real generated artifact** of the
commands above (plus two replayed surprise events) — regenerate it any time
and diff against git to confirm determinism.

## What the system does

```
episode package ──► INGEST ──► SceneCatalog (ground truth: scenes, timecodes,
                               actors, music, contracts, policies)
              ├──► STORY MAP      characters, events, emotional turns,
              │                   PROTECTED FACTS (spoiler map), sensitive content
              ├──► CONSTRAINT MAP policies + contracts → executable rules
              │
              ▼  for each of 3 audiences
        PROMISE ──► BEATS ──► RETRIEVE ──► SELECT ──► VALIDATE ──► REPAIR/REJECT
        (creative   (arc)     (ranked     (timecodes  (8 checks    (surgical
         brief,     mini-story)  candidates,   inside real  against     swap of only
         stated     hook→turn    rights-        scene        catalog    failing
         BEFORE     →title)      pre-vetted     bounds)      ground     segments;
         clips)                                   truth)      honest rejection)
              │
              ▼
        CHANGE HANDLER  surprise events → evidence graph → affected decisions
                        only → re-validate → decision-log record
```

## Repository layout

| Path | Contents |
|---|---|
| `src/trailer_director/` | The agent (see below) |
| `sample_episode/` | Synthetic 14-min episode: 25 scenes with stable timecodes, English dialogue + Hindi/Kannada subtitle tracks, rating policies, contracts, audience profiles, historic metrics, cost sheet — **seeded with traps** (top-CTR scene is a spoiler; a music contract that will expire; a stills-only actor; a bias in the audience data) |
| `tests/` | Required tests (missing scene, rights, spoiler, policy, contract change) + all surprise events + budget |
| `sample_run/` | Generated artifacts: 3 EDLs (v1), 2 revised EDLs (v2) after replayed surprise events, story map, constraint map, validation report, decision logs |
| `changes_specs/` | The two surprise-event specs used in `sample_run/changes/` |
| `ARCHITECTURE.md` | Planning, memory, multimodal grounding, verification, failure recovery |
| `AI_COLLABORATION.md` | How AI tools were directed, challenged and checked |
| `KNOWN_LIMITATIONS.md` | Limitations + decisions that must stay with humans |

## Module map

```
src/trailer_director/
├── cli.py                     run | validate | change | cost
├── run.py                     pipeline orchestration + artifact writing
├── session.py                 shared state, costed model-call gateway, budget cap
├── config.py                  run config (mode, audiences, repair rounds, duration tol)
├── models.py                  pydantic schemas: package inputs + all agent artifacts
├── timecodes.py               MM:SS.mmm ↔ seconds (clamped, validated at ingest)
├── ingest/catalog.py          episode package → validated SceneCatalog (ground truth)
├── story/…                    story map builder (protected facts = spoiler map)
├── constraints/compiler.py    policies + contracts → executable Rule objects
├── planner/
│   ├── promise.py             audience promise + arc beats (stated before clip selection)
│   ├── edl_builder.py         retrieve → select → EDL assembly → duration fit → fallback
├── validator/
│   ├── checks.py              8 independent checks (the non-negotiables)
│   └── report.py              validation_report.md
├── repair/loop.py             surgical replacement; honest rejection; never force-through
├── change/impact.py           8 surprise-event handlers; evidence-graph impact analysis
├── agents/
│   ├── llm.py                 ModelClient interface (the only model touchpoint)
│   ├── mock.py                deterministic mock director (replay mode, no keys)
│   └── live.py                optional real-backend stub (refuses without explicit key)
└── observability/decision_log.py   append-only JSONL decision log + cost ledger
```

## The three sample trailers (v1)

| Trailer | Promise (abridged) | Arc | Music | Status |
|---|---|---|---|---|
| `family_v1` (84s) | "A family returns to the house their mother loved — and learns what love really cost." | house in rain → dinner table → the argument → sealed room → mother's kitchen → the gathering → dawn | Monsoon Strings (all-audience clearance) | PASS |
| `young_adult_v1` (68s) | "Two siblings, one house, and everyone who never left it — the arguments are the fun part." | car banter → the dues → Ravi's return → sealed room → hidden ledger → the kitchen → dawn | Distant Drums (legal sign-off: license lapses 2026-10-15) | PASS |
| `dialect_region_v1` (45s) | "A tense family story told in a familiar voice — the house, the feasts, and the words home is made of." | welcome at the gate (Kannada) → the veranda line → the feast → the gathering → the question → dawn | Village Fest (regional clearance) | PASS_WITH_WARNINGS (biased `comedy=0.9` preference questioned and logged, not used) |

**Replayed surprise events in `sample_run/changes/`:**

1. `music-expiry-01` — contract `music-02` lapses → **only** the YA trailer is
   revised (music_02 → music_01, all cut points identical, re-validated).
2. `lakshmi-no-use-01` — actor c3 tightens to no promotional use → family
   segments 2 & 6 and dialect segment 4 are replaced with ranked alternatives;
   every other segment keeps its exact timecodes.

## Evaluation notes

- **Deterministic**: same input → byte-identical plans (fixed clock, no randomness).
- **No keys required**: everything runs in mock/replay mode.
- **Verification is independent**: the validator re-runs every check against
  the catalog and does not trust the planner's reasons — it *checks* them.
- **Nothing is forced through**: a plan that can't be made safe is REJECTED
  with a written explanation.
- **Every decision is logged**: `decision_log.jsonl` records each model call
  (with cost), each rejection, each repair (with `revision_of`), each change.
