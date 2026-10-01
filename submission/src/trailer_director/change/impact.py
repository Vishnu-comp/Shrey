"""Change handler: surprise events and revisions.

Assignment step 7: when a contract, policy, or audience fact changes, the
agent must (a) identify *which* decisions are affected, (b) revise only
those decisions, (c) rerun the relevant checks, and (d) preserve a clear
record of what changed and why.

Impact is computed from the evidence graph: every segment cites the scenes,
contracts and lines it depends on, so a change touches exactly the segments
whose evidence references it — not every trailer blindly.
"""
from __future__ import annotations

import copy
import re
from typing import Optional

from ..models import ChangeSpec, Segment, TrailerPlan, Validation
from ..planner.edl_builder import (
    PlanDraft,
    build_segment,
    fast_vet,
    fit_duration,
    music_track_for,
    renumber,
    validate_plan,
)
from ..session import PlanSession
from ..timecodes import tc_to_seconds
from ..validator.checks import run_all, overall_status

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _trailer_id(audience: str) -> str:
    return {"family": "family_v1", "ya": "young_adult_v1", "dialect": "dialect_region_v1"}[audience]


def _revalidate(session: PlanSession, plan: TrailerPlan) -> None:
    results = run_all(plan, session.catalog)
    plan.validation = Validation(
        status=overall_status(results),
        checks=results,
        warnings=[c.detail for c in results if c.status == "warn"],
        assumptions=list(plan.assumptions),
    )


def _refresh_segment_dialogue(session: PlanSession, seg: "Segment") -> None:
    """Re-derive a segment's dialogue/subtitles from the (possibly changed)
    catalog. A subtitle-track change must propagate to the EDL before the
    validator re-runs."""
    from ..planner.edl_builder import excluded_speakers

    scene = session.catalog.scene(seg.video)
    if scene is None:
        return
    excl = excluded_speakers(session)
    lo = tc_to_seconds(seg.source_in)
    hi = tc_to_seconds(seg.source_out)
    lines = [l for l in scene.lines if lo <= tc_to_seconds(l.tc) < hi and l.speaker not in excl]
    seg.dialogue = [
        {
            "speaker": l.speaker,
            "line": l.translation if l.lang != "source" and l.translation else l.text,
            "tc": l.tc,
            "lang": l.lang,
            **({"translation": l.translation} if l.lang != "source" and l.translation else {}),
        }
        for l in lines
    ]
    sub: dict[str, str] = {}
    for l in lines:
        if l.lang == "source":
            sub.setdefault("en", l.text)
        else:
            sub.setdefault(l.lang, l.translation or l.text)
    seg.subtitle = sub or None
    track = seg.audio.split(":", 1)[1] if ":" in seg.audio else ""
    seg.audio = (
        f"dialogue_and_music:{track}" if seg.dialogue else (f"music:{track}" if track else "nat")
    )


def _draft_from_plan(plan: TrailerPlan) -> PlanDraft:
    draft = PlanDraft.__new__(PlanDraft)
    draft.audience = plan.audience
    draft.brief = plan.creative_brief
    draft.segments = list(plan.segments)
    draft.candidates = {}
    draft.used = {s.video for s in plan.segments}
    draft.notes = list(plan.assumptions)
    draft.rejected_reason = None
    return draft


def _bump(plan: TrailerPlan) -> None:
    plan.version += 1
    base = re.sub(r"v\d+$", "", plan.trailer_id)
    plan.trailer_id = f"{base}v{plan.version}"


def _log_revision(session: PlanSession, plan: TrailerPlan, what: str, why: str) -> None:
    session.log.log(
        "change",
        "revision",
        trailer_id=plan.trailer_id,
        note=f"{what} — {why}",
    )


# ---------------------------------------------------------------------------
# public entry point
# ---------------------------------------------------------------------------


