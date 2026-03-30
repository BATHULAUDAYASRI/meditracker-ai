from datetime import datetime

from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    title: str = Field(..., min_length=1)
    doctor_name: str | None = None
    location: str | None = None
    scheduled_at: datetime
    notes: str | None = None


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    title: str
    doctor_name: str | None
    location: str | None
    scheduled_at: datetime
    suggested_next_at: datetime | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
