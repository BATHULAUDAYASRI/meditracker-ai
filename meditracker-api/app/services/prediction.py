"""Lightweight heuristic for missed-dose risk (placeholder for ML in production)."""

from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import DoseLog, Medication


def predict_missed_dose_risk(db: Session, medication_id: int) -> dict:
    """
    Score 0-1 based on recent missed fraction in the last 14 days.
    Replace with trained model + user features when scaling.
    """
    since = datetime.utcnow() - timedelta(days=14)
    rows = (
        db.query(DoseLog.status, func.count())
        .filter(DoseLog.medication_id == medication_id, DoseLog.scheduled_for >= since)
        .group_by(DoseLog.status)
        .all()
    )
    counts = {status: c for status, c in rows}
    total = sum(counts.values()) or 1
    missed = counts.get("missed", 0)
    risk = min(1.0, missed / total)
    med = db.get(Medication, medication_id)
    return {
        "medication_id": medication_id,
        "missed_fraction_14d": round(missed / total, 3),
        "risk_score": round(risk, 3),
        "note": "Heuristic baseline; integrate calendar adherence + IoT pillbox events for production.",
    }
