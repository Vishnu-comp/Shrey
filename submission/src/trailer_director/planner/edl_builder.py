"""EDL builder: promise -> candidate retrieval -> segments -> trailer plan.

Creative generation. The validator (separate module, separate concerns)
re-checks everything afterwards; the pre-vet here is only an optimization.
"""
from __future__ import annotations

from typing import Optional

from ..models import (
    BeatPlan,
    CostEstimate,
    FallbackPlan,
    HumanApproval,
    Segment,
    TrailerPlan,
    Validation,
)
from ..session import BudgetExhausted, PlanSession
from ..timecodes import seconds_to_tc, tc_to_seconds
from ..validator.checks import (
    check_accessibility,
    check_rating,
    check_rights,
    check_spoiler,
    check_source_accuracy,
    overall_status,
    run_all,
)
from .promise import plan_promise

TRAILER_IDS = {"family": "family_v1", "ya": "young_adult_v1", "dialect": "dialect_region_v1"}
MUSIC_PREF = {"family": "music_01", "ya": "music_02", "dialect": "music_03"}
TITLE_CARDS = {
    "family": "MONSOON HOUSE — Only this season",
    "ya": "MONSOON HOUSE — The arguments are the fun part",
    "dialect": "MONSOON HOUSE — A story told in a familiar voice",
}


class PlanDraft:
    """In-memory working state for one trailer (not the JSON artifact)."""

    def __init__(self, audience: str, brief):
        self.audience = audience
        self.brief = brief
        self.segments: list[Segment] = []
        self.candidates: dict[str, list[str]] = {}  # beat -> ranked scene ids
        self.used: set[str] = set()
        self.notes: list[str] = []
        self.rejected_reason: Optional[str] = None


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def scene_num(scene_id: str) -> str:
    return scene_id.replace("scene_", "")


def excluded_speakers(session: PlanSession) -> set[str]:
    """Characters whose voice may not appear in trailer segments."""
    out = set()
    for char_id in session.catalog.characters:
        c = session.catalog.actor_contract(char_id)
        if c is None:
            continue
        use = c.terms.get("promotional_use", "full")
        if use in ("stills_only", "none"):
            out.add(char_id)
    return out


def music_track_for(session: PlanSession, audience: str) -> str:
    pref = MUSIC_PREF.get(audience)
    available = session.catalog.music_tracks_for(audience)
    if pref in available:
        return pref
    return available[0] if available else ""


def build_segment(
    session: PlanSession,
    draft: PlanDraft,
    beat: BeatPlan,
    scene_id: str,
    n: int,
    track: str,
) -> Optional[Segment]:
    """One model call: pick the timecode window + dialogue for a scene."""
    tr_id = TRAILER_IDS[draft.audience]
    excl = excluded_speakers(session)
    selected = session.model_call(
        "select",
        lambda: session.model.select_segment(beat, scene_id, session.catalog, excl),
        trailer_id=tr_id,
        refs=[f"scene:{scene_num(scene_id)}"],
        note=f"beat={beat.beat}",
    )
    scene = session.catalog.scene(scene_id)
    dialog = [d for d in selected["dialogue"] if d.get("speaker") not in excl]
    # subtitle is rebuilt strictly from the surviving (rights-clean) dialogue
    subtitle = {}
    for d in dialog:
        if d.get("lang") == "source":
            subtitle.setdefault("en", d["line"])
        else:
            subtitle.setdefault(d["lang"], d.get("translation") or d["line"])
    has_dialog = bool(dialog)
    evidence = [f"scene:{scene_num(scene_id)}"]
    for i, d in enumerate(dialog):
        evidence.append(f"dialogue:{scene_id}:{_line_index(session, scene_id, d['tc'])}")
    if track:
        c = session.catalog.track_contract(track)
        if c:
            evidence.append(f"contract:{c.id}")
    risk_flags = sorted(scene.content_flags.keys())
    if "post_reveal" in risk_flags:
        risk_flags = [f"post_reveal:{f}" for f in (session.catalog.central_twist,)]
    seg = Segment(
        seg=n,
        beat=beat.beat,
        source_in=selected["source_in"],
        source_out=selected["source_out"],
        video=scene_id,
        audio=f"dialogue_and_music:{track}" if has_dialog else f"music:{track}",
        dialogue=dialog,
        subtitle=subtitle or None,
        text_card=None,
        transition="dissolve" if scene.emotional_turn else "cut",
        reason=f"{beat.intention} Source: {scene.title} ({scene.in_tc}). {scene.summary}",
        evidence=evidence,
        risk_flags=risk_flags,
    )
    return seg


