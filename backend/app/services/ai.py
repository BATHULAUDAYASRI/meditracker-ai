from __future__ import annotations

import hashlib
import json
import re
from typing import Any

from app.services.store import UTC, utc_now


def _stable_choice(text: str) -> str:
    digest = hashlib.md5((text or "").encode("utf-8")).hexdigest()
    return digest[:1]


def extract_text_mock(filename: str) -> str:
    """Deterministic mock extraction for PDFs/images.

    We do not parse real PDFs/images in this MVP. Instead we return structured,
    predictable text that downstream analysis can parse.
    """

    name_l = (filename or "prescription").lower()
    choice = _stable_choice(name_l)

    if "metformin" in name_l:
        meds = [
            ("Metformin", "500mg", ["08:00", "20:00"], 30, 2),
            ("Atorvastatin", "10mg", ["21:00"], 90, 2),
        ]
    elif "blood" in name_l or "lisinopril" in name_l:
        meds = [("Lisinopril", "10mg", ["09:00"], 180, 5)]
    else:
        if choice in ("0", "1", "2"):
            meds = [
                ("Amlodipine", "5mg", ["08:30"], 90, 5),
                ("Vitamin D3", "1000IU", ["12:00"], 60, 1),
            ]
        elif choice in ("3", "4", "5"):
            meds = [
                ("Omeprazole", "20mg", ["07:00"], 45, 3),
                ("Amoxicillin", "500mg", ["09:00", "21:00"], 7, 6),
            ]
        else:
            meds = [("Levothyroxine", "50mcg", ["06:30"], 120, 5)]

    lines: list[str] = [f"Prescription: {filename}", "Extracted:"]
    for (m, dosage, timings, dur, pr) in meds:
        lines.append(f"Medicine: {m}")
        lines.append(f"Dosage: {dosage}")
        lines.append(f"Timing: {', '.join(timings)}")
        lines.append(f"Duration: {dur} days")
        lines.append(f"Priority: {pr}")

    return "\\n".join(lines).strip()


def _extract_hhmm_list(s: str) -> list[str]:
    # HH:MM 24h (00-23)
    found = re.findall(r"\\b([01]?\\d|2[0-3]):[0-5]\\d\\b", s)
    if not found:
        return []
    # Re-find with full match to keep leading zeros; use another regex.
    return sorted(set(re.findall(r"\\b([01]?\\d|2[0-3]):[0-5]\\d\\b", s)))


def analyze_prescription_mock(extracted_text: str) -> dict[str, Any]:
    """Parse deterministic mock text into structured JSON."""

    text = extracted_text or ""
    blocks = re.split(r"Medicine:", text, flags=re.IGNORECASE)
    medicines: list[dict[str, Any]] = []

    for b in blocks[1:]:
        lines = [ln.strip() for ln in b.strip().splitlines() if ln.strip()]
        if not lines:
            continue
        name = lines[0]
        whole = "\\n".join(lines)

        dosage = ""
        m_dos = re.search(r"Dosage:\\s*([^\\n]+)", whole, flags=re.IGNORECASE)
        if m_dos:
            dosage = m_dos.group(1).strip()

        timings: list[str] = []
        m_tim = re.search(r"Timing:\\s*([^\\n]+)", whole, flags=re.IGNORECASE)
        if m_tim:
            timings = re.findall(r"\\b([01]?\\d|2[0-3]):[0-5]\\d\\b", m_tim.group(1))
            if timings:
                # Normalize to HH:MM with zero-pad.
                timings = [
                    t if len(t.split(":")[0]) == 2 else f"0{t.split(':')[0]}:{t.split(':')[1]}"
                    for t in timings
                ]

        if not timings:
            timings = re.findall(r"\\b([01]?\\d|2[0-3]):[0-5]\\d\\b", whole)
            timings = [
                t if len(t.split(":")[0]) == 2 else f"0{t.split(':')[0]}:{t.split(':')[1]}"
                for t in timings
            ]

        duration_days = 30
        m_dur = re.search(r"Duration:\\s*(\\d+)\\s*days?", whole, flags=re.IGNORECASE)
        if m_dur:
            duration_days = int(m_dur.group(1))

        priority = 1
        m_pr = re.search(r"Priority:\\s*(\\d+)", whole, flags=re.IGNORECASE)
        if m_pr:
            priority = int(m_pr.group(1))

        medicines.append(
            {
                "name": name,
                "dosage": dosage,
                "timings": sorted(set(timings)) or ["09:00"],
                "duration_days": duration_days,
                "priority": priority,
            }
        )

    if not medicines:
        medicines = [
            {
                "name": "Medication",
                "dosage": "1 dose",
                "timings": ["09:00"],
                "duration_days": 30,
                "priority": 3,
            }
        ]

    return {"medicines": medicines, "parsed_at": utc_now().isoformat()}


async def analyze_prescription_with_openai(
    extracted_text: str, model: str, api_key: str, api_base_url: str
) -> dict[str, Any]:
    """OpenAI-based structured extraction.

    Best-effort: if JSON parsing fails, caller can fall back to mock parser.
    """

    from openai import OpenAI

    client = OpenAI(api_key=api_key, base_url=api_base_url)
    system_prompt = (
        "You are a medical record extraction assistant for medication adherence. "
        "Extract medications, dosage, timing(s) in HH:MM 24h, and duration_days. "
        "Return ONLY valid JSON with this shape: "
        "{\"medicines\":[{\"name\":string,\"dosage\":string,\"timings\":[string],\"duration_days\":int,\"priority\":int}]}"
    )
    user_prompt = f"Extract from this text:\\n{extracted_text}\\n"

    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
        temperature=0.2,
        max_tokens=700,
    )
    content = (resp.choices[0].message.content or "").strip()
    cleaned = re.sub(r"^```(?:json)?\\s*", "", content)
    cleaned = re.sub(r"\\s*```$", "", cleaned)
    return json.loads(cleaned)

