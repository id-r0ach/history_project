import logging

import httpx
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from characters import CHARACTERS, get_character
from config import settings
from schemas import CharacterInfo, ChatRequest, ChatResponse
from services import RouterAIError, routerai_service

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Soviet History AI Chat",
    description="Диалоги с историческими личностями СССР на базе Qwen через RouterAI",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/characters", response_model=list[CharacterInfo], tags=["characters"])
async def list_characters() -> list[CharacterInfo]:
    """Возвращает список доступных исторических персонажей."""
    return [
        CharacterInfo(
            id=c.id,
            name=c.name,
            years=c.years,
            description=c.description,
        )
        for c in CHARACTERS.values()
    ]


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    tags=["chat"],
)
async def chat(body: ChatRequest) -> ChatResponse:
    """
    Отправляет сообщение выбранному персонажу и возвращает его ответ.

    - **character_id**: идентификатор персонажа (`khrushchev`, `stalin`, `lenin`).
    - **message**: текст сообщения от пользователя.
    """
    character = get_character(body.character_id)
    if character is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Персонаж '{body.character_id}' не найден. "
            f"Доступные: {list(CHARACTERS.keys())}",
        )

    logger.info("Chat request | character=%s | message_len=%d", character.id, len(body.message))

    try:
        reply = await routerai_service.ask(character, body.message)
    except RouterAIError as exc:
        logger.error("RouterAI API error | status=%d | detail=%s", exc.status_code, exc.detail)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ошибка AI-сервиса: {exc.detail}",
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Network error when calling RouterAI API: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Сервис AI временно недоступен. Попробуйте позже.",
        ) from exc

    logger.info("Chat response | character=%s | reply_len=%d", character.id, len(reply))
    return ChatResponse(
        character_id=character.id,
        reply=reply,
        model=settings.routerai_model,
    )


@app.get("/health", tags=["meta"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