def _line_index(session: PlanSession, scene_id: str, tc: str) -> int:
    scene = session.catalog.scenes[scene_id]
    for i, l in enumerate(scene.lines):
        if l.tc == tc:
            return i
    return 0


def fast_vet(session: PlanSession, draft: PlanDraft, seg: Segment) -> tuple[bool, str]:
    """Quick pre-check of a single segment (source/spoiler/rights/rating/access)."""
    mini = TrailerPlan(
        trailer_id="vet",
        audience=draft.audience,
        duration_seconds=seg.duration_s,
        audience_promise="",
        creative_brief=draft.brief,
        music={},
        segments=[seg],
        cost_estimate=CostEstimate(),
    )
    results = [
        check_source_accuracy(mini, session.catalog),
        check_spoiler(mini, session.catalog),
        check_rights(mini, session.catalog),
        check_rating(mini, session.catalog),
        check_accessibility(mini, session.catalog),
    ]
    fails = [r for r in results if r.status == "fail"]
    if fails:
        return False, "; ".join(f.check + ": " + f.detail for f in fails)
    return True, ""


def title_segment(session: PlanSession, draft: PlanDraft, n: int, track: str) -> Segment:
    """Dawn title card from the closing atmospheric scene."""
    scenes = [
        s for s in session.catalog.scenes.values() if "atmospheric" in s.mood
    ]
    scene = max(scenes, key=lambda s: tc_to_seconds(s.out_tc))
    lo, hi = tc_to_seconds(scene.in_tc), tc_to_seconds(scene.out_tc)
    beat = draft.brief.beats[-1]
    vo = None
    if draft.audience == "family":
        line = next((l for l in scene.lines if l.lang == "source"), None)
        if line:
            start = max(lo, tc_to_seconds(line.tc) - 2)
            vo = {"speaker": line.speaker, "line": line.text, "scene": scene.scene_id, "tc": line.tc}
    else:
        start = max(lo, hi - beat.target_s)
    end = min(hi, start + beat.target_s)
    dialog = [
        {"speaker": l.speaker, "line": l.text, "tc": l.tc, "lang": l.lang}
        for l in scene.lines
        if tc_to_seconds(l.tc) >= start and tc_to_seconds(l.tc) < end
    ]
    subtitle = {
        l.lang: (l.translation or l.text) for l in scene.lines
        if tc_to_seconds(l.tc) >= start and tc_to_seconds(l.tc) < end
    }
    evidence = [f"scene:{scene_num(scene.scene_id)}"]
    if track:
        c = session.catalog.track_contract(track)
        if c:
            evidence.append(f"contract:{c.id}")
    return Segment(
        seg=n,
        beat="title",
        source_in=seconds_to_tc(start),
        source_out=seconds_to_tc(end),
        video=scene.scene_id,
        audio=f"dialogue_and_music:{track}" if dialog else f"music:{track}",
        dialogue=dialog,
        subtitle=subtitle or None,
        text_card=TITLE_CARDS[draft.audience],
        transition="fade",
        vo=vo,
        reason=f"{beat.intention} Source: {scene.title} ({scene.in_tc}). {scene.summary}",
        evidence=evidence,
        risk_flags=[],
    )


