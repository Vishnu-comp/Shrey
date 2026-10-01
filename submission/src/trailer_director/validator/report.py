"""Human-readable validation report (markdown)."""
from __future__ import annotations

import os

from ..models import TrailerPlan
from ..session import PlanSession
from ..timecodes import tc_to_seconds


def write_validation_report(out_dir: str, plans: dict[str, TrailerPlan], session: PlanSession) -> str:
    lines = [
        "# Validation Report",
        "",
        f"Run: `{session.cfg.run_id}` · mode: `{session.cfg.mode}` · model: `{session.model.name}` · "
        f"episode: `{session.catalog.episode_id}` ({len(session.catalog.scenes)} scenes)",
        "",
        "Every plan was re-verified by the independent validator against the catalog "
        "(ground truth). A `FAIL` never ships: it is repaired, or the trailer is rejected.",
        "",
        "## Summary",
        "",
        "| Trailer | Audience | Status | Segments | Duration | Target | Model calls | Est. cost |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for plan in plans.values():
        lines.append(
            f"| {plan.trailer_id} | {plan.audience} | **{plan.validation.status}** | "
            f"{len(plan.segments)} | {plan.duration_seconds}s | "
            f"{plan.creative_brief.target_duration_s}s | {plan.cost_estimate.model_calls} | "
            f"${plan.cost_estimate.total_usd:.2f} |"
        )
    lines.append("")

    for plan in plans.values():
        lines += [
            f"## {plan.trailer_id} — {plan.audience}",
            "",
            f"**Promise:** {plan.audience_promise}",
            "",
            f"**Positioning:** {plan.creative_brief.positioning}",
            "",
            "**Emotional journey:** "
            + " → ".join(f"{b.beat} ({b.intention})" for b in plan.creative_brief.beats),
            "",
            "**Music:** " + plan.music.get("primary_track", "?") + " (" + plan.music.get("source", "") + ")",
            "",
            "### Checks",
            "",
            "| Check | Status | Detail |",
            "|---|---|---|",
        ]
        for c in plan.validation.checks:
            lines.append(f"| {c.check} | {c.status.upper()} | {c.detail or '—'} |")
        lines += ["", "### Segments", "", "| # | Beat | Scene | In → Out | Dur | Audio | Reason (abridged) | Risk flags |", "|---|---|---|---|---|---|---|---|"]
        for s in plan.segments:
            lines.append(
                f"| {s.seg} | {s.beat} | {s.video} | {s.source_in} → {s.source_out} | "
                f"{s.duration_s}s | {s.audio} | {s.reason[:90]}… | {', '.join(s.risk_flags) or '—'} |"
            )
        lines += ["", "### Evidence (per segment)", ""]
        for s in plan.segments:
            lines.append(f"- seg{s.seg} ({s.video}): {', '.join(s.evidence)}")
        lines += ["", "### Warnings / assumptions", ""]
        for w in plan.validation.warnings:
            lines.append(f"- ⚠ {w}")
        for a in plan.assumptions:
            lines.append(f"- · {a}")
        if plan.human_approvals:
            lines += ["", "### Human approvals required", ""]
            for h in plan.human_approvals:
                lines.append(f"- **{h.decision}** — {h.owner} ({h.status}): {h.reason}")
        if plan.fallback_plan:
            lines += [
                "",
                f"### Lower-cost fallback",
                "",
                f"- {plan.fallback_plan.description}",
                f"- model calls: {plan.fallback_plan.model_calls} · est. cost: ${plan.fallback_plan.total_usd:.2f}",
                f"- segments: {', '.join(s.video for s in plan.fallback_plan.segments)}",
            ]
        lines.append("")

    lines += [
        "## Decision log",
        "",
        f"{len(session.log.entries)} logged decisions in `decision_log.jsonl` "
        f"({session.log.calls()} model calls, ${session.log.cost_total():.2f} total).",
        "",
    ]
    path = os.path.join(out_dir, "validation_report.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return path
