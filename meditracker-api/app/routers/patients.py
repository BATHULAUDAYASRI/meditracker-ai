from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import PatientProfile, User
from app.schemas.patient import PatientCreate, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientOut])
def list_patients(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[PatientProfile]:
    return db.query(PatientProfile).filter(PatientProfile.owner_user_id == user.id).all()


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(
    body: PatientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PatientProfile:
    p = PatientProfile(
        owner_user_id=user.id,
        display_name=body.display_name,
        date_of_birth=body.date_of_birth,
        relationship_note=body.relationship_note,
        notes=body.notes,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def get_owned_patient(db: Session, user: User, patient_id: int) -> PatientProfile:
    p = db.get(PatientProfile, patient_id)
    if not p or p.owner_user_id != user.id:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p
