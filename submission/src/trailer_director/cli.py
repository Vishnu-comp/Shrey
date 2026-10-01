"""CLI entry point.

    trailer-director run      --episode DIR --out DIR [--mode mock|live]
                              [--audiences family,ya,dialect] [--run-id X]
    trailer-director validate --edl FILE --episode DIR
    trailer-director change   --run-dir DIR --episode DIR --change FILE [--out DIR]
    trailer-director cost     --run-dir DIR
"""
from __future__ import annotations

import argparse
import json
import os
import sys

from .config import RunConfig
from .models import ChangeSpec, TrailerPlan
from .run import TRAILER_FILES, run_pipeline
from .session import PlanSession
from .validator.checks import run_all, overall_status
from .models import Validation


def _load_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def cmd_run(args) -> int:
    cfg = RunConfig(
        mode=args.mode,
        episode_dir=args.episode,
        out_dir=args.out,
        run_id=args.run_id,
        audiences=[a.strip() for a in args.audiences.split(",")],
    )
    plans = run_pipeline(cfg)
    print(f"\nrun {cfg.run_id} complete ({cfg.mode} mode)")
    for aud, plan in plans.items():
        print(
            f"  {TRAILER_FILES[aud]}: {plan.validation.status} "
            f"({len(plan.segments)} segments, {plan.duration_seconds}s, "
            f"${plan.cost_estimate.total_usd:.2f})"
        )
    return 0


def cmd_validate(args) -> int:
    plan = TrailerPlan.model_validate(_load_json(args.edl))
    from .ingest.catalog import load_catalog

    catalog = load_catalog(args.episode, args.run_date)
    results = run_all(plan, catalog)
    plan.validation = Validation(
        status=overall_status(results), checks=results,
        warnings=[c.detail for c in results if c.status == "warn"],
    )
    for c in results:
        print(f"  {c.check:<18} {c.status.upper():<6} {c.detail}")
    print(f"status: {plan.validation.status}")
    return 0 if plan.validation.status in ("PASS", "PASS_WITH_WARNINGS") else 1


def cmd_change(args) -> int:
    cfg = RunConfig(
        mode="mock",
        episode_dir=args.episode,
        out_dir=args.out or args.run_dir,
        run_id=f"change-{os.path.splitext(os.path.basename(args.change))[0]}",
    )
    session = PlanSession(cfg)
    from .ingest.catalog import load_catalog

    changes_dir = os.path.join(cfg.out_dir, "changes")
    os.makedirs(changes_dir, exist_ok=True)
    # keep the original run log intact: this change gets its own log file
    session.log.out_path = os.path.join(changes_dir, f"{os.path.splitext(os.path.basename(args.change))[0]}_decision_log.jsonl")
    session.catalog = load_catalog(args.episode, cfg.run_date)
    session.log.log("change", "session_restored", note=f"run-dir={args.run_dir}")
    session.story_map = session.model_call(
        "story_map", lambda: session.model.build_story_map(session.catalog), note="rebuild for change review"
    )

    plans: dict[str, TrailerPlan] = {}
    for aud, fname in TRAILER_FILES.items():
        path = os.path.join(args.run_dir, fname)
        if os.path.exists(path):
            plans[aud] = TrailerPlan.model_validate(_load_json(path))
    if not plans:
        print(f"no trailer EDLs found in {args.run_dir}", file=sys.stderr)
        return 1

    change = ChangeSpec.model_validate(_load_json(args.change))
    with open(os.path.join(changes_dir, f"{change.change_id}_spec.json"), "w", encoding="utf-8") as f:
        json.dump(change.model_dump(), f, indent=2)
    report = _apply(session, plans, change)

    with open(os.path.join(changes_dir, f"{change.change_id}_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    for plan in plans.values():
        base = os.path.splitext(TRAILER_FILES[plan.audience])[0]
        fname = f"{base}_v{plan.version}.json" if plan.version > 1 else TRAILER_FILES[plan.audience]
        path = os.path.join(cfg.out_dir, fname)
        with open(path, "w", encoding="utf-8") as f:
            f.write(plan.model_dump_json(indent=2, exclude_none=True))
    session.log.write()

    print(f"change {change.change_id} ({change.type}) applied:")
    for rev in report["revisions"]:
        print(f"  - {rev}")
    for rej in report["rejected"]:
        print(f"  ! rejected: {rej}")
    return 0


def _apply(session, plans, change):
    from .change.impact import apply_change

    return apply_change(session, plans, change)


def cmd_cost(args) -> int:
    log_path = os.path.join(args.run_dir, "decision_log.jsonl")
    if not os.path.exists(log_path):
        print(f"no decision_log.jsonl in {args.run_dir}", file=sys.stderr)
        return 1
    by_trailer: dict[str, list[float]] = {}
    n_calls = 0
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            e = json.loads(line)
            if e.get("task"):
                n_calls += 1
                tid = e.get("trailer_id") or "(run)"
                by_trailer.setdefault(tid, []).append(e.get("cost_usd", 0.0))
    print(f"total model calls: {n_calls}")
    for tid, costs in sorted(by_trailer.items()):
        print(f"  {tid}: {len(costs)} calls, ${sum(costs):.3f}")
    return 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="trailer-director", description="Autonomous Trailer Director")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="run the full pipeline")
    r.add_argument("--episode", required=True, help="episode package directory")
    r.add_argument("--out", required=True, help="output directory")
    r.add_argument("--mode", choices=["mock", "live"], default="mock")
    r.add_argument("--audiences", default="family,ya,dialect")
    r.add_argument("--run-id", default="sample-run-2026-10-01")
    r.set_defaults(fn=cmd_run)

    v = sub.add_parser("validate", help="re-validate an EDL against an episode package")
    v.add_argument("--edl", required=True)
    v.add_argument("--episode", required=True)
    v.add_argument("--run-date", default="2026-10-01")
    v.set_defaults(fn=cmd_validate)

    c = sub.add_parser("change", help="apply a change/surprise event to a run's plans")
    c.add_argument("--run-dir", required=True)
    c.add_argument("--episode", required=True)
    c.add_argument("--change", required=True, help="change spec JSON")
    c.add_argument("--out", default=None)
    c.set_defaults(fn=cmd_change)

    k = sub.add_parser("cost", help="show cost summary from a run's decision log")
    k.add_argument("--run-dir", required=True)
    k.set_defaults(fn=cmd_cost)

    args = p.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
