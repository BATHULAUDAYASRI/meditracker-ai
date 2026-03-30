from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import PatientProfile, User
from app.services.notifications import pending_reminders_preview, refill_alerts
from app.services.prediction import predict_missed_dose_risk

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/queue")
def smart_queue(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    patient_ids = [p.id for p in db.query(PatientProfile).filter(PatientProfile.owner_user_id == user.id).all()]
    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "upcoming_reminders": pending_reminders_preview(db, patient_ids),
        "refill_alerts": refill_alerts(db, patient_ids),
    }


@router.get("/predict/missed-dose/{medication_id}")
def missed_dose_risk(
    medication_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    from app.models import Medication

    med = db.get(Medication, medication_id)
    if not med:
        return {"detail": "not found"}
    p = db.get(PatientProfile, med.patient_id)
    if not p or p.owner_user_id != user.id:
        return {"detail": "not found"}
    return predict_missed_dose_risk(db, medication_id)
