"""OpenAI client configured from environment (API_BASE_URL + MODEL_NAME)."""

import asyncio

from openai import OpenAI

from app.config import get_settings


def get_openai_client() -> OpenAI | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    return OpenAI(api_key=settings.openai_api_key, base_url=settings.api_base_url)


def chat_completion_sync(system_prompt: str, user_message: str) -> str:
    settings = get_settings()
    client = get_openai_client()
    if not client:
        return (
            "[Demo mode: set OPENAI_API_KEY] I'm here to help you ground yourself. "
            "Try slow breathing: inhale 4 seconds, hold 2, exhale 6. "
            "If you feel unsafe, please contact local emergency services."
        )
    r = client.chat.completions.create(
        model=settings.model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.5,
        max_tokens=500,
    )
    return (r.choices[0].message.content or "").strip()


async def chat_completion(system_prompt: str, user_message: str) -> str:
    return await asyncio.to_thread(chat_completion_sync, system_prompt, user_message)


def analyze_report_text_sync(report_text: str) -> str:
    """Ask model to emit JSON-friendly summary; caller parses."""
    settings = get_settings()
    client = get_openai_client()
    prompt = (
        "You are a clinical documentation assistant. Extract key numeric labs/vitals if present, "
        "list any clearly abnormal values, and give a short non-diagnostic summary. "
        "Respond as JSON with keys: summary (string), parameters (object), abnormal_flags (array of strings)."
    )
    if not client:
        return '{"summary":"Demo mode: add OPENAI_API_KEY for AI extraction.","parameters":{},"abnormal_flags":[]}'
    r = client.chat.completions.create(
        model=settings.model_name,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": report_text[:12000]},
        ],
        temperature=0.2,
        max_tokens=800,
    )
    return (r.choices[0].message.content or "").strip()


async def analyze_report_text(report_text: str) -> str:
    return await asyncio.to_thread(analyze_report_text_sync, report_text)
