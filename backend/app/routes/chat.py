from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatMessageOut, ChatRequest, ChatResponse
from app.services.ai_chat import generate_chat_reply
from app.services.store import store

router = APIRouter(tags=["chatbot"])


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    reply, disclaimer = await generate_chat_reply(body.user_id, body.session_id, body.message)
    return ChatResponse(reply=reply, session_id=body.session_id, disclaimer=disclaimer)


@router.get("/chat/history", response_model=list[ChatMessageOut])
def chat_history(session_id: str = "default", user_id: str = "demo") -> list[ChatMessageOut]:
    return [ChatMessageOut(**r) for r in store.get_chat_history(user_id, session_id)]

