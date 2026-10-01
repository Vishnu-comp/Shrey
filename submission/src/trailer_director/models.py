"""Pydantic models for the trailer director pipeline.

Two families:
  * Input models  — describe the supplied episode package (scenes, contracts…).
  * Runtime models — the agent's own artifacts (segments, EDLs, verdicts, logs).

Every runtime artifact is JSON-serializable: the submission's required output
is machine-readable, so these models *are* the machine contract.
"""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .timecodes import tc_to_seconds

# ---------------------------------------------------------------------------
# Input models (episode package)
# ---------------------------------------------------------------------------


class Line(BaseModel):
    """One spoken line. `lang`: 'source' (English) or a dialect subtitle track."""

    model_config = ConfigDict(extra="ignore")

    tc: str
    speaker: str  # character id, e.g. "c1"
    text: str
    lang: Literal["source", "hi", "kn"] = "source"
    translation: Optional[str] = None  # official translation of a dialect line


class Character(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    age: int
    role: str
    notes: str = ""


class MusicTrack(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    title: str
    composer: str


class Scene(BaseModel):
    """A scene with a stable timecode range — the unit of ground truth."""

    model_config = ConfigDict(extra="ignore")

    scene_id: str
    in_tc: str
    out_tc: str
    title: str
    summary: str
    location: str = ""
    primary: list[str] = Field(default_factory=list)    # character ids in frame, foreground
    secondary: list[str] = Field(default_factory=list)  # character ids in frame, background
    mood: list[str] = Field(default_factory=list)
    content_flags: dict[str, int] = Field(default_factory=dict)
    lines: list[Line] = Field(default_factory=list)
    tracks: list[str] = Field(default_factory=list)  # music tracks heard
    emotional_turn: bool = False
    story_weight: float = 0.5


class ProtectedFact(BaseModel):
    """A spoiler: a story fact whose reveal is protected per audience.

    teaser level: 0 = no hint allowed, 1 = subtle mystery framing allowed
    (but never the fact itself), 2 = explicit mention allowed.
    The reveal scene itself is never usable in any trailer.
    """

    model_config = ConfigDict(extra="ignore")

    fact_id: str
    text: str
    reveal_scene: str
    reveal_tc: str
    teaser: dict[str, int] = Field(default_factory=dict)
    keywords: list[str] = Field(default_factory=list)


class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str          # e.g. "music-02", "actor-c3"
    kind: Literal["music", "actor", "territory"]
    ref: str         # music track id, character id, or market
    terms: dict[str, Any] = Field(default_factory=dict)
    valid_until: Optional[str] = None  # ISO date; contract lapsed after this date
    note: str = ""


class PolicyRule(BaseModel):
    """A rating-policy rule as supplied (pre-compilation)."""

    model_config = ConfigDict(extra="ignore")

    rule_id: str
    audience: str  # specific audience id or "*"
    field: str     # scene content-flag or scene property name
    op: Literal[">=", ">", "<=", "<", "==", "!="]
    value: Any
    action: Literal["block", "flag"]
    description: str = ""


class AudienceProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    age_range: list[int]
    goals: list[str]
    care: str
    preferences: dict[str, float] = Field(default_factory=dict)
    notes: str = ""


class HistoricRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    scene_id: str
    campaign: str
    ctr: float
    note: str = ""


class CostSheet(BaseModel):
    model_config = ConfigDict(extra="ignore")

    task_costs_usd: dict[str, float]
    media_processing_flat_usd: float = 0.0
    max_model_calls: int = 150
    max_total_usd: float = 5.0


# ---------------------------------------------------------------------------
# Runtime models (agent artifacts)
# ---------------------------------------------------------------------------


class CompiledRule(BaseModel):
    """A constraint the agent can *execute*, with a resolvable evidence source."""

    model_config = ConfigDict(extra="ignore")

    rule_id: str
    kind: Literal["rating", "rights", "accessibility", "cultural", "budget"]
    audience: str  # "*" or audience id
    spec: dict[str, Any]
    action: Literal["block", "flag"]
    description: str = ""
    source: str = ""  # evidence id, e.g. "contract:music-02" / "policy:family-01"
    active: bool = True


class Segment(BaseModel):
    """One EDL segment — the unit a human editor can cut to."""

    model_config = ConfigDict(extra="ignore")

    seg: int
    beat: str
    source_in: str
    source_out: str
    video: str  # scene id, must exist in the catalog
    audio: str  # e.g. "dialogue_and_music:music_01" | "music:music_01" | "nat"
    dialogue: list[dict] = Field(default_factory=list)  # [{speaker,line,tc,lang,translation?}]
    subtitle: Optional[dict[str, str]] = None  # lang -> subtitle text
    text_card: Optional[str] = None
    transition: str = "cut"
    vo: Optional[dict] = None  # {speaker, line, scene, tc}
    reason: str = ""
    evidence: list[str] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)
    duration_s: float = 0.0

    @model_validator(mode="after")
    def _compute_duration(self) -> "Segment":
        self.duration_s = round(
            tc_to_seconds(self.source_out) - tc_to_seconds(self.source_in), 3
        )
        return self

    def music_tracks(self) -> list[str]:
        out = []
        for part in self.audio.split("+"):
            if ":" in part:
                _, track = part.split(":", 1)
                out.append(track)
        return out


class BeatPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")

    beat: str  # hook | bond | stakes | mystery | turn | hope | title | ...
    name: str
    intention: str
    moods: list[str]
    max_duration_s: float
    target_s: float
    needs_dialect_line: bool = False


class CreativeBrief(BaseModel):
    model_config = ConfigDict(extra="ignore")

    audience: str
    objective: str
    promise: str
    positioning: str
    beats: list[BeatPlan]
    target_duration_s: float


class CheckResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    check: str
    status: Literal["pass", "warn", "fail"]
    detail: str = ""
    segments: list[int] = Field(default_factory=list)  # affected segment numbers


class Validation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: Literal["PASS", "PASS_WITH_WARNINGS", "FAIL", "REJECTED"] = "FAIL"
    checks: list[CheckResult] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)

    def check(self, name: str) -> Optional[CheckResult]:
        for c in self.checks:
            if c.check == name:
                return c
        return None


