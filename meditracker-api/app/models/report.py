from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MedicalReport(Base):
    """Uploaded report with extracted parameters and AI summary (non-diagnostic)."""

    __tablename__ = "medical_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient_profiles.id", ondelete="CASCADE"), index=True)
    original_filename: Mapped[str] = mapped_column(String(512))
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Structured extraction: e.g. {"glucose_mg_dl": 102, "flags": ["borderline"]}
    extracted_parameters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped["PatientProfile"] = relationship("PatientProfile")
