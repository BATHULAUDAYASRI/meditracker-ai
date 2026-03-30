from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class UploadPrescriptionResponse(BaseModel):
    extracted_text: str


class AnalyzePrescriptionRequest(BaseModel):
    extracted_text: str = Field(min_length=1)
    user_id: str = "demo"


class MedicineExtraction(BaseModel):
    name: str
    dosage: str
    timings: list[str] = Field(
        description="List of times in HH:MM (24h), e.g. ['08:00','20:00']"
    )
    duration_days: int = Field(ge=1, le=3650)
    priority: int = Field(ge=1, le=10, description="Higher means more critical")


class AnalyzePrescriptionResponse(BaseModel):
    medicines: list[MedicineExtraction]
    raw: dict[str, Any] = Field(
        default_factory=dict,
        description="Optional debug info such as parsing metadata.",
    )


class SetReminderRequest(BaseModel):
    user_id: str = "demo"
    medicine_name: str
    time_hhmm: str = Field(
        description="Time in HH:MM, e.g. 08:00"
    )
    duration_days: int = Field(ge=1, le=3650)
    priority: int = Field(ge=1, le=10, description="Higher priority comes first")
    enabled: bool = True


class ReminderEventOut(BaseModel):
    id: str
    user_id: str
    medicine_name: str
    time_hhmm: str
    priority: int
    enabled: bool
    due_at: datetime
    # One of: pending | taken | missed
    status: Literal["pending", "taken", "missed"]
    about_to_finish: bool
    duration_end: datetime


class ToggleReminderRequest(BaseModel):
    reminder_id: str
    enabled: bool
    user_id: str = "demo"


class RecordDoseRequest(BaseModel):
    reminder_id: str
    due_at: datetime
    status: Literal["taken", "missed"]
    user_id: str = "demo"


class PharmacyOut(BaseModel):
    id: str
    name: str
    address: str
    distance_km: float
    rating: float
    phone: str | None = None


class OrderMedicineRequest(BaseModel):
    user_id: str = "demo"
    medication_name: str
    pharmacy_id: str
    quantity: int = Field(default=30, ge=1, le=1000)
    refill: bool = False


class OrderMedicineOut(BaseModel):
    order_id: str
    status: Literal["confirmed", "cancelled"]
    medication_name: str
    pharmacy_id: str
    quantity: int
    refill: bool
    created_at: datetime
    estimated_delivery: str


class ChatRequest(BaseModel):
    user_id: str = "demo"
    session_id: str = "default"
    message: str = Field(min_length=1, max_length=8000)


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    disclaimer: str = (
        "Informational only. Not medical advice. "
        "If you're in crisis, contact local emergency services."
    )


class ChatMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime

