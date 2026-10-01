"""Independent verification layer.

The validator re-runs every check on the *final* EDL against the catalog
(ground truth). It does not trust the planner's `reason` field as authority —
reasons are *checked* for story truth, not believed. Each check returns a
CheckResult with the affected segment numbers so repair can be surgical.

Checks (the eight non-negotiables from the brief):
  source_accuracy  every scene id and timecode exists in the episode
  spoiler          protected facts are never revealed beyond teaser level
  rights           only contracted actors/music/territories are used
  rating           audience age/regional policies applied
  story_truth      no manufactured relationships, threats or clickbait
  cultural         dialect treated with evidence, never as stereotype
  accessibility    subtitles/text readable, nothing audio-only
  budget           model calls and cost within configured limits
"""
from __future__ import annotations

import re
from typing import Optional

from ..models import CheckResult, Segment, TrailerPlan
from ..timecodes import tc_to_seconds

# hard-claim words -> scene content flag that would justify them
CLICKBAIT_WORDS = {
    "murder": "murder",
    "murders": "murder",
    "killed": "murder",
    "killer": "murder",
    "death": "death_reference",
    "dying": "death_reference",
    "ghost": "supernatural",
    "haunted": "supernatural",
    "crime": "crime",
    "theft": "crime",
    "stolen": "crime",
    "scam": "crime",
    "violence": "violence",
    "fight": "violence",
    "blood": "violence",
    "romance": "romance",
    "kiss": "romance",
    "betrayal": "betrayal",
    "affair": "betrayal",
}


def _clickbait_violations(surface: str, selected_scenes) -> list[str]:
    t = surface.lower()
    out = []
    for word, required_flag in CLICKBAIT_WORDS.items():
        if re.search(rf"\b{re.escape(word)}\b", t):
            if not any(required_flag in s.content_flags for s in selected_scenes):
                out.append(word)
    return out


# relationship words -> story-map substrings that would support the claim
REL_WORDS = {
    "brother": ["brother", "sibling"],
    "sister": ["sister", "sibling"],
    "wife": ["wife", "spouse"],
    "husband": ["husband", "spouse"],
    "mother": ["mother", "parent"],
    "father": ["father", "parent"],
    "son-in-law": ["in-law"],
    "daughter-in-law": ["in-law"],
    "in-law": ["in-law"],
    "fiancé": ["fiancé", "fiancée", "engaged"],
    "fiancée": ["fiancé", "fiancée", "engaged"],
}


def _supported_relationship_text(catalog) -> str:
    return " ".join(r.get("relation", "").lower() for r in catalog.relationships)

# claim word -> moods that would truthfully support it
CLAIM_MOODS = {
    "warmth": ["warm", "nostalgic"],
    "humor": ["humor"],
    "conflict": ["conflict"],
    "stakes": ["stakes", "conflict"],
    "mystery": ["mystery", "suspense"],
    "suspense": ["suspense", "mystery"],
    "tender": ["tender"],
    "grief": ["grief"],
    "identity": ["identity"],
    "hope": ["hope"],
    "community": ["community"],
    "atmospheric": ["atmospheric"],
    "nostalgic": ["nostalgic", "atmospheric"],
    "festive": ["festive", "community"],
    "frightening": ["frightening"],
    "tense": ["tense", "suspense"],
}

STEREOTYPE_MARKERS = ["rural", "funny villagers", "exotic", "comic accent", "villager gags"]
SERIOUS_LINE_MARKERS = ["won't leave", "stay", "family", "never", "aana", "noddala"]


def _claims(text: str) -> list[str]:
    t = text.lower()
    return [word for word in CLAIM_MOODS if word in t]


# ---------------------------------------------------------------------------
# individual checks
# ---------------------------------------------------------------------------


def check_source_accuracy(plan: TrailerPlan, catalog) -> CheckResult:
    fails, details = [], []
    for seg in plan.segments:
        scene = catalog.scene(seg.video)
        if scene is None:
            fails.append(seg.seg)
            details.append(f"seg{seg.seg}: scene '{seg.video}' does not exist in the episode")
            continue
        lo, hi = tc_to_seconds(scene.in_tc), tc_to_seconds(scene.out_tc)
        si, so = tc_to_seconds(seg.source_in), tc_to_seconds(seg.source_out)
        if not (lo <= si < so <= hi):
            fails.append(seg.seg)
            details.append(
                f"seg{seg.seg}: window {seg.source_in}-{seg.source_out} outside "
                f"{scene.scene_id} bounds {scene.in_tc}-{scene.out_tc}"
            )
        for d in seg.dialogue:
            if not catalog.tc_in_scene(seg.video, d["tc"]):
                fails.append(seg.seg)
                details.append(f"seg{seg.seg}: dialogue tc {d['tc']} not in scene")
        for ev in seg.evidence:
            if not catalog.resolve_evidence(ev):
                fails.append(seg.seg)
                details.append(f"seg{seg.seg}: evidence '{ev}' does not resolve to supplied material")
    return CheckResult(
        check="source_accuracy",
        status="fail" if fails else "pass",
        detail="; ".join(details) or "all scene ids, timecodes and evidence refs resolve",
        segments=sorted(set(fails)),
    )


