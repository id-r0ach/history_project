import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "../services/api";

export type TTSState = "idle" | "loading" | "playing" | "paused" | "error";

const browserCache = new Map<string, Blob>();

function cacheKey(characterId: string, text: string): string {
  return `${characterId}:${text.slice(0, 200)}`;
}

export function useTTS() {
  const [state, setState] = useState<TTSState>("idle");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const resetErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearErrorTimer = useCallback(() => {
    if (resetErrorTimerRef.current) {
      clearTimeout(resetErrorTimerRef.current);
      resetErrorTimerRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearErrorTimer();
    cleanupAudio();
    setActiveKey(null);
    setState("idle");
  }, [cleanupAudio, clearErrorTimer]);

  const pause = useCallback(() => {
    if (audioRef.current && state === "playing") {
      audioRef.current.pause();
      setState("paused");
    }
  }, [state]);

  const resume = useCallback(async () => {
    if (audioRef.current && state === "paused") {
      try {
        await audioRef.current.play();
        setState("playing");
      } catch {
        cleanupAudio();
        setActiveKey(null);
        setState("error");
      }
    }
  }, [cleanupAudio, state]);

  const playKey = useCallback(
    async (key: string, characterId: string, text: string) => {
      clearErrorTimer();
      cleanupAudio();
      setActiveKey(key);
      setState("loading");

      try {
        let blob = browserCache.get(key);
        if (!blob) {
          blob = await apiClient.synthesizeSpeech(characterId, text);
          browserCache.set(key, blob);
        }

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          cleanupAudio();
          setActiveKey(null);
          setState("idle");
        };
        audio.onerror = () => {
          cleanupAudio();
          setActiveKey(null);
          setState("error");
          resetErrorTimerRef.current = setTimeout(() => {
            setState("idle");
          }, 3000);
        };

        await audio.play();
        setState("playing");
      } catch {
        cleanupAudio();
        setActiveKey(null);
        setState("error");
        resetErrorTimerRef.current = setTimeout(() => {
          setState("idle");
        }, 3000);
      }
    },
    [cleanupAudio, clearErrorTimer]
  );

  const speak = useCallback(
    async (characterId: string, text: string) => {
      const key = cacheKey(characterId, text);

      if (state === "loading" && activeKey === key) {
        return;
      }

      if (activeKey === key) {
        if (state === "playing") {
          pause();
          return;
        }
        if (state === "paused") {
          await resume();
          return;
        }
      }

      await playKey(key, characterId, text);
    },
    [activeKey, pause, playKey, resume, state]
  );

  const restart = useCallback(
    async (characterId: string, text: string) => {
      const key = cacheKey(characterId, text);
      await playKey(key, characterId, text);
    },
    [playKey]
  );

  useEffect(() => {
    return () => {
      clearErrorTimer();
      cleanupAudio();
    };
  }, [cleanupAudio, clearErrorTimer]);

  return {
    state,
    activeKey,
    speak,
    stop,
    pause,
    resume,
    restart,
    isSpeaking: state === "playing",
  };
}
