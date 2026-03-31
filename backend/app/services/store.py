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
        return self.created_at + timedelta(days=self.duration_days)


@dataclass
class DoseRecord:
    reminder_id: str
    due_at: datetime
    status: str
    recorded_at: datetime


class MemoryStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reminders: Dict[str, ReminderSchedule] = {}
        self.doses: Dict[Tuple[str, str, str], DoseRecord] = {}
        self.chat_history: Dict[Tuple[str, str], list[dict]] = {}
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
            row = ReminderSchedule(
                id=rid,
                user_id=user_id,
                medicine_name=medicine_name,
                time_hhmm=time_hhmm,
                priority=priority,
                enabled=enabled,
                created_at=utc_now(),
                duration_days=duration_days,
            )
            self.reminders[rid] = row
            return row

    def toggle_reminder(self, user_id: str, reminder_id: str, enabled: bool) -> bool:
        with self._lock:
            row = self.reminders.get(reminder_id)
            if not row or row.user_id != user_id:
                return False
            row.enabled = enabled
            return True

    def record_dose(self, user_id: str, reminder_id: str, due_at: datetime, status: str) -> bool:
        with self._lock:
            row = self.reminders.get(reminder_id)
            if not row or row.user_id != user_id:
                return False
            due_at = due_at.astimezone(UTC)
            key = (user_id, reminder_id, due_at.date().isoformat())
            self.doses[key] = DoseRecord(
                reminder_id=reminder_id,
                due_at=due_at,
                status=status,
                recorded_at=utc_now(),
            )
            return True

    def _due_at_for_today(self, row: ReminderSchedule, now: datetime) -> datetime:
        hh, mm = parse_hhmm(row.time_hhmm)
        d = now.date()
        return datetime(d.year, d.month, d.day, hh, mm, tzinfo=UTC)

    def list_reminders(self, user_id: str) -> list[dict]:
        now = utc_now()
        with self._lock:
            rows = [r for r in self.reminders.values() if r.user_id == user_id]

        out: list[dict] = []
        for r in rows:
            due_at = self._due_at_for_today(r, now)
            key = (user_id, r.id, due_at.date().isoformat())
            with self._lock:
                rec = self.doses.get(key)
            if not r.enabled:
                status = "pending"
            elif rec and rec.status == "taken":
                status = "taken"
            else:
                status = "missed" if due_at < now else "pending"
            out.append(
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "medicine_name": r.medicine_name,
                    "time_hhmm": r.time_hhmm,
                    "priority": r.priority,
                    "enabled": r.enabled,
                    "due_at": due_at,
                    "status": status,
                    "about_to_finish": (r.duration_end - now) <= timedelta(days=1),
                    "duration_end": r.duration_end,
                }
            )
        out.sort(key=lambda x: (-x["priority"], x["due_at"]))
        return out

    def upsert_extracted_text(self, user_id: str, extracted_text: str) -> None:
        with self._lock:
            self.prescription_last_extracted[user_id] = extracted_text

    def add_chat_message(self, user_id: str, session_id: str, role: str, content: str) -> None:
        key = (user_id, session_id)
        with self._lock:
            self.chat_history.setdefault(key, []).append(
                {"role": role, "content": content, "created_at": utc_now()}
            )

    def get_chat_history(self, user_id: str, session_id: str) -> list[dict]:
        with self._lock:
            return list(self.chat_history.get((user_id, session_id), []))


store = MemoryStore()