def check_spoiler(plan: TrailerPlan, catalog) -> CheckResult:
    fails, warns, details = [], [], []
    audience = plan.audience
    for seg in plan.segments:
        scene = catalog.scene(seg.video)
        if scene is None:
            continue
        text = " ".join(d.get("line", "") for d in seg.dialogue).lower()
        text += " " + (seg.text_card or "").lower()
        for fact in catalog.protected_facts:
            level = fact.teaser.get(audience, 0)
            if seg.video == fact.reveal_scene:
                if level < 2:
                    fails.append(seg.seg)
                    details.append(
                        f"seg{seg.seg}: segment IS the reveal scene of {fact.fact_id} "
                        f"(teaser level {level})"
                    )
                else:
                    warns.append(seg.seg)
                    details.append(f"seg{seg.seg}: reveal scene used at teaser level 2")
            elif scene.content_flags.get("post_reveal", 0) and level == 0:
                fails.append(seg.seg)
                details.append(f"seg{seg.seg}: post-reveal content with teaser level 0 ({fact.fact_id})")
            elif scene.content_flags.get("post_reveal", 0) and level == 1:
                warns.append(seg.seg)
                details.append(
                    f"seg{seg.seg}: implies an event not shown ({fact.fact_id}, teaser 1) — "
                    "flagged as potential misleading intensity"
                )
            elif level < 2:
                for kw in fact.keywords:
                    if kw.lower() in text:
                        fails.append(seg.seg)
                        details.append(
                            f"seg{seg.seg}: reveals {fact.fact_id} via '{kw}' (teaser level {level})"
                        )
                        break
    status = "fail" if fails else ("warn" if warns else "pass")
    return CheckResult(check="spoiler", status=status, detail="; ".join(details), segments=sorted(set(fails + warns)))


def check_rights(plan: TrailerPlan, catalog) -> CheckResult:
    fails, details = [], []
    for seg in plan.segments:
        scene = catalog.scene(seg.video)
        if scene is None:
            continue
        # music
        for track in seg.music_tracks():
            c = catalog.track_contract(track)
            if c is None:
                fails.append(seg.seg)
                details.append(f"seg{seg.seg}: no contract found for music '{track}'")
                continue
            if not catalog.contract_active(c):
                fails.append(seg.seg)
                details.append(
                    f"seg{seg.seg}: music '{track}' contract {c.id} lapsed on {c.valid_until} (run date {catalog.run_date})"
                )
                continue
            auds = c.terms.get("audiences", ["*"])
            if "*" not in auds and plan.audience not in auds:
                fails.append(seg.seg)
                details.append(f"seg{seg.seg}: music '{track}' not licensed for audience '{plan.audience}'")
        # actors
        lines_speakers = {d.get("speaker") for d in seg.dialogue}
        for actor in catalog.actors_in(scene):
            c = catalog.actor_contract(actor)
            if c is None or c.terms.get("promotional_use", "full") == "full":
                continue
            use = c.terms.get("promotional_use")
            if use == "none":
                if actor in scene.primary or actor in scene.secondary or actor in lines_speakers:
                    fails.append(seg.seg)
                    details.append(f"seg{seg.seg}: actor {actor} (contract {c.id}) has no promotional use")
            elif use == "stills_only":
                if actor in scene.primary or actor in lines_speakers:
                    fails.append(seg.seg)
                    details.append(
                        f"seg{seg.seg}: actor {actor} (contract {c.id}) allows stills only — "
                        f"no moving video or voice"
                    )
            elif use == "background_only" and actor in scene.primary:
                fails.append(seg.seg)
                details.append(
                    f"seg{seg.seg}: actor {actor} (contract {c.id}) may appear in background only"
                )
        # territory
        for c in catalog.contracts.values():
            if c.kind == "territory" and "IN" not in c.terms.get("markets", ["*"]):
                fails.append(seg.seg)
                details.append(f"seg{seg.seg}: territory 'IN' not licensed ({c.id})")
    return CheckResult(check="rights", status="fail" if fails else "pass", detail="; ".join(details), segments=sorted(set(fails)))


