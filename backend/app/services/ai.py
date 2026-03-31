from __future__ import annotations

import hashlib
import json
import re
from typing import Any

from app.services.store import utc_now


def _stable_choice(text: str) -> str:
    return hashlib.md5((text or "").encode("utf-8")).hexdigest()[:1]


def extract_text_mock(filename: str) -> str:
    name_l = (filename or "prescription").lower()
    c = _stable_choice(name_l)
    if "metformin" in name_l:
        meds = [
            ("Metformin", "500mg", ["08:00", "20:00"], 30, 6),
            ("Atorvastatin", "10mg", ["21:00"], 90, 7),
        ]
    elif c in ("0", "1", "2"):
        meds = [("Amlodipine", "5mg", ["08:30"], 90, 5)]
    elif c in ("3", "4", "5"):
        meds = [("Amoxicillin", "500mg", ["09:00", "21:00"], 7, 8)]
    else:
        meds = [("Levothyroxine", "50mcg", ["06:30"], 120, 6)]

    lines = [f"Prescription: {filename}", "Extracted:"]
    for m, dose, t, d, p in meds:
        lines += [
            f"Medicine: {m}",
            f"Dosage: {dose}",
            f"Timing: {', '.join(t)}",
            f"Duration: {d} days",
            f"Priority: {p}",
        ]
    return "\n".join(lines)


def analyze_prescription_mock(extracted_text: str) -> dict[str, Any]:
    blocks = re.split(r"Medicine:", extracted_text or "", flags=re.IGNORECASE)
    meds: list[dict[str, Any]] = []
    for b in blocks[1:]:
        lines = [ln.strip() for ln in b.strip().splitlines() if ln.strip()]
        if not lines:
            continue
        name = lines[0]
        whole = "\n".join(lines)
        dosage = re.search(r"Dosage:\s*([^\n]+)", whole, flags=re.I)
        timing_line = re.search(r"Timing:\s*([^\n]+)", whole, flags=re.I)
        duration = re.search(r"Duration:\s*(\d+)\s*days?", whole, flags=re.I)
        priority = re.search(r"Priority:\s*(\d+)", whole, flags=re.I)
        timings = re.findall(r"\b([0-2]?\d:[0-5]\d)\b", timing_line.group(1) if timing_line else "")
        meds.append(
            {
                "name": name,
                "dosage": dosage.group(1).strip() if dosage else "1 dose",
                "timings": timings or ["09:00"],
                "duration_days": int(duration.group(1)) if duration else 30,
                "priority": int(priority.group(1)) if priority else 5,
            }
        )
    if not meds:
        meds = [{"name": "Medication", "dosage": "1 dose", "timings": ["09:00"], "duration_days": 30, "priority": 5}]
    return {"medicines": meds, "parsed_at": utc_now().isoformat()}


async def analyze_prescription_with_openai(
    extracted_text: str, model: str, api_key: str, api_base_url: str
) -> dict[str, Any]:
    from openai import OpenAI

    client = OpenAI(api_key=api_key, base_url=api_base_url)
    prompt = (
        "Return valid JSON with key medicines as list of objects having "
        "name, dosage, timings (HH:MM list), duration_days, priority(1-10)."
    )
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": prompt}, {"role": "user", "content": extracted_text}],
        temperature=0.2,
        max_tokens=600,
    )
    text = (resp.choices[0].message.content or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)

