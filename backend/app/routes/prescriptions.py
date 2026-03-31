from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import AnalyzePrescriptionRequest, AnalyzePrescriptionResponse, UploadPrescriptionResponse
from app.services.ai import analyze_prescription_mock, analyze_prescription_with_openai, extract_text_mock
from app.services.store import store

router = APIRouter(tags=["prescriptions"])


@router.post("/upload-prescription", response_model=UploadPrescriptionResponse)
async def upload_prescription(file: UploadFile = File(...), user_id: str = "demo") -> UploadPrescriptionResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    await file.read()
    extracted = extract_text_mock(file.filename)
    store.upsert_extracted_text(user_id, extracted)
    return UploadPrescriptionResponse(extracted_text=extracted)


@router.post("/analyze-prescription", response_model=AnalyzePrescriptionResponse)
async def analyze_prescription(body: AnalyzePrescriptionRequest) -> AnalyzePrescriptionResponse:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    api_base_url = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
    model = os.getenv("MODEL_NAME", "gpt-4o-mini")
    raw: dict[str, Any] = {"mode": "mock"}
    if api_key:
        try:
            data = await analyze_prescription_with_openai(body.extracted_text, model, api_key, api_base_url)
            meds = data.get("medicines") or []
            return AnalyzePrescriptionResponse(medicines=meds, raw={"mode": "openai", "parsed_count": len(meds)})
        except Exception as e:
            raw["openai_error"] = str(e)
    parsed = analyze_prescription_mock(body.extracted_text)
    return AnalyzePrescriptionResponse(medicines=parsed["medicines"], raw={"mode": "mock"})

