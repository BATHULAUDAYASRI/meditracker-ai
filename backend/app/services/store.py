from __future__ import annotations

import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple
from uuid import uuid4


UTC = timezone.utc


def utc_now() -> datetime:
    return datetime.now(tz=UTC)


def parse_hhmm(time_hhmm: str) -> tuple[int, int]:
    parts = time_hhmm.strip().split(":")
    if len(parts) != 2:
        raise ValueError("time_hhmm must be HH:MM")
    hh = int(parts[0])
    mm = int(parts[1])
    if not (0 <= hh <= 23 and 0 <= mm <= 59):
        raise ValueError("time_hhmm out of range")
    return hh, mm


@dataclass
class ReminderSchedule:
    id: str
    user_id: str
    medicine_name: str
    time_hhmm: str
    priority: int
    enabled: bool
    created_at: datetime
    duration_days: int

    @property
    def duration_end(self) -> datetime:
        # end at end of last day in UTC
        return self.created_at + timedelta(days=self.duration_days)


@dataclass
class DoseRecord:
    reminder_id: str
    due_at: datetime
    status: str  # taken|missed
    recorded_at: datetime


class MemoryStore:
    """In-memory store for hackathon MVP.

    This keeps the app fully runnable without DB migrations.
    Production version should move to SQLite/Postgres.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reminders: Dict[str, ReminderSchedule] = {}
        # Keyed by (user_id, reminder_id, due_date_iso)
        self.doses: Dict[Tuple[str, str, str], DoseRecord] = {}
        # Chat history: (user_id, session_id) -> list of messages dicts
        self.chat_history: Dict[Tuple[str, str], list[dict]] = {}
        # Prescription history (optional)
        self.prescription_last_extracted: Dict[str, str] = {}

    def add_reminder(
        self,
        user_id: str,
        medicine_name: str,
        time_hhmm: str,
        duration_days: int,
        priority: int,
        enabled: bool,
    ) -> ReminderSchedule:
        with self._lock:
            rid = str(uuid4())
            schedule = ReminderSchedule(
                id=rid,
                user_id=user_id,
                medicine_name=medicine_name,
                time_hhmm=time_hhmm,
                priority=priority,
                enabled=enabled,
                created_at=utc_now(),
                duration_days=duration_days,
            )
            self.reminders[rid] = schedule
            return schedule

    def toggle_reminder(self, user_id: str, reminder_id: str, enabled: bool) -> bool:
        with self._lock:
            sched = self.reminders.get(reminder_id)
            if not sched or sched.user_id != user_id:
                return False
            sched.enabled = enabled
            return True

    def record_dose(self, user_id: str, reminder_id: str, due_at: datetime, status: str) -> bool:
        with self._lock:
            sched = self.reminders.get(reminder_id)
            if not sched or sched.user_id != user_id:
                return False
            # Only date part matters for "daily reminder"
            due_at = due_at.astimezone(UTC)
            due_date_iso = due_at.date().isoformat()
            key = (user_id, reminder_id, due_date_iso)
            self.doses[key] = DoseRecord(
                reminder_id=reminder_id,
                due_at=due_at,
                status=status,
                recorded_at=utc_now(),
            )
            return True

    def _due_at_for_today(self, sched: ReminderSchedule, now: datetime) -> datetime:
        hh, mm = parse_hhmm(sched.time_hhmm)
        today = now.date()
        return datetime(
            year=today.year,
            month=today.month,
            day=today.day,
            hour=hh,
            minute=mm,
            second=0,
            tzinfo=UTC,
        )

    def list_reminders(self, user_id: str) -> list[dict]:
        now = utc_now()
        out: list[dict] = []
        # Copy keys for stable ordering in multithreaded contexts
        with self._lock:
            schedules = [s for s in self.reminders.values() if s.user_id == user_id]
        for sched in schedules:
            due_at = self._due_at_for_today(sched, now)
            duration_end = sched.duration_end
            about_to_finish = duration_end - now <= timedelta(days=1)

            key = (user_id, sched.id, due_at.date().isoformat())
            rec = None
            with self._lock:
                rec = self.doses.get(key)

            if not sched.enabled:
                # If disabled, treat as pending (UI will show toggle off)
                status = "pending"
            elif rec is not None and rec.status == "taken":
                status = "taken"
            elif not sched.enabled:
                status = "pending"
            else:
                # If due is already in the past and no 'taken' record exists => missed
                status = "missed" if due_at < now else "pending"

            out.append(
                {
                    "id": sched.id,
                    "user_id": sched.user_id,
                    "medicine_name": sched.medicine_name,
                    "time_hhmm": sched.time_hhmm,
                    "priority": sched.priority,
                    "enabled": sched.enabled,
                    "due_at": due_at,
                    "status": status,
                    "about_to_finish": about_to_finish,
                    "duration_end": duration_end,
                }
            )
        # Smart prioritization: critical medicines first, then soonest due
        out.sort(key=lambda r: (-r["priority"], r["due_at"]))
        return out

    def upsert_extracted_text(self, user_id: str, extracted_text: str) -> None:
        with self._lock:
            self.prescription_last_extracted[user_id] = extracted_text

    def add_chat_message(self, user_id: str, session_id: str, role: str, content: str) -> None:
        key = (user_id, session_id)
        with self._lock:
            if key not in self.chat_history:
                self.chat_history[key] = []
            self.chat_history[key].append(
                {
                    "role": role,
                    "content": content,
                    "created_at": utc_now(),
                }
            )

    def get_chat_history(self, user_id: str, session_id: str) -> list[dict]:
        with self._lock:
            return list(self.chat_history.get((user_id, session_id), []))


store = MemoryStore()

