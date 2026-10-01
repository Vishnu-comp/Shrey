# Known Limitations & Human Decision Points

Honest limitations of this submission, and the decisions that must remain
with humans.

## Technical limitations

1. **The mock model is a deterministic policy, not a real LLM.**
   Mock-mode "model calls" are pure functions over the package's structured
   metadata. They make the run reproducible and key-free (a hard
   requirement), but the creative quality of the plans reflects the
   strategy tables and scoring weights, not a model's improvisation.
   `agents/live.py` shows the swap point; a live backend would improve
   creative range, not the safety guarantees (which live in the rule
   system and would be unchanged).

2. **No real video/audio analysis.**
   There is no frame sampling, scene detection, ASR or audio analysis in
   this build — grounding relies on the package's metadata (timecodes,
   moods, content flags, dialect lines) being accurate. That is consistent
   with the supplied-materials model of the brief (descriptions + dialogue
   + timecodes are the evidence base), and with "rendering is optional."
   In a production system, the multimodal passes would verify metadata
   against pixels and waveforms.

3. **Scene descriptions are evidence, not auto-verified claims.**
   The system verifies *structured* claims — scene existence, timecode
   bounds, evidence refs, dialogue lines — but free-text description claims
   ("high nostalgia potential") are passed through as human-readable
   evidence, not checked by an automated mismatch detector. The brief asks
   to "verify important claims against the episode"; the important ones
   (anything an EDL depends on) are verified; the rest are left to human
   review.

4. **Lexical, not semantic, relationship check.**
   The manufactured-relationship check (catches the dialect-shift trap) is
   word-boundary + synonym mapping against the story map's relationship
   text. It will miss paraphrases a semantic model would catch.

5. **Finite clickbait vocabulary.**
   The hard-claim check knows a fixed list of claim words (murder, crime,
   romance, haunting…). New misrepresentation phrasings need a vocabulary
   addition (or a live model pass). The mood-claim check complements it but
   is likewise open-vocabulary by design.

6. **Teaser levels are package-supplied.**
   Spoiler sensitivity (per-audience teaser level, protected facts, reveal
   scenes) comes from the platform's spoiler list in the episode package.
   The system enforces it precisely; it does not *infer* new protected
   facts from raw narrative on its own.

7. **Scope limits.**
   Timecodes are `MM:SS.mmm` (< 1 hour episodes); the sample is
   single-territory (IN); no video rendering (permitted); no UI (the brief
   prioritizes agent decisions and verification over a large user
   interface).

8. **Fallback plan is cheaper, not better.**
   The lower-cost fallback reuses cached top-1 candidates without
   re-ranking; it exists to ship *something safe within budget*, not to
   compete with the main plan.

## Decisions that must remain with humans

| Decision | Owner | Why a machine should not make it |
|---|---|---|
| Final creative judgment on each trailer (tone, pacing taste) | Editorial | Creative intent is a value judgment, not a constraint satisfaction |
| Whether the YA trailer ships before the music license lapses (2026-10-15) | Legal | Contractual ship-date risk needs a lawyer, not a rule |
| Cultural review of all dialect segments (native-speaker) | Cultural / regional team | Respect for a living register needs in-community judgment |
| Approval of grief content in the family cut (mother's kitchen) | Editorial | Emotional impact on the youngest viewers is a judgment call |
| Accepting any REJECTED plan, or shipping the fallback | Editorial + Legal | A rejection is an explicit "I can't prove this safe" — only a human may override, with sign-off |
| Interpreting ambiguous contract language | Legal | The compiler encodes *decided* terms, not interpretation |
| What counts as a protected fact for the next episode | Editorial + Legal | Spoiler policy is a business/editorial decision |
| Responding to a genuinely novel surprise event outside the 8 known types | On-call engineer + Legal | The change handler handles known types; novel types should stop, not guess |

## Intentional tradeoffs (time-box, 10–12 h)

- Chose a small custom orchestrator over an agent framework: fewer
  moving parts, fully testable, the "agentic" properties (planning,
  tool calls, verification, memory, recovery) are explicit and auditable.
- Chose a synthetic-but-realistic episode package over waiting for
  materials: the pipeline, traps and tests are all demonstrable; swapping
  in a real package is a data-format task, not an architecture task.
- Kept all three trailers in one deterministic run so the evaluator can
  diff, replay and audit every decision cheaply.
