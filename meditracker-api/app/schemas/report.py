from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ReportAnalyzeResponse(BaseModel):
    extracted_parameters: dict[str, Any]
    ai_summary: str
    abnormal_flags: list[str] = Field(default_factory=list)
    disclaimer: str = (
        "Informational only. Not medical advice. Consult a licensed professional for diagnosis or treatment."
    )


class ReportOut(BaseModel):
    id: int
    patient_id: int
    original_filename: str
    extracted_parameters: dict | None
    ai_summary: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