def fit_duration(session: PlanSession, draft: PlanDraft) -> None:
    """Trim/extend windows (always inside real scene bounds) to hit target +/- tol."""
    target = draft.brief.target_duration_s
    tol = session.cfg.duration_tolerance
    total = sum(s.duration_s for s in draft.segments)
    guard = 0
    while total > target * (1 + tol) and guard < 50:
        guard += 1
        movable = [
            s for s in draft.segments
            if s.beat != "title" and s.duration_s > 4
        ]
        if not movable:
            break
        longest = max(movable, key=lambda s: s.duration_s)
        scene = session.catalog.scenes[longest.video]
        new_dur = max(3.0, min(longest.duration_s - 3.0, draft.brief.beats[
            next(bi for bi, b in enumerate(draft.brief.beats) if b.beat == longest.beat)
        ].target_s))
        _adjust(session, draft, longest, scene, new_dur, extend=False)
        total = sum(s.duration_s for s in draft.segments)
    guard = 0
    while total < target * (1 - tol) and guard < 50:
        guard += 1
        movable = [s for s in draft.segments if s.beat != "title"]
        grew = False
        for s in sorted(movable, key=lambda s: -s.duration_s):
            if total >= target * (1 - tol):
                break
            scene = session.catalog.scenes[s.video]
            beat = next(b for b in draft.brief.beats if b.beat == s.beat)
            if s.duration_s < beat.max_duration_s:
                _adjust(session, draft, s, scene, beat.max_duration_s, extend=True)
                total = sum(x.duration_s for x in draft.segments)
                grew = True
        if not grew:
            break


def _adjust(session: PlanSession, draft: PlanDraft, seg: Segment, scene, new_dur: float, extend: bool) -> None:
    lo = tc_to_seconds(scene.in_tc)
    hi = tc_to_seconds(scene.out_tc)
    si = tc_to_seconds(seg.source_in)
    so = tc_to_seconds(seg.source_out)
    if extend:
        so = min(hi, si + new_dur)
    else:
        so = min(hi, so)
        si = max(lo, so - new_dur)
    if so - si < 2.5:
        si = max(lo, hi - 3.0)
        so = hi
    seg.source_in = seconds_to_tc(si)
    seg.source_out = seconds_to_tc(so)
    seg.duration_s = round(tc_to_seconds(seg.source_out) - tc_to_seconds(seg.source_in), 3)
    # refresh dialogue + subtitle for the new window
    lines = [
        l for l in scene.lines if si <= tc_to_seconds(l.tc) < so
        if l.speaker not in excluded_speakers(session)
    ]
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


def renumber(draft: PlanDraft) -> None:
    for i, s in enumerate(draft.segments):
        s.seg = i + 1


def assemble_plan(session: PlanSession, draft: PlanDraft, track: str) -> TrailerPlan:
    tr_id = TRAILER_IDS[draft.audience]
    media_share = session.catalog.cost_sheet.media_processing_flat_usd / max(1, len(session.cfg.audiences))
    cost = session.cost_for_trailer(tr_id, media_share)
    sheet = session.catalog.cost_sheet
    track_contract = session.catalog.track_contract(track)
    plan = TrailerPlan(
        trailer_id=tr_id,
        audience=draft.audience,
        duration_seconds=round(sum(s.duration_s for s in draft.segments), 1),
        audience_promise=draft.brief.promise,
        creative_brief=draft.brief,
        music={
            "primary_track": track,
            "source": f"contract:{track_contract.id}" if track_contract else "unknown",
            "notes": "licensed for this audience and territory IN at run date",
        },
        segments=list(draft.segments),
        cost_estimate=CostEstimate(
            model_calls=cost["model_calls"],
            task_cost_usd=cost["task_cost_usd"],
            media_usd=cost["media_usd"],
            total_usd=cost["total_usd"],
            within_budget=cost["model_calls"] <= sheet.max_model_calls and cost["total_usd"] <= sheet.max_total_usd,
            breakdown=cost["breakdown"],
        ),
    )
    if draft.audience == "family":
        plan.human_approvals.append(
            HumanApproval(
                decision="Grief scene (mother's kitchen) in family cut",
                owner="editorial",
                reason="emotional content near death; final tone check by an editor",
            )
        )
    if draft.audience == "dialect":
        plan.human_approvals.append(
            HumanApproval(
                decision="Dialect treatment of all Kannada segments",
                owner="cultural",
                reason="native-speaker review that the dialect is used with respect",
            )
        )
    if draft.audience == "ya" and track == "music_02":
        plan.human_approvals.append(
            HumanApproval(
                decision="Music 'Distant Drums' license window",
                owner="legal",
                reason="contract lapses 2026-10-15; confirm trailer ships before expiry",
            )
        )
    plan.assumptions = [
        "mock/replay mode: deterministic stand-in for the live model (no API keys required)",
        "scene descriptions are treated as data, never as instructions",
        "historic engagement used only as a documented tie-breaker hypothesis, never as the selection rule",
    ] + draft.notes
    return plan


