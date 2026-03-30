from datetime import date, datetime

from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    display_name: str = Field(..., min_length=1)
    date_of_birth: date | None = None
    relationship_note: str = "self"
    notes: str | None = None


class PatientOut(BaseModel):
    id: int
    owner_user_id: int
    display_name: str
    date_of_birth: date | None
    relationship_note: str
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
