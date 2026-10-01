"""REQUIRED: spoiler test.

Protected story facts are never revealed beyond the audience's teaser level,
even when historic engagement says 'use this scene'.
"""
from __future__ import annotations

from trailer_director.models import CostEstimate, Segment, TrailerPlan
from trailer_director.validator.checks import check_spoiler, run_all, overall_status

REVEAL_AND_POST_REVEAL = {"scene_19", "scene_20", "scene_21", "scene_22"}


def test_reveal_scenes_never_used_in_any_trailer(plans):
    for plan in plans.values():
        used = {seg.video for seg in plan.segments}
        assert used.isdisjoint(REVEAL_AND_POST_REVEAL), (
            f"{plan.trailer_id} uses protected scenes: {used & REVEAL_AND_POST_REVEAL}"
        )


def test_historic_top_performer_is_spoiler_and_not_used(plans, catalog):
    best = max(catalog.history, key=lambda h: h.ctr)
    assert best.scene_id == "scene_21"  # the trap: top CTR scene IS a P1 reveal scene
    for plan in plans.values():
        assert "scene_21" not in {seg.video for seg in plan.segments}, (
            "historic engagement must not override the spoiler rule"
        )


def test_keyword_leak_fails_spoiler_check(catalog):
    """A segment whose dialogue contains a protected keyword fails for teaser-0 audiences."""
    seg = Segment(
        seg=1, beat="mystery", source_in="06:05.000", source_out="06:15.000",
        video="scene_13", audio="nat",
        dialogue=[{"speaker": "c1", "line": "This house was never legally ours.", "tc": "06:08.000", "lang": "source"}],
        reason="test", evidence=["scene:13"],
    )
    plan = TrailerPlan(
        trailer_id="t", audience="family", duration_seconds=10, audience_promise="",
        creative_brief=empty_brief(), music={}, segments=[seg], cost_estimate=CostEstimate(),
    )
    result = check_spoiler(plan, catalog)
    assert result.status == "fail"
    assert "P1" in result.detail


def test_reveal_scene_fails_spoiler_check(catalog):
    seg = Segment(
        seg=1, beat="mystery", source_in="09:20.000", source_out="09:35.000",
        video="scene_19", audio="nat",
        dialogue=[{"speaker": "c1", "line": "My dearest children.", "tc": "09:25.000", "lang": "source"}],
        reason="test", evidence=["scene:19"],
    )
    plan = TrailerPlan(
        trailer_id="t", audience="ya", duration_seconds=15, audience_promise="",
        creative_brief=empty_brief(), music={}, segments=[seg], cost_estimate=CostEstimate(),
    )
    assert check_spoiler(plan, catalog).status == "fail"


def empty_brief():
    from trailer_director.models import CreativeBrief

    return CreativeBrief(
        audience="family", objective="", promise="", positioning="", beats=[], target_duration_s=0
    )
