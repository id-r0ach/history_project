"""
Yandex SpeechKit TTS v1 — синтез речи для исторических персонажей.
Кеширование — на стороне браузера (useTTS.ts), сервер всегда идёт в Яндекс.
"""
import logging
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

YANDEX_TTS_URL = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"
MAX_CHARS = 5000


class TTSError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class YandexTTSService:
    def __init__(self, api_key: str, folder_id: str, cache_dir: Path | None = None) -> None:
        self._api_key = api_key
        self._folder_id = folder_id
        # cache_dir принимаем для совместимости, но не используем

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._folder_id)

    def cache_stats(self) -> dict:
        return {"files": 0, "size_kb": 0, "note": "browser-only cache"}

    async def synthesize(self, text: str, voice_id: str = "ermil") -> tuple[bytes, bool]:
        """
        Синтезирует речь. Возвращает (audio_bytes, from_cache=False).
        Кеш — только на стороне браузера.
        """
        if not self.is_configured:
            raise TTSError(503, "Yandex TTS не настроен: задайте YANDEX_API_KEY и YANDEX_FOLDER_ID в .env")

        if len(text) > MAX_CHARS:
            logger.warning("TTS text truncated from %d to %d chars", len(text), MAX_CHARS)
            text = text[:MAX_CHARS]

        headers = {"Authorization": f"Api-Key {self._api_key}"}
        data = {
            "folderId": self._folder_id,
            "text": text,
            "lang": "ru-RU",
            "voice": voice_id,
            "emotion": "neutral",
            "format": "oggopus",
            "sampleRateHertz": "48000",
            "speed": "1.0",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(YANDEX_TTS_URL, headers=headers, data=data)
            except httpx.RequestError as exc:
                logger.error("Yandex TTS network error: %s", exc)
                raise TTSError(503, "Сервис синтеза речи временно недоступен") from exc

        if response.status_code != 200:
            logger.error("Yandex TTS error | status=%d | body=%s",
                         response.status_code, response.text[:300])
            raise TTSError(response.status_code, f"Ошибка синтеза речи: {response.text[:200]}")

        logger.info("TTS synthesized | voice=%s | chars=%d | bytes=%d",
                    voice_id, len(text), len(response.content))
        return response.content, False
