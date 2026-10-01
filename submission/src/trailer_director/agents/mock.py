"""Deterministic mock model (replay mode).

Every method is a pure, deterministic function of the episode package data.
No randomness, no network, no API keys — the same package always produces
the same plan, which is what makes the test suite and the sample run
reproducible for the evaluator.
"""
from __future__ import annotations

from typing import Any

from ..models import BeatPlan, CreativeBrief
from ..timecodes import seconds_to_tc, tc_to_seconds
from .llm import ModelClient

# Audience strategy tables: promise, positioning and the mini-story arc.
# These encode *creative judgment*, grounded in the supplied audience
# profiles and the episode's moods — they are the "directorial" layer.
STRATEGIES: dict[str, dict] = {
    "family": {
        "objective": "Communicate warmth, stakes and broad entertainment value.",
        "positioning": (
            "A family returns to the house their mother loved. The tension is "
            "money and memory, never fear. Mystery is hinted, never revealed."
        ),
        "promise": "A family returns to the house their mother loved — and learns what love really cost.",
        "beats": [
            {"beat": "hook", "name": "The house in the rain", "intention": "Open on the house and the monsoon — a place with a pulse.",
             "moods": ["atmospheric", "warm", "nostalgic"], "max_duration_s": 12, "target_s": 10},
            {"beat": "bond", "name": "The table", "intention": "The family is whole again around a meal.",
             "moods": ["warm", "humor"], "max_duration_s": 16, "target_s": 13},
            {"beat": "stakes", "name": "What the house costs", "intention": "Real stakes, spoken plainly: money against memory.",
             "moods": ["conflict", "stakes"], "max_duration_s": 16, "target_s": 14},
            {"beat": "mystery", "name": "Something in the walls", "intention": "A question, not a reveal — the house is keeping a secret.",
             "moods": ["mystery", "suspense"], "max_duration_s": 12, "target_s": 10},
            {"beat": "turn", "name": "Love and loss", "intention": "A private moment of grief, handled gently.",
             "moods": ["tender", "grief"], "max_duration_s": 13, "target_s": 11},
            {"beat": "hope", "name": "The choice", "intention": "They choose each other — and the house.",
             "moods": ["hope", "warm", "community"], "max_duration_s": 16, "target_s": 14},
            {"beat": "title", "name": "Title", "intention": "Dawn after rain, title card.",
             "moods": ["atmospheric", "warm"], "max_duration_s": 14, "target_s": 12},
        ],
        "target_duration_s": 90,
    },
    "ya": {
        "objective": "Highlight pace, humour, identity and character conflict.",
        "positioning": (
            "Fast, funny, a little tense. Identity and conflict drive the cut. "
            "The mystery is teased hard but the central twist is never shown, "
            "and no frame exaggerates what the episode actually contains."
        ),
        "promise": "Two siblings, one house, and everyone who never left it — the arguments are the fun part.",
        "beats": [
            {"beat": "hook", "name": "Car banter", "intention": "Open mid-argument. Pace from frame one.",
             "moods": ["humor", "conflict"], "max_duration_s": 10, "target_s": 9},
            {"beat": "conflict", "name": "The dues", "intention": "Real stakes: money, siblings, the house.",
             "moods": ["conflict", "stakes"], "max_duration_s": 12, "target_s": 11},
            {"beat": "identity", "name": "The one who came back", "intention": "Identity: estrangement, loyalty, ten years.",
             "moods": ["identity", "warm"], "max_duration_s": 12, "target_s": 11},
            {"beat": "tension", "name": "The dark", "intention": "A tense beat the episode actually earns — no fake intensity.",
             "moods": ["tense", "suspense"], "max_duration_s": 12, "target_s": 10},
            {"beat": "mystery", "name": "The sealed room", "intention": "Mystery framed as a question the cast can't stop asking.",
             "moods": ["suspense", "mystery"], "max_duration_s": 12, "target_s": 11},
            {"beat": "turn", "name": "What it cost", "intention": "The emotional cost, in one quiet kitchen.",
             "moods": ["grief", "identity", "tender"], "max_duration_s": 10, "target_s": 9},
            {"beat": "title", "name": "Title", "intention": "Dawn card with YA tagline.",
             "moods": ["atmospheric"], "max_duration_s": 7, "target_s": 6},
        ],
        "target_duration_s": 75,
    },
    "dialect": {
        "objective": "Show that the release understands the Kannada-speaking region's language and cultural context.",
        "positioning": (
            "Told in a familiar voice: real Kannada lines, real food, real community. "
            "The dialect is a living register the characters think in — never a joke, "
            "never a costume."
        ),
        "promise": "A tense family story told in a familiar voice — the house, the feasts, and the words home is made of.",
        "beats": [
            {"beat": "hook", "name": "Welcome at the gate", "intention": "Arrival, in Kannada, like every arrival here.",
             "moods": ["warm", "community"], "max_duration_s": 8, "target_s": 8, "needs_dialect_line": True},
            {"beat": "voice", "name": "The familiar voice", "intention": "A character thinks in Kannada — belonging made audible.",
             "moods": ["tender", "identity"], "max_duration_s": 8, "target_s": 8, "needs_dialect_line": True},
            {"beat": "warmth", "name": "The table", "intention": "Food and idiom — how the family says it.",
             "moods": ["warm", "humor"], "max_duration_s": 8, "target_s": 8, "needs_dialect_line": True},
            {"beat": "community", "name": "The village feast", "intention": "The region shows up: feasts, neighbors, belonging.",
             "moods": ["community", "warm", "festive"], "max_duration_s": 8, "target_s": 8, "needs_dialect_line": True},
            {"beat": "mystery", "name": "The question", "intention": "The family's central question, framed with respect.",
             "moods": ["mystery"], "max_duration_s": 8, "target_s": 7},
            {"beat": "title", "name": "Title", "intention": "Dawn card, bilingual.",
             "moods": ["atmospheric", "warm"], "max_duration_s": 7, "target_s": 6},
        ],
        "target_duration_s": 45,
    },
}


