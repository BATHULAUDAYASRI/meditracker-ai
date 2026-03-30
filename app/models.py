"""
Pydantic models for OpenEnv-style Observation, Action, and Reward.
All schemas are deterministic and JSON-serializable.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class MedicationStatus(BaseModel):
    """Single medication with scheduling state (minutes from episode start)."""

    name: str
    # Next scheduled dose time (absolute minute in episode timeline)
    next_due_minute: int
    # Minutes between recurring doses after the last one (0 = single shot)
    interval_minutes: int = 0
    # How many doses still expected in this episode
    doses_remaining: int = 1
    # Whether the current due dose was satisfied (taken after reminder)
    current_dose_satisfied: bool = False
    # Ensures at most one -0.5 miss penalty per dose slot until recovered
    missed_penalty_applied: bool = False


class Observation(BaseModel):
    """Full environment observation returned by reset() and step()."""

    current_time_minute: int = Field(
        ...,
        description="Simulated clock in minutes from episode start.",
    )
    medications: list[MedicationStatus] = Field(default_factory=list)
    # Names of meds that are due now (due time <= current time) and not yet satisfied
    pending_medications: list[str] = Field(default_factory=list)
    taken_doses: list[str] = Field(
        default_factory=list,
        description="Medication names for which a dose was recorded as taken.",
    )
    missed_doses: list[str] = Field(
        default_factory=list,
        description="Medication names marked missed when time passed without action.",
    )
    task_id: str = ""
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    step_count: int = 0
    max_steps: int = 100
    all_complete: bool = False


class Action(BaseModel):
    """
    Agent action: remind (specific med), skip (advance only), or reschedule.
    For reschedule, provide medication and minutes from *current* time for next due.
    """

    type: Literal["remind", "skip", "reschedule"]
    medication: Optional[str] = None
    reschedule_minutes: Optional[int] = Field(
        None,
        description="For reschedule: new due offset from current_time_minute.",
    )


class Reward(BaseModel):
    """Structured reward for logging and API responses."""

    value: float = Field(..., description="Scalar reward for the last transition.")


class StepResult(BaseModel):
    """Optional wrapper for API clarity (observation, reward, done, info)."""

    observation: Observation
    reward: Reward
    done: bool
    info: dict