class CostEstimate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    model_calls: int = 0
    task_cost_usd: float = 0.0
    media_usd: float = 0.0
    total_usd: float = 0.0
    within_budget: bool = True
    breakdown: dict[str, float] = Field(default_factory=dict)


class HumanApproval(BaseModel):
    model_config = ConfigDict(extra="ignore")

    decision: str
    owner: str  # editorial | legal | cultural
    status: str = "pending"
    reason: str = ""


class FallbackPlan(BaseModel):
    """A lower-cost re-plan that the budget can fall back to."""

    model_config = ConfigDict(extra="ignore")

    description: str
    model_calls: int
    total_usd: float
    segments: list[Segment] = Field(default_factory=list)


class TrailerPlan(BaseModel):
    """The required deliverable: creative brief + EDL + validation + cost."""

    model_config = ConfigDict(extra="ignore")

    trailer_id: str
    audience: str
    duration_seconds: float
    audience_promise: str
    creative_brief: CreativeBrief
    music: dict
    segments: list[Segment] = Field(default_factory=list)
    human_approvals: list[HumanApproval] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    validation: Validation = Field(default_factory=Validation)
    cost_estimate: CostEstimate = Field(default_factory=CostEstimate)
    fallback_plan: Optional[FallbackPlan] = None
    version: int = 1

    @property
    def total_segment_seconds(self) -> float:
        return round(sum(s.duration_s for s in self.segments), 3)


class DecisionEntry(BaseModel):
    """One row of the JSONL decision log (observability)."""

    model_config = ConfigDict(extra="ignore")

    ts: str
    run_id: str
    trailer_id: Optional[str] = None
    phase: str
    action: str
    task: Optional[str] = None
    model: Optional[str] = None
    refs: list[str] = Field(default_factory=list)
    cost_usd: float = 0.0
    note: str = ""
    revision_of: Optional[str] = None  # decision id this revises


class ChangeSpec(BaseModel):
    """A surprise event / change the evaluator can inject."""

    model_config = ConfigDict(extra="ignore")

    change_id: str
    type: str  # contract_expired | actor_terms_changed | audience_bias |
    #              phantom_recommendation | clickbait_request | dialect_shift |
    #              injection | model_unavailable
    ref: Optional[str] = None
    payload: dict[str, Any] = Field(default_factory=dict)
    description: str = ""
