"""Repair loop: replace unsafe choices, or reject — never force through.

Surgical by design: only segments named by a failing check are revisited,
using the candidate list already ranked for that beat. A trailer that cannot
be made safe is REJECTED with a written explanation; the system never
silences a failing check.
"""
from __future__ import annotations

from typing import Optional

from ..models import Segment, TrailerPlan
from ..planner.edl_builder import (
    TITLE_CARDS,
    build_segment,
    fast_vet,
    fit_duration,
    renumber,
)
from ..session import PlanSession
from ..validator.checks import run_all, overall_status
from ..models import Validation


def _beat_of(draft, beat_name: str):
    return next(b for b in draft.brief.beats if b.beat == beat_name)


def try_repair_segment(
    session: PlanSession, draft, plan: TrailerPlan, seg: Segment, check_name: str
) -> bool:
    """Try ranked alternatives for seg's beat; failing that, drop the segment."""
    beat = _beat_of(draft, seg.beat)
    track = plan.music.get("primary_track", "")
    for cand in draft.candidates.get(beat.beat, []):
        if cand == seg.video:
            continue
        if cand in [s.video for s in draft.segments]:
            continue
        newseg = build_segment(session, draft, beat, cand, seg.seg, track)
        ok, _why = fast_vet(session, draft, newseg)
        if ok:
            idx = draft.segments.index(seg)
            draft.segments[idx] = newseg
            draft.used.discard(seg.video)
            draft.used.add(cand)
            from ..planner.edl_builder import scene_num

            session.log.log(
                "repair",
                "segment_replaced",
                trailer_id=plan.trailer_id,
                refs=[f"scene:{scene_num(cand)}", f"scene:{scene_num(seg.video)}"],
                note=f"seg{seg.seg} {seg.video} -> {cand} (check={check_name})",
            )
            return True
    if seg.beat != "title":
        from ..planner.edl_builder import scene_num

        draft.segments.remove(seg)
        draft.used.discard(seg.video)
        session.log.log(
            "repair",
            "segment_dropped",
            trailer_id=plan.trailer_id,
            refs=[f"scene:{scene_num(seg.video)}"],
            note=f"seg{seg.seg} {seg.video} dropped — no safe alternative (check={check_name})",
        )
        return True
    return False


def repair_plan(session: PlanSession, draft, plan: TrailerPlan) -> TrailerPlan:
    for _round in range(session.cfg.max_repair_rounds):
        failed = [c for c in plan.validation.checks if c.status == "fail"]
        if not failed:
            break
        fixed_any = False

        # --- trailer-level failures (reported at segment 0) ------------------
        for c in failed:
            if 0 not in c.segments:
                continue
            if "promise claims" in c.detail:
                return _reject(session, plan, f"creative promise not supported by any safe cut: {c.detail}")
            if "card text claims" in c.detail:
                for seg in draft.segments:
                    if seg.text_card and "card text claims" in c.detail:
                        old = seg.text_card
                        seg.text_card = TITLE_CARDS[draft.audience]
                        session.log.log(
                            "repair",
                            "card_replaced",
                            trailer_id=plan.trailer_id,
                            note=f"clickbait card {old!r} -> default (check=story_truth)",
                        )
                        fixed_any = True
            if "authentic dialect lines" in c.detail:
                for seg in draft.segments:
                    beat = _beat_of(draft, seg.beat)
                    has_dialect = any(d.get("lang") in ("hi", "kn") for d in seg.dialogue)
                    if beat.needs_dialect_line and not has_dialect:
                        fixed_any |= try_repair_segment(session, draft, plan, seg, "cultural")

        # --- segment-level failures -------------------------------------------
        for c in failed:
            for seg_num in sorted({s for s in c.segments if s > 0}, reverse=True):
                seg = next((s for s in draft.segments if s.seg == seg_num), None)
                if seg is None:
                    continue
                fixed_any |= try_repair_segment(session, draft, plan, seg, c.check)

        if not fixed_any:
            return _reject(
                session,
                plan,
                "verification failed and no safe alternative exists for the failing segments",
            )

        # --- renumber, refit, revalidate --------------------------------------
        renumber(draft)
        fit_duration(session, draft)
        renumber(draft)
        plan.segments = list(draft.segments)
        plan.duration_seconds = round(sum(s.duration_s for s in plan.segments), 1)
        if len([s for s in draft.segments if s.beat != "title"]) < session.cfg.min_beats_to_ship:
            return _reject(
                session,
                plan,
                f"repair reduced the trailer to fewer than {session.cfg.min_beats_to_ship} story beats",
            )
        results = run_all(plan, session.catalog)
        plan.validation = Validation(
            status=overall_status(results),
            checks=results,
            warnings=[c.detail for c in results if c.status == "warn"],
            assumptions=list(plan.assumptions) + [f"repaired after verification round"],
        )
        plan.assumptions.append("repaired after verification round")

    if any(c.status == "fail" for c in plan.validation.checks):
        return _reject(
            session,
            plan,
            "unresolved verification failures after max repair rounds: "
            + "; ".join(c.detail for c in plan.validation.checks if c.status == "fail")[:400],
        )
    return plan


def _reject(session: PlanSession, plan: TrailerPlan, reason: str) -> TrailerPlan:
    plan.validation.status = "REJECTED"
    plan.validation.assumptions.append(f"REJECTED: {reason}")
    session.log.log("repair", "trailer_rejected", trailer_id=plan.trailer_id, note=reason)
    return plan
