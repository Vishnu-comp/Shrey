"""REQUIRED: changed-contract test.

When a contract changes, only affected decisions are revised, relevant checks
rerun, and a clear record is kept.
"""
from __future__ import annotations

from conftest import run_and_apply, segment_signature

CHANGE = {
    "change_id": "t-lakshmi-none", "type": "actor_terms_changed", "ref": "c3",
    "payload": {"terms": {"promotional_use": "none"}},
    "description": "Lakshmi: no promotional use of any kind",
}


def test_affected_segments_revised(episode_dir, tmp_path):
    report, plans, session = run_and_apply(episode_dir, tmp_path, CHANGE)
    family = plans["family"]
    assert family.version == 2
    assert family.validation.status in ("PASS", "PASS_WITH_WARNINGS")

    scenes_v2 = [s.video for s in family.segments]
    # scenes that featured Lakshmi (primary/secondary) must be gone
    for s in family.segments:
        scene = session.catalog.scene(s.video)
        assert "c3" not in scene.primary and "c3" not in scene.secondary, (
            f"segment {s.seg} still uses a scene with Lakshmi in frame"
        )


def test_untouched_segments_keep_timecodes(episode_dir, tmp_path):
    cfg_run_dir = tmp_path
    report, plans, session = run_and_apply(episode_dir, tmp_path, CHANGE)

    # re-run the baseline in the same tmp dir to get v1 signatures
    from conftest import EPISODE_DIR
    from trailer_director.config import RunConfig
    from trailer_director.run import run_pipeline

    baseline = run_pipeline(RunConfig(episode_dir=EPISODE_DIR, out_dir=str(tmp_path / "base")))
    fam1, fam2 = baseline["family"], plans["family"]

    sig1 = {(s.beat, s.video, s.source_in, s.source_out) for s in fam1.segments}
    sig2 = {(s.beat, s.video, s.source_in, s.source_out) for s in fam2.segments}
    changed_beats = {s.beat for s in fam1.segments if (s.beat, s.video) not in {
        (s2.beat, s2.video) for s2 in fam2.segments
    }}
    # beats that survived keep identical cut points
    for s1 in fam1.segments:
        if s1.beat not in changed_beats:
            s2 = next((x for x in fam2.segments if x.beat == s1.beat), None)
            if s2 is not None:
                assert (s1.beat, s1.video, s1.source_in, s1.source_out) in sig2, (
                    f"untouched beat {s1.beat} changed its timecodes"
                )


def test_untouched_audience_unchanged(episode_dir, tmp_path):
    report, plans, session = run_and_apply(episode_dir, tmp_path, CHANGE)
    ya = plans["ya"]
    # YA contains no Lakshmi scenes -> must be untouched
    assert ya.version == 1
    assert "c3" not in {
        a for s in ya.segments for a in (
            session.catalog.scene(s.video).primary + session.catalog.scene(s.video).secondary
        )
    }


def test_change_recorded_in_decision_log(episode_dir, tmp_path):
    report, plans, session = run_and_apply(episode_dir, tmp_path, CHANGE)
    revisions = [e for e in session.log.entries if e.phase == "change" and e.action == "revision"]
    assert revisions, "no revision entries recorded"
    assert any("c3" in (e.note or "") for e in revisions)
    # state mutation is also recorded
    assert any(e.action == "state_mutated" for e in session.log.entries)
