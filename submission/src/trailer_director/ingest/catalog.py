"""Ingestion: the episode package becomes a validated SceneCatalog.

The catalog is the *ground truth* of the run. Every later decision must
reference it; anything that doesn't resolve against it is, by definition,
a source-accuracy failure.
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

from ..models import (
    AudienceProfile,
    Character,
    Contract,
    CostSheet,
    HistoricRecord,
    MusicTrack,
    PolicyRule,
    ProtectedFact,
    Scene,
)
from ..timecodes import tc_to_seconds

_REQUIRED_FILES = [
    "episode_meta.json",
    "scenes.json",
    "rating_policies.json",
    "contracts.json",
    "audience_profiles.json",
    "historic_performance.json",
    "cost_sheet.json",
]


def _load(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class Catalog:
    """Validated, indexed view of the episode package."""

    def __init__(self, meta: dict[str, Any], episode_dir: str, run_date: str):
        self.episode_dir = episode_dir
        self.run_date = run_date
        self.meta = meta
        self.episode_id: str = meta["episode_id"]
        self.title: str = meta.get("title", "")
        self.languages: dict = meta.get("languages", {})
        self.characters: dict[str, Character] = {
            c["id"]: Character(**c) for c in meta.get("characters", [])
        }
        self.relationships: list[dict] = meta.get("relationships", [])
        self.protected_facts: list[ProtectedFact] = [
            ProtectedFact(**f) for f in meta.get("protected_facts", [])
        ]
        self.central_twist: str = meta.get("central_twist_fact", "")

        self.scenes: dict[str, Scene] = {}
        for s in _load(os.path.join(episode_dir, "scenes.json")):
            scene = Scene(**s)
            # validate timecode sanity at ingest time
            if tc_to_seconds(scene.in_tc) >= tc_to_seconds(scene.out_tc):
                raise ValueError(f"{scene.scene_id}: in_tc must be before out_tc")
            for line in scene.lines:
                t = tc_to_seconds(line.tc)
                if not (tc_to_seconds(scene.in_tc) <= t <= tc_to_seconds(scene.out_tc)):
                    raise ValueError(f"{scene.scene_id}: line tc {line.tc} outside scene bounds")
            self.scenes[scene.scene_id] = scene

        raw_policies = _load(os.path.join(episode_dir, "rating_policies.json"))
        self.policies: list[PolicyRule] = []
        for aud, rules in raw_policies.items():
            for r in rules:
                r = dict(r)
                r.setdefault("audience", aud if aud != "all" else "*")
                self.policies.append(PolicyRule(**r))

        self.contracts: dict[str, Contract] = {
            c["id"]: Contract(**c) for c in _load(os.path.join(episode_dir, "contracts.json"))
        }
        self.tracks: dict[str, MusicTrack] = {
            t["id"]: MusicTrack(**t) for t in _load(os.path.join(episode_dir, "music_tracks.json"))
        }
        self.audiences: dict[str, AudienceProfile] = {
            a["id"]: AudienceProfile(**a)
            for a in _load(os.path.join(episode_dir, "audience_profiles.json"))
        }
        self.history: list[HistoricRecord] = [
            HistoricRecord(**h) for h in _load(os.path.join(episode_dir, "historic_performance.json"))
        ]
        self.cost_sheet = CostSheet(**_load(os.path.join(episode_dir, "cost_sheet.json")))
        self.scene_descriptions: list[dict] = self._optional(
            os.path.join(episode_dir, "scene_descriptions.json"), []
        )

    # -- helpers ------------------------------------------------------------

    def _optional(self, path: str, default: Any) -> Any:
        if not os.path.exists(path):
            return default
        return _load(path)

    def scene(self, scene_id: str) -> Optional[Scene]:
        return self.scenes.get(scene_id)

    def tc_in_scene(self, scene_id: str, tc: str) -> bool:
        s = self.scenes.get(scene_id)
        if s is None:
            return False
        t = tc_to_seconds(tc)
        return tc_to_seconds(s.in_tc) <= t <= tc_to_seconds(s.out_tc)

    def actors_in(self, scene: Scene) -> list[str]:
        return list(dict.fromkeys(scene.primary + scene.secondary))

    def actor_contract(self, char_id: str) -> Optional[Contract]:
        for c in self.contracts.values():
            if c.kind == "actor" and c.ref == char_id:
                return c
        return None

    def track_contract(self, track_id: str) -> Optional[Contract]:
        for c in self.contracts.values():
            if c.kind == "music" and c.ref == track_id:
                return c
        return None

    def contract_active(self, contract: Contract) -> bool:
        if contract.valid_until and contract.valid_until < self.run_date:
            return False
        return True

    def music_tracks_for(self, audience: str) -> list[str]:
        out = []
        for track_id in self.tracks:
            c = self.track_contract(track_id)
            if c is None or not self.contract_active(c):
                continue
            auds = c.terms.get("audiences", ["*"])
            if "*" not in auds and audience not in auds:
                continue
            out.append(track_id)
        return out

    # -- evidence resolution (source-accuracy of `evidence` ids) -------------

    def resolve_evidence(self, evidence_id: str) -> bool:
        """True if an evidence id points at something real in the package."""
        ns, _, key = evidence_id.partition(":")
        if ns == "scene":
            return f"scene_{key}" in self.scenes
        if ns == "contract":
            return key in self.contracts
        if ns == "policy":
            return any(p.rule_id == key for p in self.policies)
        if ns == "profile":
            return key in self.audiences
        if ns == "history":
            return any(h.scene_id == f"scene_{key}" for h in self.history)
        if ns == "dialogue":
            scene_id, _, line_idx = key.partition(":")
            s = self.scenes.get(scene_id)
            if s is None:
                return False
            try:
                return int(line_idx) < len(s.lines)
            except ValueError:
                return False
        return False

    def dialect_line_count(self) -> int:
        n = 0
        for s in self.scenes.values():
            for ln in s.lines:
                if ln.lang in ("hi", "kn"):
                    n += 1
        return n

    def summary_dict(self) -> dict:
        return {
            "episode_id": self.episode_id,
            "title": self.title,
            "languages": self.languages,
            "scenes": len(self.scenes),
            "characters": len(self.characters),
            "protected_facts": [f.fact_id for f in self.protected_facts],
            "run_date": self.run_date,
        }


def load_catalog(episode_dir: str, run_date: str = "2026-10-01") -> Catalog:
    missing = [f for f in _REQUIRED_FILES if not os.path.exists(os.path.join(episode_dir, f))]
    if missing:
        raise FileNotFoundError(f"episode package missing files: {missing}")
    meta = _load(os.path.join(episode_dir, "episode_meta.json"))
    return Catalog(meta, episode_dir, run_date)