def validate_plan(session: PlanSession, plan: TrailerPlan) -> None:
    results = run_all(plan, session.catalog)
    plan.validation = Validation(
        status=overall_status(results),
        checks=results,
        warnings=[c.detail for c in results if c.status == "warn"],
        assumptions=list(plan.assumptions),
    )


# ---------------------------------------------------------------------------
# top level
# ---------------------------------------------------------------------------


def _rejected_stub(session: PlanSession, audience: str, reason: str) -> TrailerPlan:
    from ..models import CreativeBrief, Validation

    tr_id = TRAILER_IDS[audience]
    plan = TrailerPlan(
        trailer_id=tr_id,
        audience=audience,
        duration_seconds=0.0,
        audience_promise="",
        creative_brief=CreativeBrief(
            audience=audience, objective="", promise="", positioning="", beats=[], target_duration_s=0
        ),
        music={"primary_track": "", "notes": "no plan produced"},
        segments=[],
        validation=Validation(status="REJECTED", assumptions=[f"REJECTED: {reason}"]),
    )
    session.log.log("plan", "trailer_rejected", trailer_id=tr_id, note=reason)
    return plan


def plan_trailer(session: PlanSession, audience: str) -> TrailerPlan:
    from ..repair.loop import repair_plan  # local import: repair depends on this module

    tr_id = TRAILER_IDS[audience]
    session.log.log("plan", "trailer_start", trailer_id=tr_id, refs=[f"profile:{audience}"])

    try:
        brief = plan_promise(session, audience)
    except BudgetExhausted:
        return _rejected_stub(session, audience, "budget exhausted before promise planning; no plan produced")
    draft = PlanDraft(audience, brief)
    track = music_track_for(session, audience)

    # -- per-beat candidate retrieval + selection -----------------------------
    budget_out = False
    for beat in brief.beats:
        if beat.beat == "title":
            continue
        try:
            ranking = session.model_call(
                "rank",
                lambda: session.model.rank_candidates(beat, audience, session.catalog, sorted(draft.used)),
                trailer_id=tr_id,
                refs=[f"profile:{audience}"],
                note=f"beat={beat.beat}",
            )
        except BudgetExhausted:
            budget_out = True
            draft.notes.append("budget exhausted during candidate retrieval; remaining beats dropped")
            session.log.log("plan", "budget_exhausted", trailer_id=tr_id, note=f"stopping at beat={beat.beat}")
            break
        draft.candidates[beat.beat] = [r["scene_id"] for r in ranking]
        session.log.log(
            "plan",
            "candidates_ranked",
            trailer_id=tr_id,
            note=f"beat={beat.beat} top3={draft.candidates[beat.beat][:3]}",
        )
        chosen, vet_note = None, ""
        for cand in ranking:
            sid = cand["scene_id"]
            if sid in draft.used:
                continue
            try:
                seg = build_segment(session, draft, beat, sid, len(draft.segments) + 1, track)
            except BudgetExhausted:
                budget_out = True
                break
            ok, why = fast_vet(session, draft, seg)
            if ok:
                chosen = seg
                draft.used.add(sid)
                break
            vet_note = why
            session.log.log(
                "plan", "vet_rejected", trailer_id=tr_id,
                refs=[f"scene:{scene_num(sid)}"],
                note=f"beat={beat.beat} {sid} rejected: {why}",
            )
        if budget_out:
            break
        if chosen is None:
            draft.notes.append(f"beat '{beat.beat}' dropped — no candidate passed verification ({vet_note})")
            session.log.log("plan", "beat_dropped", trailer_id=tr_id, note=f"beat={beat.beat}: {vet_note}")
            continue
        draft.segments.append(chosen)

    if budget_out and len([s for s in draft.segments if s.beat != "title"]) >= session.cfg.min_beats_to_ship:
        draft.notes.append("shipped at reduced scope: budget cap reached before all beats were planned")
    if len(draft.segments) < session.cfg.min_beats_to_ship:
        draft.rejected_reason = (
            f"only {len(draft.segments)} beats survived verification; "
            f"minimum is {session.cfg.min_beats_to_ship}"
        )

    draft.segments.append(title_segment(session, draft, len(draft.segments) + 1, track))
    renumber(draft)
    fit_duration(session, draft)
    renumber(draft)

    plan = assemble_plan(session, draft, track)
    validate_plan(session, plan)

    # -- verification loop: repair, or reject — never force through -----------
    if plan.validation.status == "FAIL":
        try:
            plan = repair_plan(session, draft, plan)
        except BudgetExhausted:
            plan.validation.status = "REJECTED"
            plan.validation.assumptions.append("REJECTED: budget exhausted during repair")
            session.log.log(
                "repair", "trailer_rejected", trailer_id=plan.trailer_id,
                note="budget exhausted during repair; unresolved failures remain",
            )

    # -- low-cost fallback plan -------------------------------------------------
    try:
        plan.fallback_plan = build_fallback(session, draft, track)
    except BudgetExhausted:
        plan.fallback_plan = None
        plan.assumptions.append("fallback plan not produced: budget cap reached")

    session.log.log(
        "plan",
        "trailer_complete",
        trailer_id=tr_id,
        note=f"status={plan.validation.status} segments={len(plan.segments)} "
        f"duration={plan.duration_seconds}s",
    )
    return plan


