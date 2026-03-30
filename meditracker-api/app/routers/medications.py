from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import DoseLog, Medication, Reminder, User
from app.routers.patients import get_owned_patient
from app.schemas.medication import DoseRecord, MedicationCreate, MedicationOut, ReminderCreate, ReminderOut

router = APIRouter(prefix="/patients/{patient_id}/medications", tags=["medications"])


@router.get("", response_model=list[MedicationOut])
def list_medications(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Medication]:
    get_owned_patient(db, user, patient_id)
    return db.query(Medication).filter(Medication.patient_id == patient_id).all()


@router.post("", response_model=MedicationOut, status_code=201)
def create_medication(
    patient_id: int,
    body: MedicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Medication:
    get_owned_patient(db, user, patient_id)
    m = Medication(
        patient_id=patient_id,
        name=body.name,
        dosage=body.dosage,
        instructions=body.instructions,
        quantity_remaining=body.quantity_remaining,
        refill_alert_threshold=body.refill_alert_threshold,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.post("/{medication_id}/reminders", response_model=ReminderOut, status_code=201)
def create_reminder(
    patient_id: int,
    medication_id: int,
    body: ReminderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Reminder:
    get_owned_patient(db, user, patient_id)
    med = db.get(Medication, medication_id)
    if not med or med.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Medication not found")
    r = Reminder(
        medication_id=medication_id,
        scheduled_at=body.scheduled_at,
        priority=body.priority,
        channel=body.channel,
        message=body.message,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.post("/{medication_id}/doses", status_code=201)
def record_dose(
    patient_id: int,
    medication_id: int,
    body: DoseRecord,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    get_owned_patient(db, user, patient_id)
    med = db.get(Medication, medication_id)
    if not med or med.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Medication not found")
    if body.status not in ("taken", "missed", "skipped"):
        raise HTTPException(status_code=400, detail="Invalid status")
    log = DoseLog(
        medication_id=medication_id,
        scheduled_for=body.scheduled_for,
        status=body.status,
        recorded_at=datetime.utcnow(),
    )
    db.add(log)
    if body.status == "taken" and med.quantity_remaining > 0:
        med.quantity_remaining -= 1
    db.commit()
    return {"dose_log_id": log.id, "quantity_remaining": med.quantity_remaining}
