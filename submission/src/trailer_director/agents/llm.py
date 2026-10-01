"""Model interface.

The rest of the system only ever talks to `ModelClient`. Each method is a
*model call*: it is costed against the cost sheet, logged to the decision
log, and counted against the budget. Swapping `MockModel` for a live backend
changes no pipeline code.

Design note: in mock mode the "model" is a deterministic policy function.
That is deliberate — the assignment requires a replay mode that works
without the evaluator's keys, and a deterministic stand-in makes every
decision reproducible and testable. The interface (prompt contract, cost,
logging) is identical to live mode, so a real LLM can be dropped in behind
`mode=live` without touching planning or verification code.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from ..models import BeatPlan, CreativeBrief


class ModelClient(ABC):
    name: str = "abstract"

    @abstractmethod
    def build_story_map(self, catalog: Any) -> dict:
        """Pass 1: derive the story map from the episode package."""

    @abstractmethod
    def plan_promise(self, audience: str, story_map: dict, catalog: Any) -> CreativeBrief:
        """Pass 2: state the audience promise and arc BEFORE clip selection."""

    @abstractmethod
    def rank_candidates(
        self,
        beat: BeatPlan,
        audience: str,
        catalog: Any,
        used_scenes: list[str],
    ) -> list[dict]:
        """Pass 3: rank candidate scenes for one arc beat -> [{scene_id, score, why}]"""

    @abstractmethod
    def select_segment(self, beat: BeatPlan, scene_id: str, catalog: Any, excluded_speakers: set | None = None) -> dict:
        """Pass 4: pick in/out timecodes + dialogue window for a chosen scene.

        `excluded_speakers`: characters whose voice may not appear (rights);
        the window and returned dialogue must avoid their lines.
        """

    @abstractmethod
    def review_spoiler(self, segment: Any, story_map: dict, audience: str) -> dict:
        """Semantic spoiler review used by the validator as corroborating evidence."""

    @abstractmethod
    def review_change(self, change: Any, catalog: Any, story_map: dict) -> dict:
        """Assess a change/surprise event -> which decisions it plausibly touches."""

    def is_available(self) -> bool:
        return True
