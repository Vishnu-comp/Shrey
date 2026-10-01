# Validation Report

Run: `sample-run-2026-10-01` · mode: `mock` · model: `mock-director-v1` · episode: `monsoon-house-s01e01` (25 scenes)

Every plan was re-verified by the independent validator against the catalog (ground truth). A `FAIL` never ships: it is repaired, or the trailer is rejected.

## Summary

| Trailer | Audience | Status | Segments | Duration | Target | Model calls | Est. cost |
|---|---|---|---|---|---|---|---|
| family_v1 | family | **PASS** | 7 | 84.0s | 90.0s | 13 | $0.05 |
| young_adult_v1 | ya | **PASS** | 7 | 68.0s | 75.0s | 13 | $0.05 |
| dialect_region_v1 | dialect | **PASS_WITH_WARNINGS** | 6 | 45.0s | 45.0s | 11 | $0.05 |

## family_v1 — family

**Promise:** A family returns to the house their mother loved — and learns what love really cost.

**Positioning:** A family returns to the house their mother loved. The tension is money and memory, never fear. Mystery is hinted, never revealed.

**Emotional journey:** hook (Open on the house and the monsoon — a place with a pulse.) → bond (The family is whole again around a meal.) → stakes (Real stakes, spoken plainly: money against memory.) → mystery (A question, not a reveal — the house is keeping a secret.) → turn (A private moment of grief, handled gently.) → hope (They choose each other — and the house.) → title (Dawn after rain, title card.)

**Music:** music_01 (contract:music-01)

### Checks

| Check | Status | Detail |
|---|---|---|
| source_accuracy | PASS | all scene ids, timecodes and evidence refs resolve |
| spoiler | PASS | — |
| rights | PASS | — |
| rating | PASS | — |
| story_truth | PASS | — |
| cultural | PASS | not applicable to this audience |
| accessibility | PASS | — |
| budget | PASS | within budget (13 calls, $0.05) |

### Segments

