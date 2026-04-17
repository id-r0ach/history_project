import type { ReactNode } from "react";
import { Loader2, Pause, Play, RotateCcw } from "lucide-react";

import type { CharacterInfo, Message } from "../types";
import type { TTSState } from "../hooks/useTTS";
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
            <strong key={partIndex} className="font-semibold text-soviet-cream">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (/^\*[^*]+\*$/.test(part)) {
          return (
            <em key={partIndex} className="italic text-soviet-beige/90">
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
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="group flex justify-end gap-3">
        <div className="flex max-w-[72%] flex-col items-end">
          <div className="rounded-2xl rounded-tr-sm bg-soviet-red/80 px-4 py-3 text-sm font-body leading-relaxed text-soviet-cream shadow-lg">
            {message.content}
          </div>
          <span className="mt-1.5 text-xs text-soviet-gray-light opacity-0 transition-opacity group-hover:opacity-100">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-soviet-gray/60 bg-soviet-gray/40">
          <span className="text-xs font-body font-medium text-soviet-beige">Вы</span>
        </div>
      </div>
    );
  }

  const isLoading = isSpeaking && ttsState === "loading";
  const isPlaying = isSpeaking && ttsState === "playing";
  const isPaused = isSpeaking && ttsState === "paused";
  const isError = isSpeaking && ttsState === "error";

  return (
    <div className="group flex gap-3">
      <div className="mt-0.5 shrink-0">
        <TalkingAvatar
          characterId={character?.id ?? ""}
          characterName={character?.name ?? "?"}
          isSpeaking={isPlaying}
          size="sm"
        />
      </div>

      <div className="flex max-w-[72%] flex-col items-start">
        {character && (
          <span className="mb-1 ml-1 text-xs font-body font-medium text-soviet-red-light">
            {character.name}
          </span>
        )}

        <div className="rounded-2xl rounded-tl-sm border border-soviet-gray/20 bg-soviet-dark-3 px-4 py-3 text-sm font-body leading-relaxed text-soviet-beige shadow-md">
          {renderMarkdown(message.content)}
        </div>

        <div className="mt-1.5 ml-1 flex items-center gap-2">
          <span className="text-xs text-soviet-gray-light opacity-0 transition-opacity group-hover:opacity-100">
            {formatTime(message.timestamp)}
          </span>

          {character && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={onSpeak}
                title={isPaused ? "Продолжить" : "Слушать"}
                className={`
                  flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-body transition-all duration-150
                  ${
                    isPlaying
                      ? "bg-soviet-red/10 text-soviet-red-light border-soviet-red/40 hover:bg-soviet-red/20"
                      : isPaused
                        ? "bg-soviet-red/10 text-soviet-red-light border-soviet-red/40 hover:bg-soviet-red/20"
                        : isError
                          ? "border-red-800/40 bg-red-950/30 text-red-400"
                          : "border-soviet-gray/20 text-soviet-gray-light hover:border-soviet-gray/40 hover:bg-soviet-dark hover:text-soviet-beige"
                  }
                `}
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                <span>
                  {isLoading ? "..." : isPlaying ? "Пауза" : isPaused ? "Играть" : isError ? "Ошибка" : "Слушать"}
                </span>
              </button>

              {(isPlaying || isPaused) && (
                <button
                  onClick={onRestart}
                  title="Сначала"
                  className="flex items-center gap-1 rounded-lg border border-soviet-gray/20 px-2 py-0.5 text-xs font-body text-soviet-gray-light transition-all duration-150 hover:border-soviet-gray/40 hover:bg-soviet-dark hover:text-soviet-beige"
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