def check_rating(plan: TrailerPlan, catalog) -> CheckResult:
    import operator

    ops = {">=": operator.ge, ">": operator.gt, "<=": operator.le, "<": operator.lt, "==": operator.eq, "!=": operator.ne}
    fails, warns, details = [], [], []
    for seg in plan.segments:
        scene = catalog.scene(seg.video)
        if scene is None:
            continue
        for p in catalog.policies:
            if p.audience not in ("*", plan.audience):
                continue
            if p.field == "has_dialogue":
                actual = len(scene.lines) > 0
            elif p.field == "stereotype_framing":
                dialect = any(l.lang in ("hi", "kn") for l in scene.lines)
                actual = dialect and "humor" in scene.mood
            elif p.field == "subtitle_missing":
                continue  # handled by accessibility
            else:
                actual = scene.content_flags.get(p.field, 0)
            try:
                violated = ops[p.op](actual, p.value)
            except TypeError:
                violated = False
            if violated:
                if p.action == "block":
                    fails.append(seg.seg)
                    details.append(f"seg{seg.seg}: violates {p.rule_id} — {p.description or p.field}")
                else:
                    warns.append(seg.seg)
                    details.append(f"seg{seg.seg}: flagged by {p.rule_id}")
    status = "fail" if fails else ("warn" if warns else "pass")
    return CheckResult(check="rating", status=status, detail="; ".join(details), segments=sorted(set(fails + warns)))


def check_story_truth(plan: TrailerPlan, catalog) -> CheckResult:
    fails, warns, details = [], [], []
    selected: set[str] = set()
    for seg in plan.segments:
        scene = catalog.scene(seg.video)
        if scene is not None:
            selected.add(scene.scene_id)
    all_moods: set[str] = set()
    for sid in selected:
        all_moods |= set(catalog.scenes[sid].mood)

    def supported(claims: list[str]) -> list[str]:
        out = []
        for c in claims:
            if not (set(CLAIM_MOODS[c]) & all_moods):
                out.append(c)
        return out

    selected_scenes = [catalog.scene(s.video) for s in plan.segments]
    selected_scenes = [s for s in selected_scenes if s is not None]
    for seg in plan.segments:
        scene = catalog.scene(seg.video)
        if scene is None:
            continue
        scene_moods = set(scene.mood)
        claims = _claims(seg.reason)
        for c in claims:
            if not (set(CLAIM_MOODS[c]) & scene_moods):
                fails.append(seg.seg)
                details.append(f"seg{seg.seg}: reason claims '{c}' not supported by {scene.scene_id} moods {sorted(scene_moods)}")
        # clickbait: cards must be grounded in what the cut actually contains
        if seg.text_card:
            for c in _claims(seg.text_card):
                if not (set(CLAIM_MOODS[c]) & all_moods):
                    fails.append(seg.seg)
                    details.append(f"seg{seg.seg}: card text claims '{c}' that the episode does not contain")
            for word in _clickbait_violations(seg.text_card, selected_scenes):
                fails.append(seg.seg)
                details.append(
                    f"seg{seg.seg}: title card claims '{word}' — no selected scene contains that content (clickbait)"
                )
    # promise-level: the central promise must be coverable by the cut
    promise_claims = _claims(plan.audience_promise)
    for c in promise_claims:
        if not (set(CLAIM_MOODS[c]) & all_moods):
            fails.append(0)
            details.append(f"promise claims '{c}' but no selected scene supports it")
    for word in _clickbait_violations(plan.audience_promise, selected_scenes):
        fails.append(0)
        details.append(f"promise claims '{word}' that the episode does not contain (misrepresentation)")
    # post-reveal implied events (misleading intensity)
    twist = catalog.central_twist
    for seg in plan.segments:
        scene = catalog.scene(seg.video)
        if scene and scene.content_flags.get("post_reveal", 0):
            warns.append(seg.seg)
            details.append(
                f"seg{seg.seg}: emotional content implies a revealed event ({twist}) not present in this cut"
            )
    # manufactured-relationship check on every spoken/subtitled line
    rel_text = _supported_relationship_text(catalog)
    for seg in plan.segments:
        for d in seg.dialogue:
            text = (d.get("translation") or d.get("line") or "").lower()
            for word, supports in REL_WORDS.items():
                if re.search(rf"\b{re.escape(word)}\b", text) and not any(s in rel_text for s in supports):
                    fails.append(seg.seg)
                    details.append(
                        f"seg{seg.seg}: line implies relationship '{word}' not supported by the story map"
                    )
    status = "fail" if fails else ("warn" if warns else "pass")
    return CheckResult(check="story_truth", status=status, detail="; ".join(details), segments=sorted(set(fails + warns)))


