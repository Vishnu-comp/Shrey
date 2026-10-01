"""Constraint compiler: policies + contracts -> executable rules.

Policies and contracts are *decision rules*, not prose. Each compiled rule
carries a machine-evaluable `spec`, an `action`, and a resolvable `source`
evidence id. When a contract or policy changes, the handler replaces the
rule object — and impact analysis finds every segment that cited it.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models import CompiledRule

if TYPE_CHECKING:
    from ..ingest.catalog import Catalog


def compile_rules(catalog: "Catalog") -> list[CompiledRule]:  # noqa: F821
    rules: list[CompiledRule] = []

    # --- rating policies -> field rules -----------------------------------
    for p in catalog.policies:
        rules.append(
            CompiledRule(
                rule_id=p.rule_id,
                kind="rating",
                audience=p.audience,
                spec={"field": p.field, "op": p.op, "value": p.value},
                action=p.action,
                description=p.description or f"{p.rule_id}: {p.field} {p.op} {p.value}",
                source=f"policy:{p.rule_id}",
            )
        )

    # --- contracts -> rights rules ------------------------------------------
    for c in catalog.contracts.values():
        if c.kind == "music":
            rules.append(
                CompiledRule(
                    rule_id=f"rights:music:{c.ref}",
                    kind="rights",
                    audience="*",
                    spec={
                        "track": c.ref,
                        "audiences": c.terms.get("audiences", ["*"]),
                        "territories": c.terms.get("territories", ["*"]),
                        "valid_until": c.valid_until,
                    },
                    action="block",
                    description=(
                        f"Music '{c.ref}' may be used per contract {c.id}"
                        + (f" until {c.valid_until}" if c.valid_until else "")
                    ),
                    source=f"contract:{c.id}",
                )
            )
        elif c.kind == "actor":
            use = c.terms.get("promotional_use", "full")
            rules.append(
                CompiledRule(
                    rule_id=f"rights:actor:{c.ref}",
                    kind="rights",
                    audience="*",
                    spec={"actor": c.ref, "use": use},
                    action="block",
                    description=f"Actor {c.ref}: promotional_use={use} ({c.note})" if c.note
                    else f"Actor {c.ref}: promotional_use={use}",
                    source=f"contract:{c.id}",
                )
            )
        elif c.kind == "territory":
            rules.append(
                CompiledRule(
                    rule_id=f"rights:territory:{c.ref}",
                    kind="rights",
                    audience="*",
                    spec={"markets": c.terms.get("markets", ["*"])},
                    action="block",
                    description=f"Territory restriction: {c.terms.get('markets')}",
                    source=f"contract:{c.id}",
                )
            )

    return rules


def _OPS() -> dict[str, Any]:
    import operator

    return {
        ">=": operator.ge,
        ">": operator.gt,
        "<=": operator.le,
        "<": operator.lt,
        "==": operator.eq,
        "!=": operator.ne,
    }


def evaluate_field_rule(rule: CompiledRule, segment_scene: Any, catalog: "Catalog") -> str | None:
    """Evaluate a rating/field rule against a segment's scene.

    Returns the rule action ("block"/"flag") if violated, else None.
    Handles both numeric content flags and boolean derived fields.
    """
    ops = _OPS()
    spec = rule.spec
    field, op, value = spec["field"], spec["op"], spec["value"]
    scene = segment_scene

    if field == "has_dialogue":
        actual = len(scene.lines) > 0
    elif field == "stereotype_framing":
        # True when a dialect line is placed in a comic-framed segment
        dialect = any(l.lang in ("hi", "kn") for l in scene.lines)
        actual = dialect and "humor" in scene.mood
    elif field == "subtitle_missing":
        actual = False  # evaluated by the accessibility check, not here
    else:
        actual = scene.content_flags.get(field, 0)

    try:
        violated = ops[op](actual, value)
    except TypeError:
        violated = False
    if violated:
        return rule.action
    return None


def rule_applies(rule: CompiledRule, audience: str) -> bool:
    return rule.audience in ("*", audience)


def actor_violation(rule: CompiledRule, scene: Any, segment: Any) -> str | None:
    """Rights check for actor usage rules against one segment."""
    if not rule.active or rule.kind != "rights" or not rule.spec.get("actor"):
        return None
    actor, use = rule.spec["actor"], rule.spec["use"]
    if use == "full":
        return None
    if actor in scene.primary:
        if use in ("stills_only", "none", "background_only"):
            return f"actor {actor} is primary in {scene.scene_id} (use={use})"
    if use == "none":
        if actor in scene.secondary:
            return f"actor {actor} appears (background) in {scene.scene_id} (use=none)"
        if any(d.get("speaker") == actor for d in (segment.dialogue if segment else [])):
            return f"actor {actor} has voice in segment (use=none)"
    if use == "stills_only" and any(d.get("speaker") == actor for d in (segment.dialogue if segment else [])):
        return f"actor {actor} has voice in segment (use=stills_only)"
    return None