class MockModel(ModelClient):
    name = "mock-director-v1"

    # -- 1. story map --------------------------------------------------------

    def build_story_map(self, catalog: Any) -> dict:
        """Assemble the story map from structured package metadata.

        In live mode this pass would summarize scene descriptions/dialogue
        with an LLM; in mock mode the same output is derived from the
        package's structured fields (characters, relationships, moods,
        protected facts). Claims that matter (spoilers, sensitive content)
        are taken from the platform's own protected-fact list, not guessed.
        """
        characters = [
            {
                "id": c.id,
                "name": c.name,
                "age": c.age,
                "role": c.role,
                "notes": c.notes,
            }
            for c in catalog.characters.values()
        ]
        relationships = list(catalog.relationships)
        events = [
            {
                "scene_id": s.scene_id,
                "tc": s.in_tc,
                "title": s.title,
                "summary": s.summary,
                "weight": s.story_weight,
            }
            for s in sorted(catalog.scenes.values(), key=lambda x: x.story_weight)
        ]
        emotional_turns = [
            {"scene_id": s.scene_id, "tc": s.in_tc, "title": s.title}
            for s in catalog.scenes.values()
            if s.emotional_turn
        ]
        spoilers = [
            {
                "fact_id": f.fact_id,
                "text": f.text,
                "reveal_scene": f.reveal_scene,
                "reveal_tc": f.reveal_tc,
                "teaser": f.teaser,
                "keywords": f.keywords,
            }
            for f in catalog.protected_facts
        ]
        sensitive = [
            {
                "scene_id": s.scene_id,
                "tags": sorted(s.content_flags.keys()),
                "flags": s.content_flags,
            }
            for s in catalog.scenes.values()
            if s.content_flags
        ]
        return {
            "characters": characters,
            "relationships": relationships,
            "events": events,
            "emotional_turns": emotional_turns,
            "protected_facts": spoilers,
            "sensitive_content": sensitive,
            "central_twist": catalog.central_twist,
        }

    # -- 2. audience promise ---------------------------------------------------

    def plan_promise(self, audience: str, story_map: dict, catalog: Any) -> CreativeBrief:
        strat = STRATEGIES[audience]
        profile = catalog.audiences.get(audience)
        beats = [BeatPlan(**b) for b in strat["beats"]]
        return CreativeBrief(
            audience=audience,
            objective=strat["objective"] + (f" (profile: {profile.name})" if profile else ""),
            promise=strat["promise"],
            positioning=strat["positioning"],
            beats=beats,
            target_duration_s=strat["target_duration_s"],
        )

    # -- 3. candidate ranking -------------------------------------------------

    def rank_candidates(
        self, beat: BeatPlan, audience: str, catalog: Any, used_scenes: list[str]
    ) -> list[dict]:
        """Deterministic fit-score. Historic CTR is a *tie-breaker only*
        (weight 0.1) — the brief explicitly forbids engagement-driven
        selection, and the decision log records it as a hypothesis."""
        history = {h.scene_id: h.ctr for h in catalog.history}
        excl = {
            cid
            for cid in catalog.characters
            if (c := catalog.actor_contract(cid))
            and c.terms.get("promotional_use", "full") in ("stills_only", "none")
        }
        ep_dur = max(tc_to_seconds(s.out_tc) for s in catalog.scenes.values()) or 1.0
        scored = []
        for scene in catalog.scenes.values():
            if beat.beat == "title":
                continue  # title beat is handled by the builder (text card)
            if scene.scene_id in used_scenes:
                continue
            score = 0.0
            why = []
            overlap = set(scene.mood) & set(beat.moods)
            if overlap:
                score += 3.0 * len(overlap)
                why.append(f"mood:{'+'.join(sorted(overlap))}")
            if getattr(beat, "needs_dialect_line", False):
                dial = [ln for ln in scene.lines if ln.lang in ("hi", "kn") and ln.speaker not in excl]
                if dial:
                    score += 2.0
                    why.append(f"dialect_line:{dial[0].lang}")
                else:
                    score -= 3.0  # dialect beats must carry authentic dialect
            if beat.beat == "hook":
                mid = (tc_to_seconds(scene.in_tc) + tc_to_seconds(scene.out_tc)) / 2
                score += 1.0 * (1 - mid / ep_dur)
                why.append("narrative_opening")
            if scene.emotional_turn and beat.beat in ("turn", "hope", "identity"):
                score += 1.0
                why.append("emotional_turn")
            score += 0.5 * scene.story_weight
            if scene.scene_id in history:
                score += 0.1 * history[scene.scene_id]
                why.append(f"history_hypothesis:{history[scene.scene_id]}")
            scored.append({"scene_id": scene.scene_id, "score": round(score, 3), "why": why})
        scored.sort(key=lambda r: (-r["score"], r["scene_id"]))
        return scored[:8]

    # -- 4. segment selection -------------------------------------------------

    def select_segment(self, beat: BeatPlan, scene_id: str, catalog: Any, excluded_speakers: set | None = None) -> dict:
        """Choose a timecode window inside the scene's real bounds.

        Anchor: the first rights-clean line (for grief/tender beats, the last
        line — the emotional landing; for dialect beats, an authentic dialect
        line). The window is always clamped to [scene.in, scene.out] — a
        phantom timecode is impossible.
        """
        scene = catalog.scenes[scene_id]
        excluded = excluded_speakers or set()
        lo = tc_to_seconds(scene.in_tc)
        hi = tc_to_seconds(scene.out_tc)
        target = beat.target_s
        lines = [l for l in scene.lines if l.speaker not in excluded]
        best = None
        if lines:
            needs_dialect = getattr(beat, "needs_dialect_line", False)
            dialect_lines = [l for l in lines if l.lang in ("hi", "kn")]
            if needs_dialect and dialect_lines:
                best = dialect_lines[0]
            elif set(beat.moods) & {"grief", "tender"} and len(lines) >= 2:
                best = lines[-1]
            else:
                best = lines[0]
        if best is not None:
            start = max(lo, tc_to_seconds(best.tc) - 1.5)
        else:
            start = lo
        end = min(hi, start + target)
        if end - start < 2.5:  # minimum usable cut
            start = max(lo, hi - 3.0)
            end = hi
        window = [l for l in lines if start <= tc_to_seconds(l.tc) < end]
        dialog = [
            {
                "speaker": l.speaker,
                "line": l.translation if l.lang != "source" and l.translation else l.text,
                "tc": l.tc,
                "lang": l.lang,
                **({"translation": l.translation} if l.lang != "source" and l.translation else {}),
            }
            for l in window
        ]
        subtitle: dict[str, str] = {}
        for l in window:
            if l.lang == "source":
                subtitle.setdefault("en", l.text)
            else:
                subtitle.setdefault(l.lang, l.translation or l.text)
        return {
            "source_in": seconds_to_tc(start),
            "source_out": seconds_to_tc(end),
            "video": scene.scene_id,
            "dialogue": dialog,
            "subtitle": subtitle or None,
            "window_around": best.tc if best is not None else None,
        }

    # -- 5. semantic spoiler review (validator corroboration) -----------------

    def review_spoiler(self, segment: Any, story_map: dict, audience: str) -> dict:
        scene = segment.get("video") if isinstance(segment, dict) else getattr(segment, "video", None)
        text = ""
        if isinstance(segment, dict):
            text = " ".join(d.get("line", "") for d in segment.get("dialogue", []))
            text += " " + str(segment.get("text_card") or "")
        else:
            text = " ".join(d.get("line", "") for d in segment.dialogue)
        text = text.lower()
        hits = []
        for fact in story_map["protected_facts"]:
            level = fact["teaser"].get(audience, 0)
            if scene == fact["reveal_scene"]:
                hits.append({"fact": fact["fact_id"], "issue": "segment IS the reveal scene", "level": level})
            elif level == 0:
                for kw in fact["keywords"]:
                    if kw.lower() in text:
                        hits.append({"fact": fact["fact_id"], "issue": f"keyword '{kw}' beyond teaser level 0", "level": level})
        return {"clear": not hits, "hits": hits}

    # -- 6. change review ------------------------------------------------------

    def review_change(self, change: Any, catalog: Any, story_map: dict) -> dict:
        """Deterministic impact hypothesis for a change spec. The change
        handler still computes the *exact* affected set from the evidence
        graph; this call is the model's corroborating read."""
        ctype = change.type if hasattr(change, "type") else change["type"]
        ref = change.ref if hasattr(change, "ref") else change.get("ref")
        return {
            "change_type": ctype,
            "ref": ref,
            "touches": self._change_touches(ctype, ref, catalog, story_map),
            "note": "hypothesis only — exact impact computed from evidence graph",
        }

    def _change_touches(self, ctype: str, ref: str | None, catalog: Any, story_map: dict) -> list[str]:
        out = []
        if ctype in ("contract_expired", "actor_terms_changed") and ref:
            c = catalog.contracts.get(ref)
            if c is None and ref.startswith("music-"):
                c = next((x for x in catalog.contracts.values() if x.ref == ref.replace("music-", "music_")), None)
            if c is not None:
                out.append(f"contract:{ref}")
        if ctype == "dialect_shift" and ref:
            out.append(f"dialogue:{ref}")
        return out
