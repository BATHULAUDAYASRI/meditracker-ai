from __future__ import annotations

import os

from openai import OpenAI

from app.services.store import store


def _demo_reply(message: str) -> tuple[str, str]:
    m = message.lower()
    if any(k in m for k in ["panic", "anxious", "anxiety", "worried"]):
        return (
            "I hear you. Try this breathing cycle: inhale 4s, hold 2s, exhale 6s for 5 rounds. "
            "Then drink water and focus on the next reminder only. "
            "If you feel unsafe, contact local emergency services.",
            "Informational only. Not medical advice.",
        )
    return (
        "I can help you stay on track. Tell me your medicine name and time, and I’ll suggest a simple routine.",
        "Informational only. Not medical advice.",
    )


async def generate_chat_reply(user_id: str, session_id: str, message: str) -> tuple[str, str]:
    store.add_chat_message(user_id, session_id, "user", message)
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("MODEL_NAME", "gpt-4o-mini")
    base = os.getenv("API_BASE_URL", "https://api.openai.com/v1")

    if not api_key:
        reply, d = _demo_reply(message)
        store.add_chat_message(user_id, session_id, "assistant", reply)
        return reply, d

    try:  # pragma: no cover
        client = OpenAI(api_key=api_key, base_url=base)
        hist = store.get_chat_history(user_id, session_id)[-12:]
        msgs = [{"role": "system", "content": "Supportive non-diagnostic health assistant."}]
        msgs += [{"role": h["role"], "content": h["content"]} for h in hist]
        resp = client.chat.completions.create(model=model, messages=msgs, temperature=0.4, max_tokens=300)
        reply = (resp.choices[0].message.content or "").strip()
        d = "Informational only. Not medical advice."
        store.add_chat_message(user_id, session_id, "assistant", reply)
        return reply, d
    except Exception:
        reply, d = _demo_reply(message)
        store.add_chat_message(user_id, session_id, "assistant", reply)
        return reply, d

