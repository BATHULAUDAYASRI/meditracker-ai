from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import (
    AnalyzePrescriptionRequest,
    AnalyzePrescriptionResponse,
    UploadPrescriptionResponse,
)
from app.services.ai import (
    analyze_prescription_mock,
    analyze_prescription_with_openai,
    extract_text_mock,
)
from app.services.store import store, utc_now

router = APIRouter(tags=["prescriptions"])


@router.post("/upload-prescription", response_model=UploadPrescriptionResponse)
async def upload_prescription(file: UploadFile = File(...), user_id: str = "demo") -> UploadPrescriptionResponse:
    # We accept PDF/image files but keep extraction deterministic (mock) for MVP.
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    # Read to simulate upload processing; we ignore the bytes for mock extraction.
    await file.read()

    extracted_text = extract_text_mock(file.filename)
    store.upsert_extracted_text(user_id=user_id, extracted_text=extracted_text)
    return UploadPrescriptionResponse(extracted_text=extracted_text)


@router.post("/analyze-prescription", response_model=AnalyzePrescriptionResponse)
async def analyze_prescription(body: AnalyzePrescriptionRequest) -> AnalyzePrescriptionResponse:
    extracted_text = body.extracted_text
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    api_base_url = os.getenv("API_BASE_URL", "https://api.openai.com/v1").strip()
    model = os.getenv("MODEL_NAME", "gpt-4o-mini").strip()

    raw: dict[str, Any] = {"mode": "mock"}
    if api_key:
        try:
            data = await analyze_prescription_with_openai(
                extracted_text=extracted_text,
                model=model,
                api_key=api_key,
                api_base_url=api_base_url,
            )
            # Normalize for safety: ensure shape
            meds = data.get("medicines") or []
            raw["mode"] = "openai"
            raw["parsed_count"] = len(meds)
            return AnalyzePrescriptionResponse(medicines=meds, raw=raw)
        except Exception as e:  # pragma: no cover
            raw["openai_error"] = str(e)

    parsed = analyze_prescription_mock(extracted_text=extracted_text)
    return AnalyzePrescriptionResponse(
        medicines=parsed["medicines"],
        raw={"mode": "mock", **{k: v for k, v in parsed.items() if k != "medicines"}},
    )

