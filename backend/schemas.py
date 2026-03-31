from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    character_id: str = Field(..., min_length=1, description="ID персонажа")
    message: str = Field(..., min_length=1, max_length=4000, description="Сообщение пользователя")


class ChatResponse(BaseModel):
    character_id: str
    reply: str
    model: str


class CharacterInfo(BaseModel):
    id: str
    name: str
    years: str
    description: str


class ErrorResponse(BaseModel):
    detail: str
