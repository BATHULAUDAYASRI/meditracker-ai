"""Parse model output and build API response."""

import json
import re
from typing import Any

from app.schemas.report import ReportAnalyzeResponse
from app.services.openai_client import analyze_report_text


async def run_report_analysis(raw_text: str) -> ReportAnalyzeResponse:
    raw = await analyze_report_text(raw_text)
    extracted: dict[str, Any] = {}
    summary = raw
    flags: list[str] = []

    try:
        # Strip markdown fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        data = json.loads(cleaned)
        if isinstance(data, dict):
            summary = str(data.get("summary", summary))
            params = data.get("parameters")
            if isinstance(params, dict):
                extracted = params
            af = data.get("abnormal_flags")
            if isinstance(af, list):
                flags = [str(x) for x in af]
    except (json.JSONDecodeError, TypeError):
        extracted = {"note": "Unstructured model output", "raw_preview": raw[:500]}
        flags = []

    return ReportAnalyzeResponse(
        extracted_parameters=extracted,
        ai_summary=summary,
        abnormal_flags=flags,
    )
