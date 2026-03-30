"""Build a priority-ordered reminder queue (smart notifications preview)."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Medication, Reminder


def pending_reminders_preview(db: Session, patient_ids: list[int], now: datetime | None = None) -> list[dict]:
    """Return upcoming reminders for patients owned by user, sorted by priority desc then time."""
    now = now or datetime.utcnow()
    q = (
        db.query(Reminder)
        .join(Medication)
        .filter(
            Medication.patient_id.in_(patient_ids),
            Reminder.scheduled_at >= now,
            Reminder.sent_at.is_(None),
        )
        .order_by(Reminder.priority.desc(), Reminder.scheduled_at.asc())
    )
    out: list[dict] = []
    for r in q.limit(50):
        out.append(
            {
                "reminder_id": r.id,
                "medication_id": r.medication_id,
                "scheduled_at": r.scheduled_at.isoformat(),
                "priority": r.priority,
                "channel": r.channel,
            }
        )
    return out


def refill_alerts(db: Session, patient_ids: list[int]) -> list[dict]:
    meds = (
        db.query(Medication)
        .filter(Medication.patient_id.in_(patient_ids), Medication.active.is_(True))
        .all()
    )
    alerts: list[dict] = []
    for m in meds:
        if m.quantity_remaining <= m.refill_alert_threshold:
            alerts.append(
                {
                    "medication_id": m.id,
                    "name": m.name,
                    "quantity_remaining": m.quantity_remaining,
                    "threshold": m.refill_alert_threshold,
                }
            )
    return sorted(alerts, key=lambda x: x["quantity_remaining"])
