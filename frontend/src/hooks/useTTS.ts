import { useState, useRef, useCallback } from "react";
import { apiClient } from "../services/api";

export type TTSState = "idle" | "loading" | "playing" | "paused" | "error";

const browserCache = new Map<string, Blob>();

function cacheKey(characterId: string, text: string): string {
  return `${characterId}:${text.slice(0, 200)}`;
}

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

  const pause = useCallback(() => {
    if (audioRef.current && state === "playing") {
      audioRef.current.pause();
      setState("paused");
    }
  }, [state]);

  const resume = useCallback(() => {
    if (audioRef.current && state === "paused") {
      void audioRef.current.play();
      setState("playing");
    }
  }, [state]);

  const speak = useCallback(
    async (characterId: string, text: string) => {
      if (state === "loading") return;

      // Пауза/возобновление если уже загружено
      if (state === "playing") { pause(); return; }
      if (state === "paused")  { resume(); return; }

      setState("loading");

      try {
        const key = cacheKey(characterId, text);
        let blob = browserCache.get(key);
        if (!blob) {
          blob = await apiClient.synthesizeSpeech(characterId, text);
          browserCache.set(key, blob);
        }

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => stop();
        audio.onerror = () => { stop(); setState("error"); };

        setState("playing");
        await audio.play();
      } catch {
        stop();
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    },
    [state, stop, pause, resume]
  );

  const restart = useCallback(
    async (characterId: string, text: string) => {
      stop();
      // Небольшая задержка чтобы stop() успел очистить состояние
      await new Promise(r => setTimeout(r, 50));
      setState("loading");
      try {
        const key = cacheKey(characterId, text);
        let blob = browserCache.get(key);
        if (!blob) {
          blob = await apiClient.synthesizeSpeech(characterId, text);
          browserCache.set(key, blob);
        }
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => stop();
        audio.onerror = () => { stop(); setState("error"); };
        setState("playing");
        await audio.play();
      } catch {
        stop();
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    },
    [stop]
  );

  return { state, speak, stop, pause, resume, restart, isSpeaking: state === "playing" };
}
