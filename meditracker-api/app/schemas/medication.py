from datetime import datetime

from pydantic import BaseModel, Field


class MedicationCreate(BaseModel):
    name: str = Field(..., min_length=1)
    dosage: str = ""
    instructions: str | None = None
    quantity_remaining: int = 30
    refill_alert_threshold: int = 5


class MedicationOut(BaseModel):
    id: int
    patient_id: int
    name: str
    dosage: str
    instructions: str | None
    quantity_remaining: int
    refill_alert_threshold: int
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReminderCreate(BaseModel):
    scheduled_at: datetime
    priority: int = 1
    channel: str = "push"
    message: str | None = None


class ReminderOut(BaseModel):
    id: int
    medication_id: int
    scheduled_at: datetime
    priority: int
    channel: str
    sent_at: datetime | None
    message: str | None

    model_config = {"from_attributes": True}


class DoseRecord(BaseModel):
    scheduled_for: datetime
    status: str  # taken | missed | skipped
