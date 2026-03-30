"""MediTracker AI — FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.models import (  # noqa: F401 - register metadata
    Appointment,
    ChatMessage,
    DoseLog,
    MedicalReport,
    Medication,
    PatientProfile,
    PharmacyOrder,
    Reminder,
    User,
)
from app.routers import appointments, auth, chat, medications, notifications, patients, pharmacy, reports

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = "/api/v1"
app.include_router(auth.router, prefix=api)
app.include_router(patients.router, prefix=api)
app.include_router(medications.router, prefix=api)
app.include_router(appointments.router, prefix=api)
app.include_router(reports.router, prefix=api)
app.include_router(pharmacy.router, prefix=api)
app.include_router(chat.router, prefix=api)
app.include_router(notifications.router, prefix=api)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "meditracker-ai"}
