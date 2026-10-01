# Shrey — Autonomous Trailer Director

Take-home build for the **OTT Dialect Platform — AI Engineering Hiring Challenge**:
an agentic system that plans **three audience-specific trailers** (Family / Young Adult /
Dialect-region) from one episode, and **proves each plan is safe, truthful and rights-clean**.

The deliverable is a precise, machine-readable **Edit Decision List (EDL)** per trailer —
not a rendered video.

## Quickstart

```bash
pip install -e .            # from repo root
pytest                      # run the test suite (deterministic mock mode, no API keys)

# regenerate the sample run (writes submission/sample_run/)
cd submission
PYTHONPATH=src python -m trailer_director run \
    --episode sample_episode --out sample_run --mode mock
```

See [`submission/README.md`](submission/README.md) for the full submission guide,
[`submission/ARCHITECTURE.md`](submission/ARCHITECTURE.md) for the design.

## What's inside

| Path | What it is |
|---|---|
| `submission/src/trailer_director/` | The agent: ingest → story map → constraint compiler → planner → validator → repair → change handler |
| `submission/sample_episode/` | Synthetic 14-minute episode package (input fixture, seeded with realistic traps) |
| `submission/sample_run/` | Generated artifacts: 3 trailer EDLs, story/constraint maps, validation report, decision log |
| `submission/tests/` | Required tests (missing scene, rights, spoiler, policy, contract change) + surprise-event tests |
| `assignment_autonomous_trailer_director (1).pdf` | The original candidate brief |

**Mock mode** is the default and fully deterministic: no API keys, no network,
reproducible output. A `live` adapter interface exists for real model backends
(see `ARCHITECTURE.md` §5 and `KNOWN_LIMITATIONS.md`).
