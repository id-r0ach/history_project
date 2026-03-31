import type { CharacterInfo } from "../types";

interface TypingIndicatorProps {
  character: CharacterInfo | null;
}

const AVATARS: Record<string, string> = {
  khrushchev: "Х",
  stalin: "С",
  lenin: "Л",
};

export function TypingIndicator({ character }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 items-end">
      <div className="w-8 h-8 rounded-full bg-soviet-dark-3 border border-soviet-red/40 flex items-center justify-center shrink-0">
        <span className="text-soviet-beige font-display font-bold text-sm">
          {character ? (AVATARS[character.id] ?? character.name[0]) : "?"}
        </span>
      </div>
      <div className="bg-soviet-dark-3 border border-soviet-gray/20 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-md">
        <div className="flex gap-1.5 items-center">
          <span
            className="w-1.5 h-1.5 rounded-full bg-soviet-red-light animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-soviet-red-light animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-soviet-red-light animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
