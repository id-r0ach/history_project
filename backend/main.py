import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from characters import CHARACTERS, get_character
from config import settings
from schemas import CharacterInfo, ChatRequest, ChatResponse, SessionInfo, HistoryMessage, HistoryResponse
from services import RouterAIError, routerai_service, session_store, TTSError, YandexTTSService, BalanceTracker

# Инициализируем TTS-сервис
tts_service = YandexTTSService(
    api_key=settings.yandex_api_key,
    folder_id=settings.yandex_folder_id,
)

# Инициализируем трекер баланса
balance_tracker = BalanceTracker(
    path=__import__("pathlib").Path(settings.balance_file),
    initial_balance=settings.initial_balance,
)
from services.session import init_db

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — инициализация БД при старте сервера
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Код до yield выполняется при старте, после yield — при остановке."""
    logger.info("Initializing SQLite database...")
    init_db()
    logger.info("Database ready. Active sessions: %d", session_store.active_sessions)
    yield
    # место для cleanup при остановке (пока не нужен)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Soviet History AI Chat",
    description="Диалоги с историческими личностями СССР на базе Qwen через RouterAI",
    version="1.0.0",
    lifespan=lifespan,
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
# Routes — characters
# ---------------------------------------------------------------------------
@app.get("/api/characters", response_model=list[CharacterInfo], tags=["characters"])
async def list_characters() -> list[CharacterInfo]:
    """Возвращает список доступных исторических персонажей."""
    return [
        CharacterInfo(id=c.id, name=c.name, years=c.years, description=c.description, era=c.era)
        for c in CHARACTERS.values()
    ]


# ---------------------------------------------------------------------------
# Routes — chat
# ---------------------------------------------------------------------------
@app.post(
    "/api/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    tags=["chat"],
)
async def chat(body: ChatRequest) -> ChatResponse:
    """
    Отправляет сообщение выбранному персонажу и возвращает его ответ.
    История переписки сохраняется в SQLite по `session_id`.

    - **character_id**: идентификатор персонажа (`khrushchev`, `stalin`, `lenin`).
    - **session_id**: UUID сессии, хранится в localStorage браузера.
    - **message**: текст сообщения от пользователя.
    """
    # 1. Проверяем персонажа
    character = get_character(body.character_id)
    if character is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Персонаж '{body.character_id}' не найден. "
                   f"Доступные: {list(CHARACTERS.keys())}",
        )

    # 2. Загружаем историю из БД (или создаём новую сессию с system prompt)
    session_store.get_or_create(body.session_id, character.system_prompt)

    # 3. Сохраняем сообщение пользователя в БД
    session_store.append_user(body.session_id, body.message)

    # 4. Читаем полную историю для отправки в AI
    history = session_store.get_history(body.session_id)
    logger.info(
        "Chat request | session=%s | character=%s | history_len=%d",
        body.session_id, character.id, len(history),
    )

    # 5. Отправляем всю историю в RouterAI
    try:
        reply = await routerai_service.ask(history)
    except RouterAIError as exc:
        # Откатываем сообщение пользователя — оно не было обработано
        session_store.rollback_last_user_message(body.session_id)
        logger.error("RouterAI API error | status=%d | detail=%s", exc.status_code, exc.detail)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ошибка AI-сервиса: {exc.detail}",
        ) from exc
    except httpx.RequestError as exc:
        session_store.rollback_last_user_message(body.session_id)
        logger.error("Network error when calling RouterAI API: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Сервис AI временно недоступен. Попробуйте позже.",
        ) from exc

    # 6. Сохраняем ответ ассистента в БД
    session_store.append_assistant(body.session_id, reply)

    # 7. Списываем стоимость запроса с баланса
    # Входные токены = весь контекст (history), выходные = ответ
    input_text = " ".join(m.get("content", "") for m in history)
    balance_tracker.charge_llm(input_text=input_text, output_text=reply)

    logger.info(
        "Chat response | session=%s | reply_len=%d | total_messages=%d",
        body.session_id, len(reply), len(session_store.get_history(body.session_id)),
    )

    return ChatResponse(
        character_id=character.id,
        session_id=body.session_id,
        reply=reply,
        model=settings.routerai_model,
    )


@app.delete(
    "/api/sessions/{session_id}",
    response_model=SessionInfo,
    tags=["chat"],
)
async def delete_session(session_id: str) -> SessionInfo:
    """
    Удаляет историю сессии из БД (сброс контекста диалога).
    Вызывается когда пользователь нажимает 'Новый диалог'.
    """
    history_len = len(session_store.get_history(session_id))
    session_store.delete(session_id)
    logger.info("Session deleted | session=%s | had %d messages", session_id, history_len)
    return SessionInfo(session_id=session_id, message_count=0)


# ---------------------------------------------------------------------------
# Routes — TTS (Yandex SpeechKit)
# ---------------------------------------------------------------------------
import re as _re
from pydantic import BaseModel as _BaseModel


def _strip_markdown(text: str) -> str:
    """Убирает markdown-разметку перед синтезом речи."""
    # **жирный** и *курсив* → текст без звёздочек
    text = _re.sub(r"\*{1,3}(.+?)\*{1,3}", r"\1", text)
    # __жирный__ и _курсив_
    text = _re.sub(r"_{1,3}(.+?)_{1,3}", r"\1", text)
    # `код`
    text = _re.sub(r"`(.+?)`", r"\1", text)
    # ### Заголовки
    text = _re.sub(r"^#{1,6}\s+", "", text, flags=_re.MULTILINE)
    # > цитаты
    text = _re.sub(r"^\s*>\s+", "", text, flags=_re.MULTILINE)
    # — пункты списка (* / - / 1.)
    text = _re.sub(r"^\s*[-*]\s+", "", text, flags=_re.MULTILINE)
    text = _re.sub(r"^\s*\d+\.\s+", "", text, flags=_re.MULTILINE)
    # Горизонтальные разделители ---
    text = _re.sub(r"^-{3,}$", "", text, flags=_re.MULTILINE)
    # Множественные пустые строки → одна
    text = _re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

class TTSRequest(_BaseModel):
    character_id: str
    text: str


@app.post(
    "/api/tts",
    tags=["tts"],
    responses={
        200: {"content": {"audio/ogg": {}}, "description": "Аудио OGG/Opus"},
        503: {"description": "TTS не настроен или недоступен"},
    },
)
async def synthesize_speech(body: TTSRequest) -> Response:
    """
    Синтезирует речь через Yandex SpeechKit.
    Возвращает аудио в формате OGG/Opus (поддерживается всеми современными браузерами).
    Голос выбирается автоматически по `character_id`.
    """
    character = get_character(body.character_id)
    voice_id = character.voice_id if character else "ermil"

    # Очищаем markdown перед синтезом — TTS читает символы буквально
    clean_text = _strip_markdown(body.text)

    try:
        audio_bytes = await tts_service.synthesize(clean_text, voice_id=voice_id)
    except TTSError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    # Списываем стоимость TTS
    balance_tracker.charge_tts(clean_text)

    return Response(content=audio_bytes, media_type="audio/ogg")


# ---------------------------------------------------------------------------
# Routes — balance
# ---------------------------------------------------------------------------
@app.get("/api/balance", tags=["meta"])
async def get_balance() -> dict:
    """
    Возвращает текущий баланс и процент от начального депозита.
    Используется фронтендом для Fuel Gauge.
    """
    return balance_tracker.snapshot()


# ---------------------------------------------------------------------------
# Routes — meta
# ---------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
async def health_check() -> dict[str, str | int]:
    return {"status": "ok", "active_sessions": session_store.active_sessions}


@app.get(
    "/api/history/{session_id}",
    response_model=HistoryResponse,
    tags=["chat"],
)
async def get_history(session_id: str) -> HistoryResponse:
    """
    Возвращает историю диалога для session_id.
    System prompt (роль 'system') не включается — только user и assistant.
    Вызывается фронтендом при переключении между персонажами.
    """
    all_messages = session_store.get_history(session_id)

    # Фильтруем system prompt — фронтенду он не нужен
    visible = [
        HistoryMessage(role=m["role"], content=m["content"])
        for m in all_messages
        if m["role"] != "system"
    ]

    logger.info(
        "History request | session=%s | messages=%d",
        session_id, len(visible),
    )
    return HistoryResponse(session_id=session_id, messages=visible)
