import httpx
from typing import Any

from config import settings
from characters import Character


class RouterAIError(Exception):
    """Raised when the RouterAI API returns an error."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"RouterAI API error {status_code}: {detail}")


class RouterAIService:
    """Async client for the RouterAI (OpenAI-compatible) API."""

    _CHAT_ENDPOINT = "/chat/completions"
    _TIMEOUT = httpx.Timeout(60.0, connect=10.0)

    def __init__(self) -> None:
        self._base_url = settings.routerai_base_url.rstrip("/")
        self._model = settings.routerai_model
        self._headers = {
            "Authorization": f"Bearer {settings.routerai_api_key}",
            "Content-Type": "application/json",
        }

    async def ask(self, character: Character, user_message: str) -> str:
        """
        Send a message to the RouterAI API and return the assistant reply text.

        Raises:
            RouterAIError: on non-2xx responses or unexpected payload shape.
            httpx.RequestError: on network-level failures.
        """
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": character.system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.8,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(
            base_url=self._base_url,
            headers=self._headers,
            timeout=self._TIMEOUT,
        ) as client:
            response = await client.post(self._CHAT_ENDPOINT, json=payload)

        if response.status_code != 200:
            try:
                error_body = response.json()
                detail = error_body.get("error", {}).get("message", response.text)
            except Exception:
                detail = response.text
            raise RouterAIError(response.status_code, detail)

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise RouterAIError(
                500, f"Unexpected response shape from RouterAI API: {exc}"
            ) from exc


# Module-level singleton — instantiated once at import time.
routerai_service = RouterAIService()
