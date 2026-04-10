import { Volume2, VolumeX, Loader2 } from "lucide-react";
import type { Message, CharacterInfo } from "../types";
import { useTTS } from "../hooks/useTTS";

interface MessageBubbleProps {
  message: Message;
  character: CharacterInfo | null;
}

const AVATARS: Record<string, string> = {
  khrushchev: "Х",
  stalin: "С",
  lenin: "Л",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, character }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { state: ttsState, speak } = useTTS();

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 group">
        <div className="flex flex-col items-end max-w-[72%]">
          <div className="bg-soviet-red/80 text-soviet-cream px-4 py-3 rounded-2xl rounded-tr-sm font-body text-sm leading-relaxed shadow-lg">
            {message.content}
          </div>
          <span className="text-soviet-gray-light text-xs mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </span>
        </div>
        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-soviet-gray/40 border border-soviet-gray/60 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-soviet-beige text-xs font-body font-medium">Вы</span>
        </div>
      </div>
    );
  }

  // --- Кнопка озвучки ---
  const isLoading = ttsState === "loading";
  const isPlaying = ttsState === "playing";
  const isError   = ttsState === "error";

  const handleSpeak = () => {
    if (!character) return;
    void speak(character.id, message.content);
  };

  return (
    <div className="flex gap-3 group">
      {/* Character avatar */}
      <div className="w-8 h-8 rounded-full bg-soviet-dark-3 border border-soviet-red/40 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-soviet-beige font-display font-bold text-sm">
          {character ? (AVATARS[character.id] ?? character.name[0]) : "?"}
        </span>
      </div>

      <div className="flex flex-col items-start max-w-[72%]">
        {character && (
          <span className="text-soviet-red-light text-xs font-body font-medium mb-1 ml-1">
            {character.name}
          </span>
        )}
        <div className="bg-soviet-dark-3 border border-soviet-gray/20 text-soviet-beige px-4 py-3 rounded-2xl rounded-tl-sm font-body text-sm leading-relaxed shadow-md">
          {message.content}
        </div>

        {/* Нижняя строка: время + кнопка озвучки */}
        <div className="flex items-center gap-2 mt-1.5 ml-1">
          <span className="text-soviet-gray-light text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </span>

          {character && (
            <button
              onClick={handleSpeak}
              disabled={isLoading}
              title={
                isPlaying ? "Остановить" :
                isError    ? "Ошибка озвучки" :
                             "Озвучить"
              }
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-body
                transition-all duration-150
                opacity-0 group-hover:opacity-100
                ${isPlaying
                  ? "text-soviet-red-light border border-soviet-red/40 bg-soviet-red/10 hover:bg-soviet-red/20"
                  : isError
                  ? "text-red-400 border border-red-800/40 bg-red-950/30"
                  : "text-soviet-gray-light border border-soviet-gray/20 hover:text-soviet-beige hover:border-soviet-gray/40 hover:bg-soviet-dark"
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isPlaying ? (
                <VolumeX className="w-3 h-3" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
              <span>
                {isLoading ? "…" : isPlaying ? "Стоп" : isError ? "Ошибка" : "Слушать"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