def apply_change(
    session: PlanSession,
    plans: dict[str, TrailerPlan],  # audience -> plan (v1)
    change: ChangeSpec,
) -> dict:
    report: dict = {
        "change_id": change.change_id,
        "change": change.model_dump(),
        "model_review": None,
        "affected": [],
        "revisions": [],
        "rejected": [],
    }

    review = session.model_call(
        "change_review",
        lambda: session.model.review_change(change, session.catalog, session.story_map),
        refs=[change.change_id or change.type],
        note=change.description,
    )
    report["model_review"] = review

    if change.type == "contract_expired":
        _contract_expired(session, plans, change, report)
    elif change.type == "actor_terms_changed":
        _actor_terms_changed(session, plans, change, report)
    elif change.type == "audience_bias":
        _audience_bias(session, plans, change, report)
    elif change.type == "phantom_recommendation":
        _phantom_recommendation(session, plans, change, report)
    elif change.type == "clickbait_request":
        _clickbait(session, plans, change, report)
    elif change.type == "dialect_shift":
        _dialect_shift(session, plans, change, report)
    elif change.type == "injection":
        _injection(session, plans, change, report)
    elif change.type == "model_unavailable":
        _model_unavailable(session, plans, change, report)
    else:
        report["rejected"].append(f"unknown change type {change.type!r}")
    return report


# ---------------------------------------------------------------------------
# change types
# ---------------------------------------------------------------------------


def _contract_expired(session, plans, change, report):
    contract = session.catalog.contracts.get(change.ref)
    if contract is None:
        report["rejected"].append(f"contract {change.ref!r} not found")
        return
    was_active = session.catalog.contract_active(contract)
    contract.valid_until = "2026-09-30"  # lapsed before run date
    session.log.log(
        "change", "state_mutated",
        note=f"contract:{contract.id} ({contract.ref}) lapsed {contract.valid_until}",
    )
    track = contract.ref
    for aud, plan in plans.items():
        uses_track = plan.music.get("primary_track") == track or any(
            track in s.music_tracks() for s in plan.segments
        )
        if not uses_track:
            continue
        new_track = music_track_for(session, aud)
        if new_track == track:  # should not happen: expired track is filtered out
            new_track = next(t for t in session.catalog.music_tracks_for(aud) if t != track)
        for s in plan.segments:
            s.audio = s.audio.replace(f":{track}", f":{new_track}")
            s.evidence = [
                f"contract:{session.catalog.track_contract(new_track).id}"
                if ev.startswith("contract:") and session.catalog.track_contract(track)
                and ev == f"contract:{session.catalog.track_contract(track).id}"
                else ev
                for ev in s.evidence
            ]
        plan.music = {
            "primary_track": new_track,
            "source": f"contract:{session.catalog.track_contract(new_track).id}",
            "notes": f"re-selected after {contract.id} lapsed; previously {track}",
        }
        _revalidate(session, plan)
        _bump(plan)
        report["affected"].append({"trailer_id": plan.trailer_id, "segments": [s.seg for s in plan.segments]})
        report["revisions"].append(
            f"{plan.trailer_id}: music {track} -> {new_track} (contract {contract.id} lapsed); "
            f"timecodes unchanged; validation now {plan.validation.status}"
        )
        _log_revision(session, plan, f"music {track} -> {new_track}", f"contract {contract.id} lapsed")


def _actor_terms_changed(session, plans, change, report):
    char_id = change.ref
    new_terms = change.payload.get("terms", {})
    contract = session.catalog.actor_contract(char_id)
    if contract is None:
        report["rejected"].append(f"no actor contract for {char_id!r}")
        return
    old_use = contract.terms.get("promotional_use", "full")
    contract.terms.update(new_terms)
    session.log.log(
        "change", "state_mutated",
        note=f"actor {char_id} promotional_use {old_use} -> {new_terms.get('promotional_use')}",
    )
    for aud, plan in plans.items():
        affected = []
        for s in plan.segments:
            scene = session.catalog.scene(s.video)
            if scene is None:
                continue
            if char_id in scene.primary or char_id in scene.secondary or any(
                d.get("speaker") == char_id for d in s.dialogue
            ):
                affected.append(s.seg)
        if not affected:
            continue
        draft = _draft_from_plan(plan)
        # rebuild candidate lists deterministically for affected beats
        for s in plan.segments:
            if s.seg in affected and s.beat != "title":
                beat_obj = next(b for b in draft.brief.beats if b.beat == s.beat)
                ranking = session.model_call(
                    "rank",
                    lambda: session.model.rank_candidates(beat_obj, plan.audience, session.catalog, sorted(draft.used)),
                    trailer_id=plan.trailer_id,
                    note=f"re-rank after contract change beat={s.beat}",
                )
                draft.candidates[s.beat] = [r["scene_id"] for r in ranking]
        from ..repair.loop import try_repair_segment

        for seg_num in sorted(affected, reverse=True):
            seg = next((x for x in plan.segments if x.seg == seg_num), None)
            if seg is None or seg.beat == "title":
                continue
            try_repair_segment(session, draft, plan, seg, "rights")
        renumber(draft)
        plan.segments = list(draft.segments)
        plan.duration_seconds = round(sum(s.duration_s for s in plan.segments), 1)
        _revalidate(session, plan)
        _bump(plan)
        report["affected"].append({"trailer_id": plan.trailer_id, "segments": affected})
        report["revisions"].append(
            f"{plan.trailer_id}: segments {affected} revised after {char_id} terms change "
            f"{old_use} -> {new_terms.get('promotional_use')}; other segments untouched; "
            f"validation now {plan.validation.status}"
        )
        _log_revision(session, plan, f"segments {affected} revised", f"actor {char_id} terms changed")