def check_cultural(plan: TrailerPlan, catalog) -> CheckResult:
    fails, warns, details = [], [], []
    if plan.audience != "dialect":
        return CheckResult(check="cultural", status="pass", detail="not applicable to this audience")

    dialect_segments = [
        s for s in plan.segments
        if any(d.get("lang") in ("hi", "kn") for d in s.dialogue)
    ]
    if len(dialect_segments) < 2:
        fails.append(0)
        details.append(
            f"only {len(dialect_segments)} segment(s) carry authentic dialect lines; "
            "dialect-region trailer must be told in the region's voice (>=2)"
        )
    for seg in dialect_segments:
        scene = catalog.scene(seg.video)
        if scene and "humor" in scene.mood:
            for d in seg.dialogue:
                if d.get("lang") in ("hi", "kn") and any(
                    m in (d.get("translation") or d.get("line") or "").lower() for m in SERIOUS_LINE_MARKERS
                ):
                    fails.append(seg.seg)
                    details.append(f"seg{seg.seg}: serious dialect line framed as comedy")
    # inherited-correlation bias control
    profile = catalog.audiences.get("dialect")
    if profile and profile.preferences.get("comedy", 0) > 0.8:
        warns.append(0)
        details.append(
            "profile preference comedy=0.9 is an inherited correlation (2024 'villager gags' "
            "campaign) — questioned and NOT used for clip selection"
        )
    # stereotype scan over creative surfaces
    surface = (plan.audience_promise + " " + plan.creative_brief.positioning).lower()
    for marker in STEREOTYPE_MARKERS:
        if marker in surface:
            fails.append(0)
            details.append(f"stereotype marker '{marker}' in creative surfaces")
    status = "fail" if fails else ("warn" if warns else "pass")
    return CheckResult(check="cultural", status=status, detail="; ".join(details), segments=sorted(set(fails + warns)))


def check_accessibility(plan: TrailerPlan, catalog) -> CheckResult:
    fails, details = [], []
    for seg in plan.segments:
        if seg.dialogue and not seg.subtitle:
            fails.append(seg.seg)
            details.append(f"seg{seg.seg}: has dialogue but no subtitles")
        if seg.text_card and seg.duration_s < 3.0:
            fails.append(seg.seg)
            details.append(f"seg{seg.seg}: text card readable for {seg.duration_s}s (<3s)")
        if seg.vo and not seg.subtitle:
            fails.append(seg.seg)
            details.append(f"seg{seg.seg}: voice-over without on-screen text")
    return CheckResult(check="accessibility", status="fail" if fails else "pass", detail="; ".join(details), segments=sorted(set(fails)))


def check_budget(plan: TrailerPlan, catalog) -> CheckResult:
    est = plan.cost_estimate
    sheet = catalog.cost_sheet
    problems = []
    if est.model_calls > sheet.max_model_calls:
        problems.append(f"{est.model_calls} model calls > cap {sheet.max_model_calls}")
    if est.total_usd > sheet.max_total_usd:
        problems.append(f"${est.total_usd:.2f} > budget ${sheet.max_total_usd:.2f}")
    status = "fail" if problems else "pass"
    return CheckResult(
        check="budget",
        status=status,
        detail="; ".join(problems) or f"within budget ({est.model_calls} calls, ${est.total_usd:.2f})",
    )


# ---------------------------------------------------------------------------
# aggregation
# ---------------------------------------------------------------------------

CHECKS = [
    check_source_accuracy,
    check_spoiler,
    check_rights,
    check_rating,
    check_story_truth,
    check_cultural,
    check_accessibility,
]


def run_all(plan: TrailerPlan, catalog) -> list[CheckResult]:
    results = [fn(plan, catalog) for fn in CHECKS]
    results.append(check_budget(plan, catalog))
    return results


def overall_status(checks: list[CheckResult]) -> str:
    if any(c.status == "fail" for c in checks):
        return "FAIL"
    if any(c.status == "warn" for c in checks):
        return "PASS_WITH_WARNINGS"
    return "PASS"
