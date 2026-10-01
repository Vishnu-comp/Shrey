"""PlanSession: runtime state shared by all pipeline stages.

Holds the catalog (ground truth), story map, compiled rules, the model
client, and the decision log + cost ledger. Model calls always go through
`model_call` so they are costed, logged and capped uniformly.
"""
from __future__ import annotations

import os
from typing import Any, Callable, Optional

from .agents.live import LiveModel
from .agents.mock import MockModel
from .config import RunConfig
from .ingest.catalog import Catalog
from .observability.decision_log import DecisionLog


class BudgetExhausted(RuntimeError):
    pass


class PlanSession:
    def __init__(self, cfg: RunConfig):
        self.cfg = cfg
        self.model: Any = MockModel() if cfg.mode == "mock" else LiveModel()
        if not self.model.is_available():
            raise RuntimeError(
                f"model '{self.model.name}' unavailable — run with --mode mock "
                "(the evaluator always runs mock/replay mode)"
            )
        self.log = DecisionLog(cfg.run_id, os.path.join(cfg.out_dir, "decision_log.jsonl"))
        self.catalog: Optional[Catalog] = None
        self.story_map: Optional[dict] = None
        self.rules: Optional[list] = None
        self.degraded: bool = False  # set on model_unavailable change events

    # -- model calls (costed + logged + capped) ------------------------------

    def model_call(
        self,
        task: str,
        fn: Callable[[], Any],
        trailer_id: Optional[str] = None,
        refs: Optional[list[str]] = None,
        note: str = "",
    ) -> Any:
        sheet = self.catalog.cost_sheet if self.catalog else None
        cost = sheet.task_costs_usd.get(task, 0.005) if sheet else 0.005
        if sheet and (self.log.calls() + 1 > sheet.max_model_calls or self.log.cost_total() + cost > sheet.max_total_usd):
            self.log.log("budget", "model_call_refused", trailer_id=trailer_id, note=f"{task}: budget exhausted")
            raise BudgetExhausted(f"{task} would exceed configured budget")
        result = fn()
        self.log.log(
            phase="model",
            action=f"call:{task}",
            trailer_id=trailer_id,
            task=task,
            model=self.model.name,
            refs=refs,
            cost_usd=cost,
            note=note,
        )
        return result

    def cost_for_trailer(self, trailer_id: str, media_share: float) -> dict:
        entries = [
            e for e in self.log.entries
            if e.trailer_id == trailer_id and e.task is not None and not e.task.startswith("fallback:")
        ]
        calls = len(entries)
        task_cost = round(sum(e.cost_usd for e in entries), 6)
        return {
            "model_calls": calls,
            "task_cost_usd": task_cost,
            "media_usd": round(media_share, 6),
            "total_usd": round(task_cost + media_share, 6),
            "breakdown": self._breakdown(entries),
        }

    def _breakdown(self, entries) -> dict[str, float]:
        out: dict[str, float] = {}
        for e in entries:
            out[e.task] = round(out.get(e.task, 0.0) + e.cost_usd, 6)
        return out
