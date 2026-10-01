"""Run configuration.

`mode=mock` is the deterministic, key-free mode used for evaluation and the
sample run. `mode=live` would route model calls to a real backend (see
agents/live.py) — never required by the evaluator.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

DEFAULT_RUN_DATE = "2026-10-01"  # fixed -> reproducible contract-expiry checks


class RunConfig(BaseModel):
    mode: Literal["mock", "live"] = "mock"
    episode_dir: str
    out_dir: str
    run_id: str = "sample-run-2026-10-01"
    run_date: str = DEFAULT_RUN_DATE
    audiences: list[str] = Field(default_factory=lambda: ["family", "ya", "dialect"])
    min_beats_to_ship: int = 4  # below this, a trailer is REJECTED, not forced
    max_repair_rounds: int = 3
    duration_tolerance: float = 0.10  # +/- 10% of target duration
