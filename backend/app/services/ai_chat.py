from __future__ import annotations

import os
import re

from openai import OpenAI

from app.services.store import store


SYSTEM_PROMPT = (
    "You are a supportive, calm chatbot for a medication reminder app. "
    "You do NOT diagnose conditions and you do NOT provide emergency care. "
    "If the user expresses self-harm, suicide, or imminent danger, instruct them to contact local emergency services. "
    "Otherwise, respond with grounding, breathing suggestions, and practical next steps. "
    "Keep the response concise and kind."
)


def _demo_reply(message: str) -> tuple[str, str]:
    m = message.lower()
    if any(k in m for k in ["panic", "panicking", "anxious", "anxiety", "worried", "can't breathe", "breathless"]):
        return (
            "I’m really glad you reached out. Let’s slow things down together: try this simple breathing cycle—inhale for 4 seconds, hold for 2, exhale for 6. Repeat 5 times.\n\n"
            "Next, pick one practical step: check the time of your last medication reminder, and set a quick timer so it’s easier to follow the schedule. "
            "If you have a severe symptom or you feel unsafe, please contact local emergency services or a trusted person right now.",
            "Informational only. Not medical advice. If you are in crisis, contact local emergency services.",
        )
    if any(k in m for k in ["missed dose", "miss", "forgot", "forgotten"]):
        return (
            "That’s stressful—thank you for being honest. In general, if you missed a dose, follow the instructions on your prescription label or the advice from your pharmacist/doctor. "
            "If you’re unsure whether to take it now, wait and contact a clinician for guidance. "
            "For today, you can set a reminder for the next scheduled dose so you stay on track.",
            "Informational only. Not medical advice. Please consult your clinician/pharmacist for personalized instructions.",
        )
    return (
        "I hear you. Let’s focus on one step right now. "
        "What’s the next medication or appointment you’re trying to remember? "
        "If you share the medicine name and the time, I can help you plan a simple reminder for today.",
        "Informational only. Not medical advice. If you are in crisis, contact local emergency services.",
    )


async def generate_chat_reply(user_id: str, session_id: str, message: str) -> tuple[str, str]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    api_base_url = os.getenv("API_BASE_URL", "https://api.openai.com/v1").strip()
    model = os.getenv("MODEL_NAME", "gpt-4o-mini").strip()

    # Save user message first (for UI history)
    store.add_chat_message(user_id=user_id, session_id=session_id, role="user", content=message)

    if not api_key:
        reply, disclaimer = _demo_reply(message)
        store.add_chat_message(user_id=user_id, session_id=session_id, role="assistant", content=reply)
        return reply, disclaimer

    try:  # pragma: no cover
        client = OpenAI(api_key=api_key, base_url=api_base_url)
        history = store.get_chat_history(user_id=user_id, session_id=session_id)
        # Keep last 12 messages to stay within token limits.
        history = history[-12:]
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for row in history:
            messages.append({"role": row["role"], "content": row["content"]})
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.4,
            max_tokens=400,
        )
        reply = (resp.choices[0].message.content or "").strip()
        disclaimer = (
            "Informational only. Not medical advice. "
            "If you're in crisis, contact local emergency services."
        )
        store.add_chat_message(user_id=user_id, session_id=session_id, role="assistant", content=reply)
        return reply, disclaimer
    except Exception:
        reply, disclaimer = _demo_reply(message)
        return reply, disclaimer