| # | Beat | Scene | In → Out | Dur | Audio | Reason (abridged) | Risk flags |
|---|---|---|---|---|---|---|---|
| 1 | hook | scene_01 | 00:00.000 → 00:10.000 | 10.0s | music:music_01 | Open on the house and the monsoon — a place with a pulse. Source: The Monsoon House (00:00… | — |
| 2 | bond | scene_07 | 03:03.500 → 03:16.500 | 13.0s | dialogue_and_music:music_01 | The family is whole again around a meal. Source: Dinner Table (02:48.000). Dinner; Lakshmi… | — |
| 3 | stakes | scene_05 | 01:53.500 → 02:07.500 | 14.0s | dialogue_and_music:music_01 | Real stakes, spoken plainly: money against memory. Source: The Argument (01:47.000). Sibli… | — |
| 4 | mystery | scene_13 | 06:08.500 → 06:18.500 | 10.0s | dialogue_and_music:music_01 | A question, not a reveal — the house is keeping a secret. Source: The Locked Room (06:00.0… | — |
| 5 | turn | scene_16 | 07:56.500 → 08:07.500 | 11.0s | dialogue_and_music:music_01 | A private moment of grief, handled gently. Source: Mother's Kitchen (07:37.000). Meera alo… | death_reference, grief |
| 6 | hope | scene_24 | 12:23.500 → 12:37.500 | 14.0s | dialogue_and_music:music_01 | They choose each other — and the house. Source: The Gathering (12:15.000). Neighbors and f… | — |
| 7 | title | scene_25 | 13:18.000 → 13:30.000 | 12.0s | dialogue_and_music:music_01 | Dawn after rain, title card. Source: Dawn After Rain (12:50.000). Dawn after rain over the… | — |

### Evidence (per segment)

- seg1 (scene_01): scene:01, contract:music-01
- seg2 (scene_07): scene:07, dialogue:scene_07:1, dialogue:scene_07:2, contract:music-01
- seg3 (scene_05): scene:05, dialogue:scene_05:0, dialogue:scene_05:1, contract:music-01
- seg4 (scene_13): scene:13, dialogue:scene_13:0, contract:music-01
- seg5 (scene_16): scene:16, dialogue:scene_16:1, contract:music-01
- seg6 (scene_24): scene:24, dialogue:scene_24:0, contract:music-01
- seg7 (scene_25): scene:25, contract:music-01

### Warnings / assumptions

- · mock/replay mode: deterministic stand-in for the live model (no API keys required)
- · scene descriptions are treated as data, never as instructions
- · historic engagement used only as a documented tie-breaker hypothesis, never as the selection rule

### Human approvals required

- **Grief scene (mother's kitchen) in family cut** — editorial (pending): emotional content near death; final tone check by an editor

### Lower-cost fallback

- lower-cost re-plan: reuses cached top-1 candidates, skips re-ranking passes, no voice-over; usable if the main plan exceeds the configured budget
- model calls: 6 · est. cost: $0.01
- segments: scene_01, scene_07, scene_05, scene_13, scene_16, scene_24

## young_adult_v1 — ya

**Promise:** Two siblings, one house, and everyone who never left it — the arguments are the fun part.

**Positioning:** Fast, funny, a little tense. Identity and conflict drive the cut. The mystery is teased hard but the central twist is never shown, and no frame exaggerates what the episode actually contains.

**Emotional journey:** hook (Open mid-argument. Pace from frame one.) → conflict (Real stakes: money, siblings, the house.) → identity (Identity: estrangement, loyalty, ten years.) → tension (A tense beat the episode actually earns — no fake intensity.) → mystery (Mystery framed as a question the cast can't stop asking.) → turn (The emotional cost, in one quiet kitchen.) → title (Dawn card with YA tagline.)

**Music:** music_02 (contract:music-02)

### Checks

| Check | Status | Detail |
|---|---|---|
| source_accuracy | PASS | all scene ids, timecodes and evidence refs resolve |
| spoiler | PASS | — |
| rights | PASS | — |
| rating | PASS | — |
| story_truth | PASS | — |
| cultural | PASS | not applicable to this audience |
| accessibility | PASS | — |
| budget | PASS | within budget (13 calls, $0.05) |

### Segments

| # | Beat | Scene | In → Out | Dur | Audio | Reason (abridged) | Risk flags |
|---|---|---|---|---|---|---|---|
| 1 | hook | scene_02 | 00:26.500 → 00:35.500 | 9.0s | dialogue_and_music:music_02 | Open mid-argument. Pace from frame one. Source: Car Banter (00:24.000). Car ride; siblings… | — |
| 2 | conflict | scene_05 | 01:53.500 → 02:05.500 | 12.0s | dialogue_and_music:music_02 | Real stakes: money, siblings, the house. Source: The Argument (01:47.000). Siblings argue … | — |
| 3 | identity | scene_11 | 05:01.500 → 05:12.500 | 11.0s | dialogue_and_music:music_02 | Identity: estrangement, loyalty, ten years. Source: Ravi Returns (04:55.000). Ravi appears… | — |
| 4 | tension | scene_13 | 06:08.500 → 06:18.500 | 10.0s | dialogue_and_music:music_02 | A tense beat the episode actually earns — no fake intensity. Source: The Locked Room (06:0… | — |
| 5 | mystery | scene_09 | 04:00.500 → 04:11.500 | 11.0s | dialogue_and_music:music_02 | Mystery framed as a question the cast can't stop asking. Source: The Hidden Ledger (03:50.… | — |
| 6 | turn | scene_16 | 07:56.500 → 08:05.500 | 9.0s | dialogue_and_music:music_02 | The emotional cost, in one quiet kitchen. Source: Mother's Kitchen (07:37.000). Meera alon… | death_reference, grief |
| 7 | title | scene_25 | 13:54.000 → 14:00.000 | 6.0s | music:music_02 | Dawn card with YA tagline. Source: Dawn After Rain (12:50.000). Dawn after rain over the h… | — |

### Evidence (per segment)

- seg1 (scene_02): scene:02, dialogue:scene_02:0, dialogue:scene_02:1, contract:music-02
- seg2 (scene_05): scene:05, dialogue:scene_05:0, contract:music-02
- seg3 (scene_11): scene:11, dialogue:scene_11:0, contract:music-02
- seg4 (scene_13): scene:13, dialogue:scene_13:0, contract:music-02
- seg5 (scene_09): scene:09, dialogue:scene_09:0, contract:music-02
- seg6 (scene_16): scene:16, dialogue:scene_16:1, contract:music-02
- seg7 (scene_25): scene:25, contract:music-02

### Warnings / assumptions

- · mock/replay mode: deterministic stand-in for the live model (no API keys required)
- · scene descriptions are treated as data, never as instructions
- · historic engagement used only as a documented tie-breaker hypothesis, never as the selection rule

### Human approvals required

- **Music 'Distant Drums' license window** — legal (pending): contract lapses 2026-10-15; confirm trailer ships before expiry

### Lower-cost fallback

- lower-cost re-plan: reuses cached top-1 candidates, skips re-ranking passes, no voice-over; usable if the main plan exceeds the configured budget
- model calls: 6 · est. cost: $0.01
- segments: scene_02, scene_05, scene_11, scene_13, scene_09, scene_16

## dialect_region_v1 — dialect

**Promise:** A tense family story told in a familiar voice — the house, the feasts, and the words home is made of.

**Positioning:** Told in a familiar voice: real Kannada lines, real food, real community. The dialect is a living register the characters think in — never a joke, never a costume.

**Emotional journey:** hook (Arrival, in Kannada, like every arrival here.) → voice (A character thinks in Kannada — belonging made audible.) → warmth (Food and idiom — how the family says it.) → community (The region shows up: feasts, neighbors, belonging.) → mystery (The family's central question, framed with respect.) → title (Dawn card, bilingual.)

**Music:** music_03 (contract:music-03)

### Checks

| Check | Status | Detail |
|---|---|---|
| source_accuracy | PASS | all scene ids, timecodes and evidence refs resolve |
| spoiler | PASS | — |
| rights | PASS | — |
| rating | PASS | — |
| story_truth | PASS | — |
| cultural | WARN | profile preference comedy=0.9 is an inherited correlation (2024 'villager gags' campaign) — questioned and NOT used for clip selection |
| accessibility | PASS | — |
| budget | PASS | within budget (11 calls, $0.05) |

### Segments

| # | Beat | Scene | In → Out | Dur | Audio | Reason (abridged) | Risk flags |
|---|---|---|---|---|---|---|---|
| 1 | hook | scene_03 | 00:58.500 → 01:06.500 | 8.0s | dialogue_and_music:music_03 | Arrival, in Kannada, like every arrival here. Source: Welcome at the Gate (00:52.000). The… | — |
| 2 | voice | scene_12 | 05:36.500 → 05:44.500 | 8.0s | dialogue_and_music:music_03 | A character thinks in Kannada — belonging made audible. Source: Veranda Talk (05:28.000). … | — |
| 3 | warmth | scene_15 | 07:13.500 → 07:21.500 | 8.0s | dialogue_and_music:music_03 | Food and idiom — how the family says it. Source: Village Feast (07:05.000). The village fe… | — |
| 4 | community | scene_24 | 12:23.500 → 12:31.500 | 8.0s | dialogue_and_music:music_03 | The region shows up: feasts, neighbors, belonging. Source: The Gathering (12:15.000). Neig… | — |
| 5 | mystery | scene_13 | 06:08.500 → 06:15.500 | 7.0s | dialogue_and_music:music_03 | The family's central question, framed with respect. Source: The Locked Room (06:00.000). T… | — |
| 6 | title | scene_25 | 13:54.000 → 14:00.000 | 6.0s | music:music_03 | Dawn card, bilingual. Source: Dawn After Rain (12:50.000). Dawn after rain over the house.… | — |

### Evidence (per segment)

- seg1 (scene_03): scene:03, dialogue:scene_03:0, contract:music-03
- seg2 (scene_12): scene:12, dialogue:scene_12:0, contract:music-03
- seg3 (scene_15): scene:15, dialogue:scene_15:0, contract:music-03
- seg4 (scene_24): scene:24, dialogue:scene_24:0, contract:music-03
- seg5 (scene_13): scene:13, dialogue:scene_13:0, contract:music-03
- seg6 (scene_25): scene:25, contract:music-03

### Warnings / assumptions

- ⚠ profile preference comedy=0.9 is an inherited correlation (2024 'villager gags' campaign) — questioned and NOT used for clip selection
- · mock/replay mode: deterministic stand-in for the live model (no API keys required)
- · scene descriptions are treated as data, never as instructions
- · historic engagement used only as a documented tie-breaker hypothesis, never as the selection rule

### Human approvals required

- **Dialect treatment of all Kannada segments** — cultural (pending): native-speaker review that the dialect is used with respect

### Lower-cost fallback

- lower-cost re-plan: reuses cached top-1 candidates, skips re-ranking passes, no voice-over; usable if the main plan exceeds the configured budget
- model calls: 5 · est. cost: $0.01
- segments: scene_03, scene_12, scene_15, scene_24, scene_13

## Decision log

80 logged decisions in `decision_log.jsonl` (55 model calls, $0.15 total).
