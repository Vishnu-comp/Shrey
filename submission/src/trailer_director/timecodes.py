"""Timecode helpers. Format: MM:SS.mmm (episode is < 1 hour)."""
from __future__ import annotations

import re

_TC_RE = re.compile(r"^(\d{1,2}):(\d{2})\.(\d{3})$")


def tc_to_seconds(tc: str) -> float:
    """'09:38.500' -> 578.5"""
    m = _TC_RE.match(tc.strip())
    if not m:
        raise ValueError(f"malformed timecode: {tc!r} (expected MM:SS.mmm)")
    mm, ss, ms = (int(g) for g in m.groups())
    if ss >= 60 or mm > 59 or ms > 999:
        raise ValueError(f"malformed timecode: {tc!r}")
    return mm * 60 + ss + ms / 1000.0


def seconds_to_tc(seconds: float) -> str:
    if seconds < 0:
        raise ValueError(f"negative timecode: {seconds}")
    seconds = round(seconds, 3)
    mm = int(seconds // 60)
    ss = int(round((seconds - mm * 60) * 1000)) // 1000
    ms = int(round((seconds - mm * 60 - ss) * 1000))
    if ms == 1000:
        ss += 1
        ms = 0
    if ss == 60:
        mm += 1
        ss = 0
    return f"{mm:02d}:{ss:02d}.{ms:03d}"


def clip(tc: str, lo: float, hi: float) -> str:
    """Clamp a timecode into [lo, hi] seconds, returned as a timecode string."""
    v = min(max(tc_to_seconds(tc), lo), hi)
    return seconds_to_tc(v)
