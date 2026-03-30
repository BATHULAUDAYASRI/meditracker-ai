"""
FastAPI service exposing reset / step / state for MediTrack AI (OpenEnv-compatible).
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.env import MediTrackEnv
from app.models import Action, Observation, Reward, StepResult

app = FastAPI(title="MediTrack AI", version="1.0.0")

# Same-origin UI + optional dev servers on other ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
_INDEX = _FRONTEND_DIR / "index.html"

# Single-process episode handle (deterministic, one client at a time for demos)
_env: MediTrackEnv = MediTrackEnv(task_key="easy")


@app.get("/")
def serve_index() -> FileResponse:
    """Serve the MediTrack AI web UI."""
    return FileResponse(_INDEX)


@app.get("/reset", response_model=Observation)
def reset(task: str = Query("easy", description="Task alias: easy | medium | hard or full task_id")) -> Observation:
    """Start a new episode; optional task selection."""
    return _env.reset(task_key=task)


@app.post("/step", response_model=StepResult)
def step(action: Action) -> StepResult:
    """Advance the simulation with one OpenEnv-style action."""
    obs, reward, done, info = _env.step(action)
    return StepResult(observation=obs, reward=reward, done=done, info=info)


@app.get("/state", response_model=Observation)
def state() -> Observation:
    """Return the latest observation without advancing time."""
    return _env.state()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "meditrack-ai"}
