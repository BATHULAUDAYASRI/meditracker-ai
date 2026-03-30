"""
MediTrack AI environment: step / reset / state with deterministic dynamics.
"""

from __future__ import annotations

import copy
from typing import Any, Optional

from app.models import Action, MedicationStatus, Observation, Reward
from app.tasks import TASKS, TaskSpec, resolve_task_id

# Reward constants (spec)
R_CORRECT_REMIND = 0.5
R_MISSED_DOSE = -0.5
R_INVALID_ACTION = -0.2
R_ALL_COMPLETE = 1.0
R_RESCHEDULE_OK = 0.15  # small positive for proper reschedule


class MediTrackEnv:
    """
    OpenEnv-style environment:
      - reset() -> Observation
      - step(action) -> (Observation, Reward, done, info)
      - state() -> Observation
    """

    def __init__(self, task_key: str = "easy") -> None:
        self._task_id = resolve_task_id(task_key)
        self._spec: TaskSpec = TASKS[self._task_id]
        self._time: int = 0
        self._meds: list[MedicationStatus] = []
        self._step_count: int = 0
        self._taken_log: list[str] = []
        self._missed_events: list[str] = []

    def reset(self, task_key: Optional[str] = None) -> Observation:
        """Start a new episode from task configuration."""
        if task_key is not None:
            self._task_id = resolve_task_id(task_key)
            self._spec = TASKS[self._task_id]
        self._time = 0
        self._step_count = 0
        self._taken_log = []
        self._missed_events = []
        self._meds = [copy.deepcopy(m) for m in self._spec.medications]
        return self._build_observation()

    def state(self) -> Observation:
        """Return observation without mutating state."""
        return self._build_observation()

    def step(self, action: Action) -> tuple[Observation, Reward, bool, dict[str, Any]]:
        """
        One transition: apply action, advance time, detect missed doses, check termination.
        Returns (observation, Reward, done, info).
        """
        reward_val = 0.0
        info: dict[str, Any] = {
            "action_correct": False,
            "invalid": False,
            "task_id": self._task_id,
        }

        dt = self._spec.time_step_minutes

        # Snapshot pending before action — used to judge whether "skip" was appropriate
        had_pending = bool(self._pending_names())

        # 1) Apply agent action at current time
        if action.type == "remind":
            reward_val, ok = self._apply_remind(action.medication)
            info["action_correct"] = ok
            if not ok and action.medication is not None:
                info["invalid"] = True
        elif action.type == "skip":
            # Skip is "correct" only when there was nothing due to act on
            info["action_correct"] = not had_pending
        elif action.type == "reschedule":
            reward_val, ok = self._apply_reschedule(action.medication, action.reschedule_minutes)
            info["action_correct"] = ok
            if not ok:
                info["invalid"] = True
        else:
            reward_val = R_INVALID_ACTION
            info["invalid"] = True

        # 2) Advance simulated clock
        self._time += dt
        self._step_count += 1

        # 3) Missed doses: any unsatisfied dose whose due time is strictly before new time
        missed_penalty = self._detect_and_apply_missed()
        reward_val += missed_penalty

        # 4) Completion bonus (all doses finished)
        all_done = self._all_medications_finished()
        if all_done:
            reward_val += R_ALL_COMPLETE
            info["action_correct"] = True

        obs = self._build_observation()
        done = all_done or self._step_count >= self._spec.max_steps

        info["all_complete"] = all_done
        info["total_reward_delta"] = reward_val

        return obs, Reward(value=reward_val), done, info

    def _pending_names(self) -> list[str]:
        names: list[str] = []
        for m in self._meds:
            if m.doses_remaining <= 0:
                continue
            if m.next_due_minute <= self._time and not m.current_dose_satisfied:
                names.append(m.name)
        return sorted(names)

    def _earliest_pending_med(self) -> Optional[MedicationStatus]:
        """Deterministic target for 'optimal' remind: earliest due among pending."""
        pending = [m for m in self._meds if m.doses_remaining > 0 and m.next_due_minute <= self._time and not m.current_dose_satisfied]
        if not pending:
            return None
        return min(pending, key=lambda x: (x.next_due_minute, x.name))

    def _apply_remind(self, medication: Optional[str]) -> tuple[float, bool]:
        if not medication:
            return R_INVALID_ACTION, False
        target = self._earliest_pending_med()
        if target is None:
            return R_INVALID_ACTION, False
        # Correct if reminding the medication that is earliest due among pending
        if medication != target.name:
            return R_INVALID_ACTION, False
        # Satisfy current dose
        reward = R_CORRECT_REMIND
        self._finalize_dose_taken(target)
        self._taken_log.append(target.name)
        return reward, True

    def _finalize_dose_taken(self, m: MedicationStatus) -> None:
        m.missed_penalty_applied = False
        m.current_dose_satisfied = True
        m.doses_remaining -= 1
        if m.doses_remaining > 0 and m.interval_minutes > 0:
            m.next_due_minute = self._time + m.interval_minutes
            m.current_dose_satisfied = False
        # If no more doses, leave satisfied True as completion marker

    def _apply_reschedule(self, medication: Optional[str], minutes: Optional[int]) -> tuple[float, bool]:
        if medication is None or minutes is None:
            return R_INVALID_ACTION, False
        if minutes < 0:
            return R_INVALID_ACTION, False
        med = self._find_med(medication)
        if med is None or med.doses_remaining <= 0:
            return R_INVALID_ACTION, False
        # Proper reschedule: dose is overdue or marked missed (unsatisfied with due in the past)
        overdue = med.next_due_minute < self._time and not med.current_dose_satisfied
        due_now = med.next_due_minute <= self._time and not med.current_dose_satisfied
        if not (overdue or due_now):
            return R_INVALID_ACTION, False
        med.missed_penalty_applied = False
        med.next_due_minute = self._time + minutes
        med.current_dose_satisfied = False
        return R_RESCHEDULE_OK, True

    def _find_med(self, name: str) -> Optional[MedicationStatus]:
        for m in self._meds:
            if m.name == name:
                return m
        return None

    def _detect_and_apply_missed(self) -> float:
        """
        After time moves forward, any dose strictly past due and unsatisfied incurs
        one miss penalty per dose slot (tracked via missed_penalty_applied).
        """
        penalty = 0.0
        for m in self._meds:
            if m.doses_remaining <= 0:
                continue
            if m.next_due_minute < self._time and not m.current_dose_satisfied:
                if not m.missed_penalty_applied:
                    penalty += R_MISSED_DOSE
                    m.missed_penalty_applied = True
                    self._missed_events.append(m.name)
                # Keep dose active at the new clock edge until remind/reschedule resolves it
                m.next_due_minute = self._time
        return penalty

    def _all_medications_finished(self) -> bool:
        return all(m.doses_remaining <= 0 for m in self._meds)

    def _build_observation(self) -> Observation:
        return Observation(
            current_time_minute=self._time,
            medications=[copy.deepcopy(m) for m in self._meds],
            pending_medications=self._pending_names(),
            taken_doses=list(self._taken_log),
            missed_doses=list(self._missed_events),
            task_id=self._task_id,
            difficulty=self._spec.difficulty,
            step_count=self._step_count,
            max_steps=self._spec.max_steps,
            all_complete=self._all_medications_finished(),
        )
