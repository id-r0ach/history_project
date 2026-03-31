from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    character_id: str = Field(..., min_length=1, description="ID персонажа")
    session_id: str = Field(..., min_length=1, description="ID сессии (UUID, генерируется на фронтенде)")
    message: str = Field(..., min_length=1, max_length=4000, description="Сообщение пользователя")


class ChatResponse(BaseModel):
    character_id: str
    session_id: str
    reply: str
    model: str


class CharacterInfo(BaseModel):
    id: str
    name: str
    years: str
    description: str


class SessionInfo(BaseModel):
    session_id: str
    message_count: int  # включает system prompt


class HistoryMessage(BaseModel):
    role: str      # "user" | "assistant" (system prompt скрываем от фронтенда)
    content: str


class HistoryResponse(BaseModel):
    session_id: str
    messages: list[HistoryMessage]


class ErrorResponse(BaseModel):
    detail: str
