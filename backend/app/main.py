"""MediTracker AI backend (FastAPI).

Implements:
  - prescription upload + (mock/AI) analysis
  - reminders (CRUD-ish: list + set + toggle + record dose)
  - pharmacy discovery + ordering (mocked)
  - mental-health oriented chatbot (OpenAI or deterministic demo fallback)
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router as chat_router
from app.routes.orders import router as orders_router
from app.routes.pharmacies import router as pharmacies_router
from app.routes.prescriptions import router as prescriptions_router
from app.routes.reminders import router as reminders_router

app = FastAPI(title="MediTracker AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prescriptions_router)
app.include_router(reminders_router)
app.include_router(pharmacies_router)
app.include_router(orders_router)
app.include_router(chat_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

