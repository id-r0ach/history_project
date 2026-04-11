"""
Трекер баланса — хранит остаток в balance.json и считает списания.

Тарифы (приближённые, актуальны на апрель 2026):
  RouterAI qwen3-max:
    входные токены  — 230 ₽ / 1М токенов  = 0.00000023 ₽/токен
    выходные токены — 1152 ₽ / 1М токенов = 0.000001152 ₽/токен
  Yandex SpeechKit v1:
    — 180 ₽ / 1М символов               = 0.00000018 ₽/символ

  Оценка токенов из символов (русский текст):
    ~1 токен ≈ 1.8–2 символа → коэффициент 0.55 токенов/символ
"""

import json
import logging
import threading
from pathlib import Path

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Тарифы
# ---------------------------------------------------------------------------
_RUB_PER_INPUT_TOKEN  = 230.0  / 1_000_000   # RouterAI qwen3-max, input
_RUB_PER_OUTPUT_TOKEN = 1152.0 / 1_000_000   # RouterAI qwen3-max, output
_RUB_PER_TTS_CHAR     = 180.0  / 1_000_000   # Yandex SpeechKit v1
_CHARS_PER_TOKEN      = 1.8    # среднее для русского текста


def _estimate_tokens(text: str) -> int:
    """Грубая оценка числа токенов по длине текста."""
    return max(1, int(len(text) / _CHARS_PER_TOKEN))


# ---------------------------------------------------------------------------
# BalanceTracker
# ---------------------------------------------------------------------------
class BalanceTracker:
    """
    Потокобезопасный трекер баланса с персистентным хранением в JSON.

    Файл balance.json:
      {
        "initial":  500.0,   # начальный депозит (₽)
        "current":  423.17,  # текущий остаток  (₽)
        "spent":     76.83,  # потрачено всего  (₽)
        "requests":  142     # кол-во запросов
      }
    """

    def __init__(self, path: Path, initial_balance: float = 500.0) -> None:
        self._path = path
        self._lock = threading.Lock()
        self._data = self._load(initial_balance)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def current(self) -> float:
        with self._lock:
            return self._data["current"]

    @property
    def initial(self) -> float:
        with self._lock:
            return self._data["initial"]

    @property
    def percent(self) -> float:
        """Процент остатка от начального депозита (0–100)."""
        with self._lock:
            if self._data["initial"] <= 0:
                return 0.0
            return round(self._data["current"] / self._data["initial"] * 100, 1)

    def charge_llm(self, input_text: str, output_text: str) -> float:
        """
        Списывает стоимость запроса к LLM.
        Возвращает сумму списания в рублях.
        """
        in_tokens  = _estimate_tokens(input_text)
        out_tokens = _estimate_tokens(output_text)
        cost = (in_tokens * _RUB_PER_INPUT_TOKEN
                + out_tokens * _RUB_PER_OUTPUT_TOKEN)
        self._deduct(cost)
        logger.info(
            "LLM charge | in=%d tok | out=%d tok | cost=%.4f ₽ | balance=%.2f ₽",
            in_tokens, out_tokens, cost, self.current,
        )
        return cost

    def charge_tts(self, text: str) -> float:
        """
        Списывает стоимость запроса к Yandex SpeechKit.
        Возвращает сумму списания в рублях.
        """
        chars = len(text)
        cost  = chars * _RUB_PER_TTS_CHAR
        self._deduct(cost)
        logger.info(
            "TTS charge | chars=%d | cost=%.4f ₽ | balance=%.2f ₽",
            chars, cost, self.current,
        )
        return cost

    def snapshot(self) -> dict:
        """Возвращает словарь для отдачи в /api/balance."""
        with self._lock:
            return {
                "current":  round(self._data["current"], 2),
                "initial":  round(self._data["initial"], 2),
                "spent":    round(self._data["spent"],   2),
                "requests": self._data["requests"],
                "percent":  self.percent,
            }

    def set_initial(self, amount: float) -> None:
        """Устанавливает новый начальный депозит (вызывается при пополнении)."""
        with self._lock:
            self._data["initial"] = amount
            self._save()

    # ------------------------------------------------------------------
    # Private
    # ------------------------------------------------------------------

    def _deduct(self, amount: float) -> None:
        with self._lock:
            self._data["current"]  = max(0.0, self._data["current"] - amount)
            self._data["spent"]   += amount
            self._data["requests"] += 1
            self._save()

    def _load(self, initial_balance: float) -> dict:
        if self._path.exists():
            try:
                data = json.loads(self._path.read_text(encoding="utf-8"))
                # Гарантируем наличие всех полей (обратная совместимость)
                data.setdefault("initial",  initial_balance)
                data.setdefault("current",  data["initial"])
                data.setdefault("spent",    0.0)
                data.setdefault("requests", 0)
                return data
            except Exception as exc:
                logger.warning("Failed to load balance.json, resetting: %s", exc)

        data = {
            "initial":  initial_balance,
            "current":  initial_balance,
            "spent":    0.0,
            "requests": 0,
        }
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return data

    def _save(self) -> None:
        """Вызывается под локом."""
        try:
            self._path.write_text(
                json.dumps(self._data, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception as exc:
            logger.error("Failed to save balance.json: %s", exc)
