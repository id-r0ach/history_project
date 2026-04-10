/**
 * Хук для воспроизведения TTS-ответа персонажа.
 *
 * Состояния:
 *   idle      — ничего не происходит
 *   loading   — запрос к /api/tts в процессе
 *   playing   — аудио воспроизводится
 *   error     — ошибка (TTS недоступен и т.п.)
 *
 * Повторный клик во время воспроизведения — останавливает.
 */
import { useState, useRef, useCallback } from "react";
import { apiClient } from "../services/api";

export type TTSState = "idle" | "loading" | "playing" | "error";

export function useTTS() {
  const [state, setState] = useState<TTSState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setState("idle");
  }, []);

  const speak = useCallback(
    async (characterId: string, text: string) => {
      // Если сейчас играет — стопаем
      if (state === "playing" || state === "loading") {
        stop();
        return;
      }

      setState("loading");

      try {
        const blob = await apiClient.synthesizeSpeech(characterId, text);
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          stop();
        };
        audio.onerror = () => {
          stop();
          setState("error");
        };

        setState("playing");
        await audio.play();
      } catch {
        stop();
        setState("error");
        // Через 3 сек сбрасываем ошибку
        setTimeout(() => setState("idle"), 3000);
      }
    },
    [state, stop]
  );

  return { state, speak, stop };
}
