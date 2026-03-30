"""
Three deterministic tasks (easy / medium / hard) for MediTrack AI.

Each task defines initial medications, time step size, horizon, and grading hints.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.models import MedicationStatus


@dataclass(frozen=True)
class TaskSpec:
    """Immutable task configuration."""

    task_id: str
    difficulty: Literal["easy", "medium", "hard"]
    time_step_minutes: int
    max_steps: int
    # Initial medication rows (deep-copied into the env on reset)
    medications: tuple[MedicationStatus, ...]


def _m(
    name: str,
    next_due: int,
    interval: int = 0,
    doses_remaining: int = 1,
    satisfied: bool = False,
) -> MedicationStatus:
    return MedicationStatus(
        name=name,
        next_due_minute=next_due,
        interval_minutes=interval,
        doses_remaining=doses_remaining,
        current_dose_satisfied=satisfied,
        missed_penalty_applied=False,
    )


# Easy: three meds with staggered due times — optimal play is remind each when due.
TASK_EASY = TaskSpec(
    task_id="easy_remind_all",
    difficulty="easy",
    time_step_minutes=30,
    max_steps=40,
    medications=(
        _m("Aspirin", 60, 0, 1),
        _m("Metformin", 120, 0, 1),
        _m("Lisinopril", 180, 0, 1),
    ),
)

# Medium: first dose aligns with grid — agent may need reschedule after a miss or to fix overlap.
TASK_MEDIUM = TaskSpec(
    task_id="medium_missed_reschedule",
    difficulty="medium",
    time_step_minutes=30,
    max_steps=50,
    medications=(
        _m("Aspirin", 30, 0, 1),  # lands on clock after first tick (0->30)
        _m("Metformin", 150, 0, 1),
        _m("Insulin", 210, 0, 1),
    ),
)

# Hard: recurring doses, overlapping due windows, low step budget — wrong reminds hurt via invalid penalty.
TASK_HARD = TaskSpec(
    task_id="hard_multi_penalty",
    difficulty="hard",
    time_step_minutes=20,
    max_steps=35,
    medications=(
        _m("Med-A", 60, 120, 2),   # due 60, then 180
        _m("Med-B", 100, 0, 1),
        _m("Med-C", 100, 0, 1),    # overlap at 100
    ),
)


TASKS: dict[str, TaskSpec] = {
    TASK_EASY.task_id: TASK_EASY,
    TASK_MEDIUM.task_id: TASK_MEDIUM,
    TASK_HARD.task_id: TASK_HARD,
}

# Aliases for API query param `task=easy|medium|hard`
TASK_ALIASES: dict[str, str] = {
    "easy": TASK_EASY.task_id,
    "medium": TASK_MEDIUM.task_id,
    "hard": TASK_HARD.task_id,
}


def resolve_task_id(key: str) -> str:
    """Map short name or full task_id to canonical TASKS key."""
    k = key.strip().lower()
    if k in TASK_ALIASES:
        return TASK_ALIASES[k]
    if k in TASKS:
        return k
    return TASK_EASY.task_id
