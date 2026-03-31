from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import PharmacyOut
from app.services.pharmacy_stub import nearby_pharmacies

router = APIRouter(tags=["pharmacy"])


@router.get("/pharmacies", response_model=list[PharmacyOut])
def get_pharmacies(lat: float | None = None, lng: float | None = None, radius_km: float = 5.0) -> list[PharmacyOut]:
    return [PharmacyOut(**r) for r in nearby_pharmacies(lat=lat, lng=lng, radius_km=radius_km)]