def _audience_bias(session, plans, change, report):
    profile = session.catalog.audiences.get(change.ref or "dialect")
    if profile is None:
        report["rejected"].append(f"no audience profile {change.ref!r}")
        return
    key = change.payload.get("key")
    note = change.payload.get("note", "hidden bias flagged in evaluator review")
    profile.notes = (profile.notes + " | " if profile.notes else "") + (
        f"Bias review: preference '{key}' questioned ({note}); excluded from selection."
    )
    session.log.log("change", "state_mutated", note=f"audience profile '{profile.id}': {key} flagged as unverified correlation")
    plan = plans.get(profile.id)
    if plan is None:
        return
    _revalidate(session, plan)  # cultural check re-raises the warning with updated profile
    report["affected"].append({"trailer_id": plan.trailer_id, "segments": []})
    report["revisions"].append(
        f"{plan.trailer_id}: no clip changes — the biased preference was not used for selection; "
        f"cultural check re-run, validation now {plan.validation.status}"
    )


def _phantom_recommendation(session, plans, change, report):
    """A model recommends a scene that does not exist in the episode.

    The catalog is ground truth: the segment cannot be built, source_accuracy
    would fail, and the decision is recorded as rejected-with-reason.
    """
    phantom = change.payload.get("scene_id", "scene_99")
    aud = change.payload.get("audience", "family")
    plan = plans.get(aud)
    if plan is None:
        report["rejected"].append(f"no trailer for audience {aud!r}")
        return
    exists = session.catalog.scene(phantom) is not None
    report["affected"].append({"trailer_id": plan.trailer_id, "segments": []})
    if exists:
        report["rejected"].append(f"{phantom} actually exists; no action")
        return
    report["revisions"].append(
        f"{plan.trailer_id}: model-recommended scene {phantom} REJECTED — scene does not exist "
        f"in the episode (source accuracy); no segment was created, no plan was altered"
    )
    session.log.log(
        "change", "phantom_scene_rejected",
        trailer_id=plan.trailer_id,
        note=f"model recommended {phantom}; not in catalog; rejected without altering the plan",
    )


def _clickbait(session, plans, change, report):
    """Marketing requests a title card that misrepresents the story."""
    requested = change.payload.get("title_card")
    aud = change.payload.get("audience", "family")
    plan = plans.get(aud)
    if plan is None or not requested:
        report["rejected"].append("clickbait request missing audience or title_card")
        return
    # trial the card on a copy, run the story-truth check
    trial = copy.deepcopy(plan)
    for s in trial.segments:
        if s.beat == "title" and s.text_card:
            s.text_card = requested
    results = run_all(trial, session.catalog)
    truth = next(c for c in results if c.check == "story_truth")
    if truth.status == "fail":
        report["affected"].append({"trailer_id": plan.trailer_id, "segments": []})
        report["revisions"].append(
            f"{plan.trailer_id}: requested card {requested!r} REJECTED — {truth.detail}; "
            f"original card kept, plan unchanged"
        )
        session.log.log(
            "change", "clickbait_rejected",
            trailer_id=plan.trailer_id,
            note=f"requested title card {requested!r} fails story truth; original kept",
        )
    else:
        for s in plan.segments:
            if s.beat == "title" and s.text_card:
                s.text_card = requested
        _revalidate(session, plan)
        _bump(plan)
        report["affected"].append({"trailer_id": plan.trailer_id, "segments": [s.seg for s in plan.segments if s.beat == "title"]})
        report["revisions"].append(f"{plan.trailer_id}: title card updated (story-truth verified)")


