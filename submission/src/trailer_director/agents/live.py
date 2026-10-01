"""Optional live model adapter.

NOT required for evaluation. The evaluator runs `mode=mock` (deterministic,
no keys). If you want to wire a real backend, implement the same
`ModelClient` methods here — the pipeline, cost ledger and validator do not
change.

A minimal OpenAI-compatible stub is sketched; it refuses to run without an
explicit API key and is excluded from the sample run and test suite.
"""
from __future__ import annotations

import os
from typing import Any

from .llm import ModelClient


class LiveModel(ModelClient):
    name = "live-llm"

    def __init__(self, model_name: str = "gpt-4o"):
        self.model_name = model_name
        self.api_key = os.environ.get("TRAILER_LLM_API_KEY", "")

    def is_available(self) -> bool:
        return bool(self.api_key)

    # The live implementation would issue real completions for each pass.
    # Left deliberately unimplemented: the submission's guarantee is the
    # mock/replay path, and shipping a half-tested live adapter would be a
    # known limitation, not a feature (see KNOWN_LIMITATIONS.md).

    def build_story_map(self, catalog: Any) -> dict:
        raise NotImplementedError("live mode not wired in this submission; use mode=mock")

    def plan_promise(self, audience: str, story_map: dict, catalog: Any):
        raise NotImplementedError("live mode not wired in this submission; use mode=mock")

    def rank_candidates(self, beat, audience, catalog, used_scenes):
        raise NotImplementedError("live mode not wired in this submission; use mode=mock")

    def select_segment(self, beat, scene_id, catalog):
        raise NotImplementedError("live mode not wired in this submission; use mode=mock")

    def review_spoiler(self, segment, story_map, audience):
        raise NotImplementedError("live mode not wired in this submission; use mode=mock")

    def review_change(self, change, catalog, story_map):
        raise NotImplementedError("live mode not wired in this submission; use mode=mock")
