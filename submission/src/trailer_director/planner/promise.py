"""Audience promise planning.

The promise is stated *before* any clip is selected (assignment step 3):
what should this trailer make the audience expect? The model pass returns
the full creative brief (objective, promise, positioning, beats). This
module is the pipeline's entry point for that pass.
"""
from __future__ import annotations

from ..models import CreativeBrief
from ..session import PlanSession


_TRailer_ID = {"family": "family_v1", "ya": "young_adult_v1", "dialect": "dialect_region_v1"}


def plan_promise(session: PlanSession, audience: str) -> CreativeBrief:
    return session.model_call(
        "promise",
        lambda: session.model.plan_promise(audience, session.story_map, session.catalog),
        trailer_id=_TRailer_ID[audience],
        refs=[f"profile:{audience}"],
        note=f"audience promise for {audience} (stated before clip selection)",
    )
