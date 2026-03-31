import type { Message } from "../types";
import type { CharacterInfo } from "../types";

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
        <span className="text-soviet-gray-light text-xs mt-1.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
