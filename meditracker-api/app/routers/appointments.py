from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Appointment, User
from app.routers.patients import get_owned_patient
from app.schemas.appointment import AppointmentCreate, AppointmentOut

router = APIRouter(prefix="/patients/{patient_id}/appointments", tags=["appointments"])


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Appointment]:
    get_owned_patient(db, user, patient_id)
    return db.query(Appointment).filter(Appointment.patient_id == patient_id).order_by(Appointment.scheduled_at).all()


@router.post("", response_model=AppointmentOut, status_code=201)
def create_appointment(
    patient_id: int,
    body: AppointmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Appointment:
    get_owned_patient(db, user, patient_id)
    # Simple rule: suggest annual follow-up (demo "AI prediction")
    suggested = body.scheduled_at + timedelta(days=365)
    appt = Appointment(
        patient_id=patient_id,
        title=body.title,
        doctor_name=body.doctor_name,
        location=body.location,
        scheduled_at=body.scheduled_at,
        suggested_next_at=suggested,
        notes=body.notes,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt
