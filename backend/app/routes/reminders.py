from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    RecordDoseRequest,
    ReminderEventOut,
    SetReminderRequest,
    ToggleReminderRequest,
)
from app.services.store import UTC, parse_hhmm, store, utc_now

router = APIRouter(tags=["reminders"])


@router.get("/reminders", response_model=list[ReminderEventOut])
def list_reminders(user_id: str = "demo") -> list[ReminderEventOut]:
    return [ReminderEventOut(**row) for row in store.list_reminders(user_id=user_id)]


@router.post("/set-reminder", response_model=ReminderEventOut, status_code=201)
def set_reminder(body: SetReminderRequest) -> ReminderEventOut:
    sched = store.add_reminder(
        user_id=body.user_id,
        medicine_name=body.medicine_name,
        time_hhmm=body.time_hhmm,
        duration_days=body.duration_days,
        priority=body.priority,
        enabled=body.enabled,
    )

    # Compute the event for "today" (UTC).
    now = utc_now()
    hh, mm = parse_hhmm(sched.time_hhmm)
    today = now.date()
    due_at = datetime(
        year=today.year,
        month=today.month,
        day=today.day,
        hour=hh,
        minute=mm,
        second=0,
        tzinfo=UTC,
    )
    duration_end = sched.duration_end
    about_to_finish = duration_end - now <= timedelta(days=1)
    status = "pending" if due_at >= now and sched.enabled else ("missed" if sched.enabled else "pending")

    return ReminderEventOut(
        id=sched.id,
        user_id=sched.user_id,
        medicine_name=sched.medicine_name,
        time_hhmm=sched.time_hhmm,
        priority=sched.priority,
        enabled=sched.enabled,
        due_at=due_at,
        status=status,
        about_to_finish=about_to_finish,
        duration_end=duration_end,
    )


@router.post("/reminders/toggle", status_code=200)
def toggle_reminder(body: ToggleReminderRequest) -> dict:
    ok = store.toggle_reminder(
        user_id=body.user_id, reminder_id=body.reminder_id, enabled=body.enabled
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"ok": True}


@router.post("/reminders/record-dose", status_code=200)
def record_dose(body: RecordDoseRequest) -> dict:
    ok = store.record_dose(
        user_id=body.user_id,
        reminder_id=body.reminder_id,
        due_at=body.due_at,
        status=body.status,
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"ok": True}

