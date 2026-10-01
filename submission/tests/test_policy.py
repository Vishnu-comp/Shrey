"""REQUIRED: policy-failure test.

Rating policies must block unsuitable content per audience.
"""
from __future__ import annotations

from trailer_director.models import CostEstimate, Segment, TrailerPlan
from trailer_director.validator.checks import check_rating


def test_family_trailer_has_no_blocked_content(plans, catalog):
    for plan in [plans["family"]]:
        for seg in plan.segments:
            scene = catalog.scene(seg.video)
            assert scene.content_flags.get("frightening", 0) < 2, f"seg{seg.seg}: frightening content in family cut"
            assert scene.content_flags.get("strong_language", 0) == 0, f"seg{seg.seg}: strong language in family cut"
            assert scene.content_flags.get("twist", 0) == 0, f"seg{seg.seg}: twist content in family cut"
            assert scene.content_flags.get("grief", 0) < 2, f"seg{seg.seg}: sustained grief in family cut"
    # and the check itself passes
    assert plans["family"].validation.check("rating").status == "pass"


def test_frightening_scene_fails_family_rating(catalog):
    seg = Segment(
        seg=1, beat="tension", source_in="03:25.000", source_out="03:40.000",
        video="scene_08", audio="nat", reason="test", evidence=["scene:08"],
    )
    plan = TrailerPlan(
        trailer_id="t", audience="family", duration_seconds=15, audience_promise="",
        creative_brief=empty_brief(), music={}, segments=[seg], cost_estimate=CostEstimate(),
    )
    result = check_rating(plan, catalog)
    assert result.status == "fail"
    assert "family-01" in result.detail


def test_same_scene_allowed_for_young_adult(catalog):
    """frightening=2 is blocked for family but allowed for YA (block at >=3)."""
    seg = Segment(
        seg=1, beat="tension", source_in="03:25.000", source_out="03:40.000",
        video="scene_08", audio="nat", reason="test", evidence=["scene:08"],
    )
    plan = TrailerPlan(
        trailer_id="t", audience="ya", duration_seconds=15, audience_promise="",
        creative_brief=empty_brief(), music={}, segments=[seg], cost_estimate=CostEstimate(),
    )
    assert check_rating(plan, catalog).status == "pass"


def test_policy_failure_repairs_or_rejects(plans):
    """No plan ships in FAIL state: every plan is PASS, PASS_WITH_WARNINGS or REJECTED."""
    for plan in plans.values():
        assert plan.validation.status in ("PASS", "PASS_WITH_WARNINGS", "REJECTED")


def empty_brief():
    from trailer_director.models import CreativeBrief

    return CreativeBrief(
        audience="family", objective="", promise="", positioning="", beats=[], target_duration_s=0
    )
