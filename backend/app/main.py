"""MediTracker AI backend (FastAPI).

Implements:
  - prescription upload + (mock/AI) analysis
  - reminders (CRUD-ish: list + set + toggle + record dose)
  - pharmacy discovery + ordering (mocked)
  - mental-health oriented chatbot (OpenAI or deterministic demo fallback)
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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

root_dir = Path(__file__).resolve().parents[2]  # repo root
app_static_dir = Path(__file__).resolve().parent / "static"  # set by Docker
repo_frontend_dist_dir = root_dir / "frontend" / "dist"  # local dev helper

static_dir = app_static_dir if app_static_dir.exists() else repo_frontend_dist_dir

if (static_dir / "index.html").exists():
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static-assets")

    @app.get("/")
    def serve_frontend() -> FileResponse:
        return FileResponse(static_dir / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

