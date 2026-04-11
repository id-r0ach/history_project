"""
Два независимых трекера баланса:
  - LLM (RouterAI qwen3-max)
  - TTS (Yandex SpeechKit)

Каждый хранится в отдельном JSON-файле.
"""

import json
import logging
import threading
from pathlib import Path

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Тарифы
# ---------------------------------------------------------------------------
_RUB_PER_INPUT_TOKEN  = 230.0  / 1_000_000   # RouterAI qwen3-max input
_RUB_PER_OUTPUT_TOKEN = 1152.0 / 1_000_000   # RouterAI qwen3-max output
_RUB_PER_TTS_CHAR     = 180.0  / 1_000_000   # Yandex SpeechKit v1
_CHARS_PER_TOKEN      = 1.8                   # среднее для русского текста


def _estimate_tokens(text: str) -> int:
    return max(1, int(len(text) / _CHARS_PER_TOKEN))


# ---------------------------------------------------------------------------
# SingleBalance — один счёт
# ---------------------------------------------------------------------------
class SingleBalance:
    """Потокобезопасный баланс одного сервиса."""

    def __init__(self, path: Path, initial: float, service_name: str) -> None:
        self._path = path
        self._name = service_name
        self._lock = threading.RLock()
        self._data = self._load(initial)

    def snapshot(self) -> dict:
        with self._lock:
            initial = self._data["initial"]
            current = self._data["current"]
            pct = round(current / initial * 100, 1) if initial > 0 else 0.0
            return {
                "service":  self._name,
                "current":  round(current, 2),
                "initial":  round(initial, 2),
                "spent":    round(self._data["spent"], 2),
                "requests": self._data["requests"],
                "percent":  pct,
            }

    def deduct(self, amount: float) -> None:
        with self._lock:
            self._data["current"]   = max(0.0, self._data["current"] - amount)
            self._data["spent"]    += amount
            self._data["requests"] += 1
            self._save()

    def update_initial(self, new_initial: float) -> None:
        """Обновить начальный депозит (при пополнении счёта)."""
        with self._lock:
            self._data["initial"] = new_initial
            self._save()

    def update_current(self, new_current: float) -> None:
        """Вручную задать текущий остаток."""
        with self._lock:
            self._data["current"] = new_current
            self._save()

    def _load(self, initial: float) -> dict:
        if self._path.exists():
            try:
                data = json.loads(self._path.read_text(encoding="utf-8"))
                data.setdefault("initial",  initial)
                data.setdefault("current",  data["initial"])
                data.setdefault("spent",    0.0)
                data.setdefault("requests", 0)
                data.setdefault("service",  self._name)
                return data
            except Exception as exc:
                logger.warning("Failed to load %s, resetting: %s", self._path, exc)

        data = {"initial": initial, "current": initial,
                "spent": 0.0, "requests": 0, "service": self._name}
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return data

    def _save(self) -> None:
        try:
            self._path.write_text(
                json.dumps(self._data, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception as exc:
            logger.error("Failed to save %s: %s", self._path, exc)


# ---------------------------------------------------------------------------
# BalanceTracker — фасад для двух счётов
# ---------------------------------------------------------------------------
class BalanceTracker:
    def __init__(
        self,
        data_dir: Path,
        llm_initial: float = 95.0,
        tts_initial: float = 95.0,
    ) -> None:
        data_dir.mkdir(parents=True, exist_ok=True)
        self.llm = SingleBalance(data_dir / "balance_llm.json", llm_initial, "RouterAI (LLM)")
        self.tts = SingleBalance(data_dir / "balance_tts.json", tts_initial, "Yandex SpeechKit (TTS)")

    def charge_llm(self, input_text: str, output_text: str) -> float:
        in_tok  = _estimate_tokens(input_text)
        out_tok = _estimate_tokens(output_text)
        cost = in_tok * _RUB_PER_INPUT_TOKEN + out_tok * _RUB_PER_OUTPUT_TOKEN
        self.llm.deduct(cost)
        logger.info("LLM charge | in=%d out=%d tok | %.4f ₽ | left=%.2f ₽",
                    in_tok, out_tok, cost, self.llm.snapshot()["current"])
        return cost

    def charge_tts(self, text: str) -> float:
        cost = len(text) * _RUB_PER_TTS_CHAR
        self.tts.deduct(cost)
        logger.info("TTS charge | %d chars | %.4f ₽ | left=%.2f ₽",
                    len(text), cost, self.tts.snapshot()["current"])
        return cost

    def snapshot(self) -> dict:
        llm = self.llm.snapshot()
        tts = self.tts.snapshot()
        return {
            "llm": llm,
            "tts": tts,
            # Суммарный процент — взвешенное среднее по начальным депозитам
            "total_percent": round(
                (llm["current"] + tts["current"]) /
                max(0.01, llm["initial"] + tts["initial"]) * 100, 1
            ),
        }
