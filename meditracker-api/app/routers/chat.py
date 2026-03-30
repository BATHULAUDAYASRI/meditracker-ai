import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import ChatMessage, User
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessageOut
from app.services.openai_client import chat_completion

router = APIRouter(prefix="/chat", tags=["chat"])


SYSTEM_PROMPT = (
    "You are a supportive, calm assistant for a health app. "
    "Do not diagnose. If the user describes self-harm, suicide, or emergency, "
    "tell them to contact local emergency services immediately. "
    "Use short paragraphs, grounding techniques, and gentle tone."
)


@router.post("/message", response_model=ChatResponse)
async def send_message(
    body: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChatResponse:
    settings = get_settings()
    if settings.chat_subscription_required and not user.chat_subscription_active:
        raise HTTPException(
            status_code=402,
            detail="Chat subscription required. Enable chat_subscription_active on user for demo.",
        )
    sid = body.session_id or str(uuid.uuid4())
    user_msg = ChatMessage(user_id=user.id, session_id=sid, role="user", content=body.message)
    db.add(user_msg)
    db.commit()

    reply = await chat_completion(SYSTEM_PROMPT, body.message)
    asst = ChatMessage(user_id=user.id, session_id=sid, role="assistant", content=reply)
    db.add(asst)
    db.commit()
    return ChatResponse(reply=reply, session_id=sid)


@router.get("/history", response_model=list[ChatMessageOut])
def history(
    session_id: str = "default",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id, ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
