"""Decision log + cost ledger.

Every decision, model call, check verdict and revision is appended as a JSONL
row. The log is append-only: revisions never rewrite history — a revision row
references the decision it supersedes via `revision_of`.
"""
from __future__ import annotations

import json
import os
from typing import Optional

from ..models import DecisionEntry

# Fixed clock for reproducible sample runs; real runs can use wall time.
FIXED_TS = "2026-10-01T09:00:00+05:30"


class DecisionLog:
    def __init__(self, run_id: str, out_path: Optional[str] = None):
        self.run_id = run_id
        self.out_path = out_path
        self.entries: list[DecisionEntry] = []

    def log(
        self,
        phase: str,
        action: str,
        trailer_id: Optional[str] = None,
        task: Optional[str] = None,
        model: Optional[str] = None,
        refs: Optional[list[str]] = None,
        cost_usd: float = 0.0,
        note: str = "",
        revision_of: Optional[str] = None,
    ) -> str:
        entry = DecisionEntry(
            ts=FIXED_TS,
            run_id=self.run_id,
            trailer_id=trailer_id,
            phase=phase,
            action=action,
            task=task,
            model=model,
            refs=refs or [],
            cost_usd=round(cost_usd, 6),
            note=note,
            revision_of=revision_of,
        )
        self.entries.append(entry)
        return f"d-{len(self.entries):04d}"

    def cost_total(self) -> float:
        return round(sum(e.cost_usd for e in self.entries), 6)

    def calls(self) -> int:
        return sum(1 for e in self.entries if e.task is not None)

    def write(self) -> None:
        if not self.out_path:
            return
        os.makedirs(os.path.dirname(self.out_path) or ".", exist_ok=True)
        with open(self.out_path, "w", encoding="utf-8") as f:
            for e in self.entries:
                f.write(e.model_dump_json(exclude_none=True) + "\n")

    def tail(self, n: int = 10) -> str:
        return "\n".join(e.model_dump_json() for e in self.entries[-n:])

    def to_jsonl(self) -> str:
        return "\n".join(e.model_dump_json(exclude_none=True) for e in self.entries)
