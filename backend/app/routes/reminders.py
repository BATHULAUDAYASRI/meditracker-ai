from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException

from app.models.schemas import RecordDoseRequest, ReminderEventOut, SetReminderRequest, ToggleReminderRequest
from app.services.store import UTC, parse_hhmm, store, utc_now

router = APIRouter(tags=["reminders"])


@router.get("/reminders", response_model=list[ReminderEventOut])
def list_reminders(user_id: str = "demo") -> list[ReminderEventOut]:
    return [ReminderEventOut(**r) for r in store.list_reminders(user_id)]


@router.post("/set-reminder", response_model=ReminderEventOut, status_code=201)
def set_reminder(body: SetReminderRequest) -> ReminderEventOut:
    row = store.add_reminder(
        user_id=body.user_id,
        medicine_name=body.medicine_name,
        time_hhmm=body.time_hhmm,
        duration_days=body.duration_days,
        priority=body.priority,
        enabled=body.enabled,
    )
    now = utc_now()
    hh, mm = parse_hhmm(row.time_hhmm)
    d = now.date()
    due = datetime(d.year, d.month, d.day, hh, mm, tzinfo=UTC)
    status = "pending" if due >= now else "missed"
    return ReminderEventOut(
        id=row.id,
        user_id=row.user_id,
        medicine_name=row.medicine_name,
        time_hhmm=row.time_hhmm,
        priority=row.priority,
        enabled=row.enabled,
        due_at=due,
        status=status,
        about_to_finish=(row.duration_end - now) <= timedelta(days=1),
        duration_end=row.duration_end,
    )


@router.post("/reminders/toggle")
def toggle_reminder(body: ToggleReminderRequest) -> dict:
    ok = store.toggle_reminder(body.user_id, body.reminder_id, body.enabled)
    if not ok:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"ok": True}


@router.post("/reminders/record-dose")
def record_dose(body: RecordDoseRequest) -> dict:
    ok = store.record_dose(body.user_id, body.reminder_id, body.due_at, body.status)
    if not ok:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"ok": True}

