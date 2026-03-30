"""
Deterministic baseline agent: always reminds the earliest due pending medication,
otherwise skips. Uses observation fields only (no env internals).
"""

from __future__ import annotations

from app.env import MediTrackEnv
from app.grader import grade
from app.models import Action, MedicationStatus, Observation


def _earliest_pending_med(obs: Observation) -> str | None:
    """Pick the pending dose with smallest next_due_minute, tie-break by name."""
    pending = set(obs.pending_medications)
    candidates: list[MedicationStatus] = [m for m in obs.medications if m.name in pending]
    if not candidates:
        return None
    best = min(candidates, key=lambda m: (m.next_due_minute, m.name))
    return best.name


def run(task: str = "easy") -> tuple[float, int, float]:
    """
    Run one episode until termination.
    Returns (total_reward, num_steps, grader_score).
    """
    env = MediTrackEnv(task_key=task)
    obs = env.reset(task_key=task)
    done = False
    total_reward = 0.0
    actions_log: list[dict] = []

    while not done:
        name = _earliest_pending_med(obs)
        if name is not None:
            action = Action(type="remind", medication=name)
        else:
            action = Action(type="skip")

        obs, reward, done, info = env.step(action)
        total_reward += reward.value
        row = action.model_dump()
        row["action_correct"] = info.get("action_correct", False)
        actions_log.append(row)

    score = grade(actions_log)
    return total_reward, len(actions_log), score


if __name__ == "__main__":
    import sys

    t = sys.argv[1] if len(sys.argv) > 1 else "easy"
    total, steps, g = run(t)
    print("Task:", t)
    print("Total reward:", total)
    print("Steps:", steps)
    print("Grader score:", round(g, 4))
