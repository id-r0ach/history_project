import type { ReactNode } from "react";
import { Loader2, Pause, Play, RotateCcw } from "lucide-react";

import type { TTSState } from "../hooks/useTTS";
import { getThemeByEra } from "../theme";
import type { CharacterInfo, Message } from "../types";
import { TalkingAvatar } from "./TalkingAvatar";

interface MessageBubbleProps {
  message: Message;
  character: CharacterInfo | null;
  ttsState: TTSState;
  isSpeaking: boolean;
  onSpeak: () => void;
  onRestart: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string): ReactNode {
  const paragraphs = text.split(/\n{2,}/);

  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split(/\n/);

    const renderedLines = lines.map((line, lineIndex) => {
      const parts = line.split(/(\*{1,2}[^*]+\*{1,2})/g);
      const nodes = parts.map((part, partIndex) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return (
            <strong key={partIndex} className="font-semibold text-[var(--theme-text)]">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (/^\*[^*]+\*$/.test(part)) {
          return (
            <em key={partIndex} className="italic text-[var(--theme-text-soft)]">
              {part.slice(1, -1)}
            </em>
          );
        }

        return <span key={partIndex}>{part}</span>;
      });

      return (
        <span key={lineIndex}>
          {nodes}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });

    return (
      <p key={paragraphIndex} className={paragraphIndex > 0 ? "mt-3" : ""}>
        {renderedLines}
      </p>
    );
  });
}

export function MessageBubble({
  message,
  character,
  ttsState,
  isSpeaking,
  onSpeak,
  onRestart,
}: MessageBubbleProps) {
  const theme = getThemeByEra(character?.era);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="group flex justify-end gap-4">
        <div className="flex max-w-[72%] flex-col items-end">
          <div className="rounded-[24px] rounded-tr-md border border-[var(--theme-accent-soft)] bg-[var(--theme-accent)] px-5 py-4 text-sm leading-relaxed text-[var(--theme-send-text)] shadow-[0_18px_35px_rgba(0,0,0,0.18)]">
            {message.content}
          </div>
          <span className="mt-1.5 text-xs text-[var(--theme-muted)] opacity-0 transition-opacity group-hover:opacity-100">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-[var(--theme-text-soft)]">
          Вы
        </div>
      </div>
    );
  }

  const isLoading = isSpeaking && ttsState === "loading";
  const isPlaying = isSpeaking && ttsState === "playing";
  const isPaused = isSpeaking && ttsState === "paused";
  const isError = isSpeaking && ttsState === "error";

  return (
    <div className="group flex gap-4">
      <div className="mt-0.5 shrink-0">
        <TalkingAvatar
          characterId={character?.id ?? ""}
          characterName={character?.name ?? "?"}
          isSpeaking={isPlaying}
          size="sm"
        />
      </div>

      <div className="flex max-w-[78%] flex-col items-start">
        {character && (
          <div className="mb-2 ml-1 flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.accentClass}`}>
              {character.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--theme-muted)]">
              {character.era}
            </span>
          </div>
        )}

        <div className="rounded-[26px] rounded-tl-md border border-white/10 bg-[var(--theme-panel)]/88 px-5 py-4 text-sm leading-relaxed text-[var(--theme-text-soft)] shadow-[0_16px_30px_rgba(0,0,0,0.16)] backdrop-blur-md">
          {renderMarkdown(message.content)}
        </div>

        <div className="mt-2 ml-1 flex items-center gap-2">
          <span className="text-xs text-[var(--theme-muted)] opacity-0 transition-opacity group-hover:opacity-100">
            {formatTime(message.timestamp)}
          </span>

          {character && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={onSpeak}
                title={isPaused ? "Продолжить" : "Слушать"}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all duration-150 ${
                  isPlaying || isPaused
                    ? "border-[var(--theme-accent-soft)] bg-[var(--theme-badge)] text-[var(--theme-accent)]"
                    : isError
                      ? "border-red-800/40 bg-red-950/30 text-red-400"
                      : "border-white/10 bg-white/[0.03] text-[var(--theme-muted)] hover:border-[var(--theme-accent-soft)] hover:text-[var(--theme-text)]"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                <span>{isLoading ? "..." : isPlaying ? "Пауза" : isPaused ? "Играть" : isError ? "Ошибка" : "Слушать"}</span>
              </button>

              {(isPlaying || isPaused) && (
                <button
                  onClick={onRestart}
                  title="Сначала"
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[var(--theme-muted)] transition-all duration-150 hover:border-[var(--theme-accent-soft)] hover:text-[var(--theme-text)]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Сначала</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