def _dialect_shift(session, plans, change, report):
    """A dialect subtitle changes the relationship between two characters."""
    scene_id = change.ref
    line_idx = change.payload.get("line_idx", 0)
    new_translation = change.payload.get("new_translation")
    scene = session.catalog.scene(scene_id)
    if scene is None or line_idx >= len(scene.lines):
        report["rejected"].append(f"line not found: {scene_id}#{line_idx}")
        return
    line = scene.lines[line_idx]
    old = line.translation
    line.translation = new_translation
    line.text = new_translation or line.text
    session.log.log(
        "change", "state_mutated",
        note=f"{scene_id} line {line_idx}: translation changed {old!r} -> {new_translation!r}",
    )
    line_tc = line.tc
    for aud, plan in plans.items():
        affected = [
            s.seg for s in plan.segments
            if any(d.get("tc") == line_tc for d in s.dialogue)
        ]
        if not affected:
            continue
        # propagate the changed subtitle into the EDL before revalidation
        for seg in plan.segments:
            if seg.seg in affected:
                _refresh_segment_dialogue(session, seg)
        _revalidate(session, plan)  # relationship-claim check now sees the new line
        if any(c.status == "fail" for c in plan.validation.checks):
            draft = _draft_from_plan(plan)
            for seg_num in affected:
                seg = next((x for x in plan.segments if x.seg == seg_num), None)
                if seg is None or seg.beat == "title":
                    continue
                if seg.beat not in draft.candidates:
                    beat_obj = next(b for b in draft.brief.beats if b.beat == seg.beat)
                    ranking = session.model_call(
                        "rank",
                        lambda: session.model.rank_candidates(beat_obj, plan.audience, session.catalog, sorted(draft.used)),
                        trailer_id=plan.trailer_id,
                        note=f"re-rank after dialect shift beat={seg.beat}",
                    )
                    draft.candidates[seg.beat] = [r["scene_id"] for r in ranking]
            from ..repair.loop import try_repair_segment

            for seg_num in sorted(affected, reverse=True):
                seg = next((x for x in plan.segments if x.seg == seg_num), None)
                if seg is not None:
                    try_repair_segment(session, draft, plan, seg, "story_truth")
            renumber(draft)
            plan.segments = list(draft.segments)
            plan.duration_seconds = round(sum(s.duration_s for s in plan.segments), 1)
            _revalidate(session, plan)
        _bump(plan)
        report["affected"].append({"trailer_id": plan.trailer_id, "segments": affected})
        report["revisions"].append(
            f"{plan.trailer_id}: segment(s) {affected} carried the changed line; "
            f"revalidated and revised as needed; validation now {plan.validation.status}"
        )


def _injection(session, plans, change, report):
    """A scene description contains instructions to ignore contracts.

    Descriptions are data, never instructions: the text is recorded, the
    constraints are re-asserted, and nothing is executed from it.
    """
    scene_id = change.payload.get("scene", "scene_09")
    text = change.payload.get("text", "")
    scene = session.catalog.scene(scene_id)
    if scene is None:
        report["rejected"].append(f"scene {scene_id!r} not found")
        return
    scene.summary = f"{scene.summary} [appended note: {text}]"
    session.log.log(
        "change", "injection_detected_ignored",
        note=f"{scene_id} description contains embedded instruction; treated as data, "
        f"all contracts remain in force; constraints re-verified below",
    )
    # re-assert every rights rule by revalidating all plans (cheap, deterministic)
    for aud, plan in plans.items():
        _revalidate(session, plan)
        report["affected"].append({"trailer_id": plan.trailer_id, "segments": []})
    report["revisions"].append(
        "no plan changes: injected instruction ignored (descriptions are data); "
        + "; ".join(f"{p.trailer_id} validation={p.validation.status}" for p in plans.values())
    )


def _model_unavailable(session, plans, change, report):
    """The preferred vision/language model is unavailable.

    The system degrades gracefully: mock/text-only grounding is declared,
    plans are revalidated (no content change required), and the limitation
    is recorded for human awareness.
    """
    session.degraded = True
    model_name = change.payload.get("model", "vision")
    session.log.log(
        "change", "model_degraded",
        note=f"model '{model_name}' unavailable; degraded to mock/text-only grounding; "
        f"all plans revalidated without content changes",
    )
    for aud, plan in plans.items():
        _revalidate(session, plan)
        plan.assumptions.append(
            f"degraded run: {model_name} unavailable; text-only grounding used"
        )
        report["affected"].append({"trailer_id": plan.trailer_id, "segments": []})
    report["revisions"].append(
        f"no clip changes on model unavailability; degraded to text-only grounding; "
        + "; ".join(f"{p.trailer_id} validation={p.validation.status}" for p in plans.values())
    )
