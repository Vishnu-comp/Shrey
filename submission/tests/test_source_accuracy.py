"""REQUIRED: missing-scene test.

Every proposed scene and timecode must exist in the supplied episode.
"""
from __future__ import annotations

from trailer_director.models import CostEstimate, Segment, TrailerPlan
from trailer_director.validator.checks import check_source_accuracy, run_all, overall_status

from conftest import run_and_apply


def test_base_run_has_no_phantom_scenes(plans, catalog):
    for plan in plans.values():
        for seg in plan.segments:
            assert catalog.scene(seg.video) is not None, f"{plan.trailer_id} seg{seg.seg}: {seg.video} does not exist"
            assert catalog.tc_in_scene(seg.video, seg.source_in)
            assert catalog.tc_in_scene(seg.video, seg.source_out)
            for ev in seg.evidence:
                assert catalog.resolve_evidence(ev), f"evidence {ev} does not resolve"


def test_unknown_scene_fails_check(catalog):
    seg = Segment(
        seg=1, beat="hook", source_in="00:05.000", source_out="00:10.000",
        video="scene_99", audio="nat", reason="test", evidence=["scene:99"],
    )
    plan = TrailerPlan(
        trailer_id="t", audience="family", duration_seconds=5, audience_promise="",
        creative_brief=plans_brief(), music={}, segments=[seg],
        cost_estimate=CostEstimate(),
    )
    result = check_source_accuracy(plan, catalog)
    assert result.status == "fail"
    assert "scene_99" in result.detail


def test_timecode_outside_scene_bounds_fails(catalog):
    # scene_05 real bounds: 01:47.000 - 02:19.000
    seg = Segment(
        seg=1, beat="stakes", source_in="01:48.000", source_out="02:30.000",
        video="scene_05", audio="nat", reason="test", evidence=["scene:05"],
    )
    plan = TrailerPlan(
        trailer_id="t", audience="family", duration_seconds=42, audience_promise="",
        creative_brief=plans_brief(), music={}, segments=[seg],
        cost_estimate=CostEstimate(),
    )
    assert check_source_accuracy(plan, catalog).status == "fail"


def test_phantom_recommendation_rejected_in_change(episode_dir, tmp_path):
    change = {
        "change_id": "t-phantom", "type": "phantom_recommendation", "ref": None,
        "payload": {"scene_id": "scene_26", "audience": "family"},
        "description": "model recommends a scene that does not exist",
    }
    report, plans, session = run_and_apply(episode_dir, tmp_path, change)
    family = plans["family"]
    # the plan is untouched and still valid
    assert family.version == 1
    assert family.validation.status in ("PASS", "PASS_WITH_WARNINGS")
    assert all(s.video != "scene_26" for s in family.segments)
    # the rejection is recorded
    assert any("REJECTED" in r for r in report["revisions"])
    assert any(
        "phantom_scene_rejected" in (e.action or "") for e in session.log.entries
    )


def plans_brief():
    from trailer_director.models import CreativeBrief

    return CreativeBrief(
        audience="family", objective="", promise="", positioning="", beats=[], target_duration_s=0
    )
