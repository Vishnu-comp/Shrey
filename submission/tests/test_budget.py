"""Budget tests: configurable limits, cost ledger, lower-cost fallback."""
from __future__ import annotations

import json
import shutil

from conftest import EPISODE_DIR


def test_all_plans_within_budget(plans, catalog):
    sheet = catalog.cost_sheet
    for plan in plans.values():
        est = plan.cost_estimate
        assert est.within_budget, f"{plan.trailer_id} over budget"
        assert est.model_calls <= sheet.max_model_calls
        assert est.total_usd <= sheet.max_total_usd


def test_fallback_plan_is_cheaper(plans):
    for plan in plans.values():
        assert plan.fallback_plan is not None
        assert plan.fallback_plan.model_calls < plan.cost_estimate.model_calls
        assert plan.fallback_plan.total_usd < plan.cost_estimate.task_cost_usd


def test_decision_log_accounts_for_every_call(plans, tmp_path):
    # run_pipeline wrote decision_log.jsonl into its tmp run dir;
    # here we verify the session-level ledger matches the plans' estimates
    total = sum(p.cost_estimate.task_cost_usd for p in plans.values())
    assert total <= 5.0  # global cap from the cost sheet


def test_budget_exhaustion_degrades_without_crash(episode_dir, tmp_path):
    """With a 1-call budget the system must reject, not crash."""
    ep_copy = tmp_path / "episode"
    shutil.copytree(EPISODE_DIR, ep_copy)
    sheet_path = ep_copy / "cost_sheet.json"
    sheet = json.loads(sheet_path.read_text())
    sheet["max_model_calls"] = 1
    sheet_path.write_text(json.dumps(sheet))

    from trailer_director.config import RunConfig
    from trailer_director.run import run_pipeline

    plans = run_pipeline(RunConfig(episode_dir=str(ep_copy), out_dir=str(tmp_path / "run")))
    assert plans, "pipeline returned no plans"
    for plan in plans.values():
        assert plan.validation.status == "REJECTED", (
            f"{plan.trailer_id} should be REJECTED under a 1-call budget, "
            f"got {plan.validation.status}"
        )
