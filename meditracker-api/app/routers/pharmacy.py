from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import PharmacyOrder, User
from app.models.pharmacy import OrderStatus
from app.routers.patients import get_owned_patient
from app.schemas.pharmacy import OrderCreate, OrderOut, PharmacySearch, PharmacyStub
from app.services.pharmacy_stub import create_external_order_ref, nearby_pharmacies

router = APIRouter(prefix="/pharmacy", tags=["pharmacy"])


@router.post("/nearby", response_model=list[PharmacyStub])
def search_nearby(body: PharmacySearch) -> list[PharmacyStub]:
    return nearby_pharmacies(body.latitude, body.longitude, body.radius_km)


@router.post("/orders", response_model=OrderOut, status_code=201)
def create_order(
    body: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PharmacyOrder:
    get_owned_patient(db, user, body.patient_id)
    order = PharmacyOrder(
        patient_id=body.patient_id,
        medication_id=body.medication_id,
        pharmacy_name=body.pharmacy_name,
        external_order_ref=create_external_order_ref(),
        status=OrderStatus.confirmed.value,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders", response_model=list[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[PharmacyOrder]:
    from app.models import PatientProfile

    ids = [p.id for p in db.query(PatientProfile).filter(PatientProfile.owner_user_id == user.id).all()]
    if not ids:
        return []
    return (
        db.query(PharmacyOrder)
        .filter(PharmacyOrder.patient_id.in_(ids))
        .order_by(PharmacyOrder.created_at.desc())
        .all()
    )
