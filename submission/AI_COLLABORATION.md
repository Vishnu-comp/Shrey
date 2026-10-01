# AI Collaboration Note

How AI tools (Claude-style assistants) were used to build this system — how
work was delegated, how the output was challenged, and what was caught
because it was checked rather than trusted.

## How the work was divided

**Human (candidate) owned:**
- The interpretation of the brief and the architecture decisions that map to
  the grading criteria: independent validator, structural grounding over the
  catalog, teaser-level spoiler model, engagement-as-tie-breaker-only,
  deterministic mock model, surgical (not full-replan) change handling.
- The creative strategy tables (the three audience promises, arcs and
  beat intentions) and the sample-episode story (characters, scenes,
  protected facts, seeded traps).
- Final judgment on every artifact: I read all three generated trailers as a
  human, hand-checked timecodes against `scenes.json`, and reviewed the
  decision log line by line before committing `sample_run/`.

**AI assistant delegated:**
- Boilerplate and plumbing (pydantic schemas, CLI, file I/O, report
  rendering), test scaffolding, and first drafts of each pipeline module
  given the module contract (inputs, outputs, invariants).
- Working through bug hunts *after* I reproduced the failure locally and
  stated the expected behavior — not at the start of a feature.
- Drafting this documentation set (challenged for vagueness; every claim in
  the docs was verified against the code before keeping it).

**Ground rules enforced on the assistant:**
1. Plan first, code second — each module got a 10-line contract (what it
   takes, what it returns, what it must never do) before any implementation.
2. Verification beats generation — any safety-relevant behavior (spoilers,
   rights, clickbait) had to be expressed as an *executable check with a
   test*, not as a prompt or a comment.
3. No invented facts — if the assistant proposed data (a scene, a quote, a
   contract term), it had to point at the package file that supplies it.

## What AI output looked plausible but was wrong (caught & fixed)

These are the honest ones — each was caught by the validator, the test
suite, or manual inspection, not by another AI opinion:

1. **Self-referential stereotype marker.** The mock model's dialect
   positioning read "…never as a joke, never as 'rural flavor'." The
   cultural check's stereotype scan (which correctly looks for markers in
   creative surfaces) flagged its own sentence. Fixed by rewording the
   positioning — the check was right; the generator was sloppy. This is the
   independence of verification working as intended.
2. **Mood-claim mismatch in beat intentions.** The YA "turn" beat's
   intention said "Emotional turn **with identity**" while the grief scene
   (the right scene) carries moods `tender, grief` — so `story_truth` failed
   the segment and the repair loop swapped in a weaker scene. The root
   cause was the creative text, not the scene: fixed the intention, and the
   grief scene came back as the turn. The repair loop had done the right
   *visible* thing (never shipped the mismatch) while hiding the *actual*
   bug — worth noting as a lesson in log triage.
3. **First clickbait check was too narrow.** It only scanned for mood
   words (warmth/conflict/…), so "MONSOON HOUSE: **MURDER** IN THE RAIN"
   sailed through. The surprise-event test caught it; fixed by adding a
   hard-claim vocabulary where each word (murder, crime, romance,
   haunting…) requires an actual scene content flag in the selected cut.
4. **Dialect-shift no-op.** When a subtitle changed, the EDL kept its own
   copy of the old dialogue line, so re-validation saw nothing wrong and the
   "revised" v2 was identical to v1. The test asserting the shifted line was
   gone caught it; fixed by re-deriving segment dialogue from the catalog
   before re-validation (a subtitle-track change must propagate into the EDL).
5. **Stale duration field.** `duration_s` is computed by a pydantic
   validator at construction; after the duration fitter rewrote timecodes
   the field was stale, so reported totals didn't match the sum of windows.
   Caught by a consistency check (reported vs. summed); fixed by
   recomputing on every window adjustment.
6. **Python 3.11 grammar trap.** A lambda with a generator-expression
   default inside a keyword-argument call is a *syntax* error that only
   surfaces at import of the change module — it read like a mysterious
   crash. The assistant's first two "explanations" were wrong; it was
   resolved by minimal reproduction, not by more discussion.
7. **Naive ingest bugs.** `{c.id for c in dicts}`-style mistakes (attribute
   access on raw JSON dicts) hit on the very first run and were fixed
   immediately — a reminder that generated code is untrusted until the
   pipeline has actually run on real-shaped data.

## Decisions where AI suggestion was challenged or rejected

- **"Just replay canned JSON for mock mode."** Rejected: a canned replay is
  one plan, forever. A deterministic *policy* behind the same `ModelClient`
  interface reproduces the plan **and** responds to changes (re-ranking,
  re-selection), which is what the surprise-event part of the brief needs.
- **"Let the LLM judge spoilers."** Rejected as the primary mechanism:
  spoiler safety is a rule system (protected facts + teaser levels + reveal
  scenes) that can be *proven* per segment; a model judgment is recorded as
  corroborating evidence (`spoiler_review`) but can veto nothing and is
  required by no test.
- **"Use engagement to pick clips."** The assistant's first retrieval draft
  weighted historic CTR heavily. Rewritten: CTR at weight 0.1, tie-break
  only, logged as `history_hypothesis` — the sample episode's top-CTR scene
  is a spoiler scene, which is the demonstration that this matters.
- **"Rebuild all three trailers on any change."** Rejected: the brief
  grades *selective* revision. Change handling traces the change through the
  evidence graph and touches only citing segments; untouched segments keep
  byte-identical timecodes (asserted in tests).

## Verification practices applied to AI-generated code

- Every module ran before the next one was written (no snowballing).
- The five required test scenarios were written **against the spec** before
  the change handler existed; the surprise-event tests came from the
  brief's own list, so the implementation couldn't quietly skip one.
- `sample_run/` is regenerated from commands in `README.md`; it is a
  generated artifact, not hand-edited JSON.
- Determinism check: running the pipeline twice yields byte-identical
  output (asserted by habit, not by tool).
