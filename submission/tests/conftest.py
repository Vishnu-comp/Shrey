"""Shared fixtures for the trailer-director test suite.

Everything runs in mock/replay mode: deterministic, no network, no API keys.
"""
from __future__ import annotations

import copy
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]  # submission/
sys.path.insert(0, str(ROOT / "src"))

from trailer_director.change.impact import apply_change  # noqa: E402
from trailer_director.config import RunConfig  # noqa: E402
from trailer_director.ingest.catalog import load_catalog  # noqa: E402
from trailer_director.models import ChangeSpec, TrailerPlan  # noqa: E402
from trailer_director.run import run_pipeline  # noqa: E402
from trailer_director.session import PlanSession  # noqa: E402

EPISODE_DIR = str(ROOT / "sample_episode")


@pytest.fixture(scope="session")
def episode_dir() -> str:
    return EPISODE_DIR


@pytest.fixture
def catalog(episode_dir):
    return load_catalog(episode_dir)


@pytest.fixture
def plans(episode_dir, tmp_path) -> dict[str, TrailerPlan]:
    """A complete pipeline run in a temp dir."""
    cfg = RunConfig(episode_dir=episode_dir, out_dir=str(tmp_path / "run"))
    return run_pipeline(cfg)


def make_session(episode_dir: str, out_dir) -> PlanSession:
    cfg = RunConfig(episode_dir=episode_dir, out_dir=str(out_dir))
    s = PlanSession(cfg)
    s.catalog = load_catalog(episode_dir)
    s.story_map = s.model_call(
        "story_map", lambda: s.model.build_story_map(s.catalog), note="test rebuild"
    )
    return s


def run_and_apply(episode_dir: str, tmp_path, change: dict):
    """Full pipeline run, then apply a change spec. Returns (report, plans, session)."""
    cfg = RunConfig(episode_dir=episode_dir, out_dir=str(tmp_path / "run"))
    plans = run_pipeline(cfg)
    session = make_session(episode_dir, tmp_path / "change")
    spec = ChangeSpec(**change)
    report = apply_change(session, plans, spec)
    return report, plans, session


def segment_signature(plan: TrailerPlan):
    return [
        (s.seg, s.beat, s.video, s.source_in, s.source_out, s.audio, s.text_card)
        for s in plan.segments
    ]


def deep(plans):
    return copy.deepcopy(plans)
