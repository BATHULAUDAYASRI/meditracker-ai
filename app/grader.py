"""
Episode grader: score in [0.0, 1.0] from per-step correctness flags.

Each step's `info["action_correct"]` should reflect whether the action matched
task expectations (see MediTrackEnv.step).
"""

from __future__ import annotations

from typing import Any


def grade(actions_log: list[dict[str, Any]]) -> float:
    """
    Return fraction of steps where the action was marked correct.

    `actions_log` entries may include:
      - `action_correct` (bool): preferred
      - or legacy shape without it (counted as incorrect)
    """
    if not actions_log:
        return 0.0
    correct = sum(1 for row in actions_log if row.get("action_correct") is True)
    return correct / len(actions_log)


def grade_from_infos(infos: list[dict[str, Any]]) -> float:
    """Convenience: same metric using raw step info dicts."""
    rows = [{"action_correct": i.get("action_correct")} for i in infos]
    return grade(rows)
