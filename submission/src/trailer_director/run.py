"""Pipeline orchestration: the full run.

    ingest -> story map -> constraint map -> per-audience
    (promise -> retrieve -> select -> validate -> repair) -> artifacts
"""
from __future__ import annotations

import json
import os

from .config import RunConfig
from .constraints.compiler import compile_rules
from .ingest.catalog import load_catalog
from .observability.decision_log import FIXED_TS
from .planner.edl_builder import plan_trailer
from .session import PlanSession
from .models import TrailerPlan
from .validator.report import write_validation_report

TRAILER_FILES = {
    "family": "family_trailer.json",
    "ya": "young_adult_trailer.json",
    "dialect": "dialect_region_trailer.json",
}


def run_pipeline(cfg: RunConfig) -> dict[str, TrailerPlan]:
    os.makedirs(cfg.out_dir, exist_ok=True)
    session = PlanSession(cfg)

    # 1. ingest ---------------------------------------------------------------
    catalog = load_catalog(cfg.episode_dir, cfg.run_date)
    session.catalog = catalog
    session.log.log(
        "ingest",
        "catalog_built",
        refs=[f"scene:{s}" for s in sorted(catalog.scenes)],
        note=f"{len(catalog.scenes)} scenes; {len(catalog.characters)} characters; "
        f"{len(catalog.protected_facts)} protected facts",
    )

    # 2. story map (model pass) ------------------------------------------------
    story_map = session.model_call(
        "story_map",
        lambda: session.model.build_story_map(catalog),
        note="story map: characters, events, emotional turns, spoilers, sensitive content",
    )
    session.story_map = story_map
    with open(os.path.join(cfg.out_dir, "story_map.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "_provenance": {
                    "generated_by": session.model.name,
                    "run_id": cfg.run_id,
                    "ts": FIXED_TS,
                    "method": (
                        "structured package metadata (mock) / LLM summarization (live); "
                        "protected facts from the platform's own spoiler list"
                    ),
                },
                **story_map,
            },
            f,
            indent=2,
        )

    # 3. constraint map ---------------------------------------------------------
    rules = compile_rules(catalog)
    session.rules = rules
    session.log.log(
        "constraints",
        "rules_compiled",
        refs=[r.source for r in rules],
        note=f"{len(rules)} executable rules from policies + contracts",
    )
    with open(os.path.join(cfg.out_dir, "constraint_map.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "_provenance": {
                    "generated_by": "constraint-compiler",
                    "run_id": cfg.run_id,
                    "note": "policies and contracts compiled to executable rules; change handler replaces rule objects on revision",
                },
                "rules": [r.model_dump() for r in rules],
                "contracts": {c.id: c.model_dump() for c in catalog.contracts.values()},
            },
            f,
            indent=2,
        )

    # 4. per-audience planning ----------------------------------------------------
    plans: dict[str, TrailerPlan] = {}
    for aud in cfg.audiences:
        plan = plan_trailer(session, aud)
        plans[aud] = plan
        out_path = os.path.join(cfg.out_dir, TRAILER_FILES[aud])
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(plan.model_dump_json(indent=2, exclude_none=True))

    # 5. artifacts --------------------------------------------------------------
    write_validation_report(cfg.out_dir, plans, session)
    session.log.write()
    return plans
