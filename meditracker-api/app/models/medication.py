from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DoseStatus(str, Enum):
    pending = "pending"
    taken = "taken"
    missed = "missed"
    skipped = "skipped"


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient_profiles.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    dosage: Mapped[str] = mapped_column(String(128), default="")  # e.g. "500mg"
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Quantity tracking for refill alerts
    quantity_remaining: Mapped[int] = mapped_column(Integer, default=30)
    refill_alert_threshold: Mapped[int] = mapped_column(Integer, default=5)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped["PatientProfile"] = relationship("PatientProfile", back_populates="medications")
    reminders: Mapped[list["Reminder"]] = relationship(
        "Reminder", back_populates="medication", cascade="all, delete-orphan"
    )
    dose_logs: Mapped[list["DoseLog"]] = relationship(
        "DoseLog", back_populates="medication", cascade="all, delete-orphan"
    )


class Reminder(Base):
    """Scheduled reminder instance (next fire + priority for smart notifications)."""

    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id", ondelete="CASCADE"), index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    priority: Mapped[int] = mapped_column(Integer, default=1)  # higher = more critical
    channel: Mapped[str] = mapped_column(String(32), default="push")  # push | sms | email
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    medication: Mapped["Medication"] = relationship("Medication", back_populates="reminders")


class DoseLog(Base):
    """Tracks scheduled doses and outcomes (taken / missed) for analytics."""

    __tablename__ = "dose_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id", ondelete="CASCADE"), index=True)
    scheduled_for: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(16), default=DoseStatus.pending.value)
    recorded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    medication: Mapped["Medication"] = relationship("Medication", back_populates="dose_logs")
