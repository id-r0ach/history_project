"""
Yandex SpeechKit TTS v3 — синтез речи для исторических персонажей.

Документация: https://yandex.cloud/ru/docs/speechkit/tts-v3/api-ref/grpc/
REST-endpoint: https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize  (v1, проще)

Используем v1 REST — он проще в интеграции и полностью достаточен для нашей задачи.
v3 gRPC нужен только для потокового синтеза и расширенных эмоций.
"""
import logging

import httpx

logger = logging.getLogger(__name__)

YANDEX_TTS_URL = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"

# Максимум символов на один запрос к Yandex TTS v1
MAX_CHARS = 5000


class TTSError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class YandexTTSService:
    def __init__(self, api_key: str, folder_id: str) -> None:
        self._api_key = api_key
        self._folder_id = folder_id

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._folder_id)

    async def synthesize(self, text: str, voice_id: str = "ermil") -> bytes:
        """
        Синтезирует речь и возвращает аудио в формате OGG (Opus).

        Параметры голосов Yandex SpeechKit:
          - ermil   (мужской, нейтральный)
          - filipp  (мужской, уверенный)
          - madirus (мужской, спокойный)
          - alena   (женский, нейтральный)
          - jane    (женский, эмоциональный)

        Эмоция (emotion) доступна только для некоторых голосов.
        Используем neutral для всех — стабильнее.
        """
        if not self.is_configured:
            raise TTSError(503, "Yandex TTS не настроен: задайте YANDEX_API_KEY и YANDEX_FOLDER_ID в .env")

        # Обрезаем текст если слишком длинный
        if len(text) > MAX_CHARS:
            logger.warning("TTS text truncated from %d to %d chars", len(text), MAX_CHARS)
            text = text[:MAX_CHARS]

        headers = {
            "Authorization": f"Api-Key {self._api_key}",
        }
        data = {
            "folderId": self._folder_id,
            "text": text,
            "lang": "ru-RU",
            "voice": voice_id,
            "emotion": "neutral",
            "format": "oggopus",   # ogg/opus — компактный, браузеры поддерживают
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
            logger.error(
                "Yandex TTS error | status=%d | body=%s",
                response.status_code,
                response.text[:300],
            )
            raise TTSError(response.status_code, f"Ошибка синтеза речи: {response.text[:200]}")

        logger.info("TTS synthesized | voice=%s | chars=%d | bytes=%d", voice_id, len(text), len(response.content))
        return response.content
