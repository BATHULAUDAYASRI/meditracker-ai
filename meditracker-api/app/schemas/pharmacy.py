from datetime import datetime

from pydantic import BaseModel, Field


class PharmacySearch(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 5.0


class PharmacyStub(BaseModel):
    name: str
    address: str
    distance_km: float


class OrderCreate(BaseModel):
    patient_id: int
    medication_id: int | None = None
    pharmacy_name: str = Field(..., min_length=1)


class OrderOut(BaseModel):
    id: int
    patient_id: int
    medication_id: int | None
    pharmacy_name: str
    external_order_ref: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
