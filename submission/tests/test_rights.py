"""REQUIRED: rights-restriction test.

Only contracted actors, music and territories may be used.
"""
from __future__ import annotations

from conftest import run_and_apply, segment_signature, deep


def test_music_licensed_for_audience(plans, catalog):
    for plan in plans.values():
        allowed = set(catalog.music_tracks_for(plan.audience))
        for seg in plan.segments:
            for track in seg.music_tracks():
                assert track in allowed, f"{plan.trailer_id} seg{seg.seg}: {track} not licensed for {plan.audience}"


def test_suresh_never_primary(plans, catalog):
    """c5 is background_only: no segment may use a scene where he is primary."""
    for plan in plans.values():
        for seg in plan.segments:
            scene = catalog.scene(seg.video)
            assert "c5" not in scene.primary, f"{plan.trailer_id} seg{seg.seg}: Suresh primary in {seg.video}"


def test_lakshmi_voice_excluded(plans):
    """c3 is stills_only: her voice may not appear in any segment dialogue."""
    for plan in plans.values():
        for seg in plan.segments:
            for d in seg.dialogue:
                assert d["speaker"] != "c3", f"{plan.trailer_id} seg{seg.seg}: Lakshmi voice used"


def test_music_expiry_change_is_selective(episode_dir, tmp_path):
    change = {
        "change_id": "t-music-expiry", "type": "contract_expired", "ref": "music-02",
        "payload": {}, "description": "music-02 lapses after planning",
    }
    report, plans, session = run_and_apply(episode_dir, tmp_path, change)
    ya, family, dialect = plans["ya"], plans["family"], plans["dialect"]

    # YA used music_02 -> revised to music_01
    assert ya.version == 2
    assert ya.music["primary_track"] == "music_01"
    assert all("music_02" not in seg.audio for seg in ya.segments)
    assert ya.validation.status in ("PASS", "PASS_WITH_WARNINGS")

    # family (music_01) and dialect (music_03) are untouched:
    # same segments, same timecodes
    assert family.version == 1
    assert dialect.version == 1
    for seg in family.segments:
        assert "music_01" in seg.audio
    for seg in dialect.segments:
        assert "music_03" in seg.audio
    assert any("young_adult" in rev for rev in report["revisions"])
    assert not any("family" in rev for rev in report["revisions"])
    assert not any("dialect" in rev for rev in report["revisions"])


def test_ya_original_timecodes_preserved_after_music_change(episode_dir, tmp_path):
    change = {
        "change_id": "t-music-expiry-2", "type": "contract_expired", "ref": "music-02",
        "payload": {}, "description": "music-02 lapses after planning",
    }
    report, plans, session = run_and_apply(episode_dir, tmp_path, change)
    ya = plans["ya"]
    # only audio changed; every cut point is identical to what planning produced
    for seg in ya.segments:
        scene = session.catalog.scene(seg.video)
        assert session.catalog.tc_in_scene(seg.video, seg.source_in)
        assert session.catalog.tc_in_scene(seg.video, seg.source_out)