def build_fallback(session: PlanSession, draft: PlanDraft, track: str) -> FallbackPlan:
    """Lean re-plan: cached top-1 candidates, no re-ranking, single pass.

    Demonstrates the budget fallback the brief requires: if the main plan
    is over budget, this cheaper plan can ship.
    """
    tr_id = TRAILER_IDS[draft.audience]
    sheet = session.catalog.cost_sheet
    fallback_segs: list[Segment] = []
    used: set[str] = set()
    n_calls_before = session.log.calls()
    cost_before = session.log.cost_total()
    for beat in draft.brief.beats:
        if beat.beat == "title":
            continue
        cands = [c for c in draft.candidates.get(beat.beat, []) if c not in used]
        if not cands:
            continue
        sid = cands[0]
        excl = excluded_speakers(session)

        def _sel(b=beat, s=sid):
            return session.model.select_segment(b, s, session.catalog, excl)

        session.log.log(
            phase="model",
            action="call:fallback:select",
            trailer_id=tr_id,
            task="fallback:select",
            model=session.model.name,
            refs=[f"scene:{scene_num(sid)}"],
            cost_usd=sheet.task_costs_usd.get("select", 0.002),
            note=f"fallback beat={beat.beat}",
        )
        selected = _sel()
        scene = session.catalog.scenes[sid]
        dialog = [
            {
                "speaker": l.speaker,
                "line": l.translation if l.lang != "source" and l.translation else l.text,
                "tc": l.tc,
                "lang": l.lang,
            }
            for l in scene.lines
            if tc_to_seconds(selected["source_in"]) <= tc_to_seconds(l.tc) < tc_to_seconds(selected["source_out"])
            if l.speaker not in excl
        ]
        sub: dict[str, str] = {}
        for l in scene.lines:
            if tc_to_seconds(selected["source_in"]) <= tc_to_seconds(l.tc) < tc_to_seconds(selected["source_out"]):
                if l.speaker in excl:
                    continue
                if l.lang == "source":
                    sub.setdefault("en", l.text)
                else:
                    sub.setdefault(l.lang, l.translation or l.text)
        fallback_segs.append(
            Segment(
                seg=len(fallback_segs) + 1,
                beat=beat.beat,
                source_in=selected["source_in"],
                source_out=selected["source_out"],
                video=sid,
                audio=f"dialogue_and_music:{track}" if dialog else f"music:{track}",
                dialogue=dialog,
                subtitle=sub or None,
                reason=f"{beat.intention} (fallback: cached top-1, no re-ranking)",
                evidence=[f"scene:{scene_num(sid)}"],
            )
        )
        used.add(sid)
    calls = session.log.calls() - n_calls_before
    cost = round(session.log.cost_total() - cost_before, 6)
    return FallbackPlan(
        description=(
            "lower-cost re-plan: reuses cached top-1 candidates, skips re-ranking passes, "
            "no voice-over; usable if the main plan exceeds the configured budget"
        ),
        model_calls=calls,
        total_usd=cost,
        segments=fallback_segs,
    )
