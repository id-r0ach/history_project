import type { CharacterInfo } from "../types";

interface CharacterSidebarProps {
  characters: CharacterInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

const AVATARS: Record<string, string> = {
  khrushchev: "Х",
  stalin: "С",
  lenin: "Л",
};

const ACCENT_COLORS: Record<string, string> = {
  khrushchev: "border-soviet-red-light",
  stalin: "border-soviet-beige-dark",
  lenin: "border-soviet-red-bright",
};

export function CharacterSidebar({
  characters,
  selectedId,
  onSelect,
  isLoading,
}: CharacterSidebarProps) {
  return (
    <aside className="w-72 shrink-0 flex flex-col bg-soviet-dark border-r border-soviet-gray/30 h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-soviet-gray/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-soviet-red flex items-center justify-center rotate-45 shrink-0">
            <span className="text-soviet-cream font-display font-bold text-sm -rotate-45">☆</span>
          </div>
          <div>
            <h1 className="font-display text-soviet-cream font-bold text-base leading-tight tracking-wide">
              СССР
            </h1>
            <p className="text-soviet-gray-light text-xs font-body mt-0.5 tracking-widest uppercase">
              Диалоги с историей
            </p>
          </div>
        </div>
      </div>

      {/* Characters label */}
      <div className="px-6 pt-5 pb-2">
        <span className="text-soviet-gray-light text-xs font-body tracking-widest uppercase">
          Персонажи
        </span>
      </div>

      {/* Character list */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {isLoading ? (
          <div className="space-y-2 px-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-soviet-dark-3 animate-pulse"
              />
            ))}
          </div>
        ) : (
          characters.map((char) => {
            const isSelected = char.id === selectedId;
            return (
              <button
                key={char.id}
                onClick={() => onSelect(char.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-150 group
                  ${
                    isSelected
                      ? "bg-soviet-red/20 border border-soviet-red/40"
                      : "border border-transparent hover:bg-soviet-dark-3 hover:border-soviet-gray/20"
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-2
                    ${isSelected ? ACCENT_COLORS[char.id] ?? "border-soviet-red" : "border-soviet-gray/40"}
                    bg-soviet-dark-2 transition-all duration-150`}
                >
                  <span className="font-display font-bold text-soviet-beige text-base">
                    {AVATARS[char.id] ?? char.name[0]}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p
                    className={`font-body font-medium text-sm truncate transition-colors
                      ${isSelected ? "text-soviet-cream" : "text-soviet-beige/80 group-hover:text-soviet-cream"}`}
                  >
                    {char.name}
                  </p>
                  <p className="text-soviet-gray-light text-xs truncate mt-0.5">
                    {char.years}
                  </p>
                </div>

                {/* Active dot */}
                {isSelected && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-soviet-red-light shrink-0" />
                )}
              </button>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-soviet-gray/30">
        <p className="text-soviet-gray-light text-xs font-body text-center leading-relaxed">
          Исторические персонажи воссозданы с помощью&nbsp;AI.
          <br />
          Ответы могут быть неточными.
        </p>
      </div>
    </aside>
  );
}
