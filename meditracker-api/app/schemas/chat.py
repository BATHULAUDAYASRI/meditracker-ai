from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    session_id: str = "default"


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    disclaimer: str = (
        "Not a substitute for emergency services or professional mental health care. "
        "If you are in crisis, contact local emergency services."
    )


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
