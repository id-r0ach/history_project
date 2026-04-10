import type { CharacterInfo } from "../types";

interface CharacterSidebarProps {
  characters: CharacterInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

// Инициалы для аватаров — берём первую букву имени если нет переопределения
function getInitial(char: CharacterInfo): string {
  const overrides: Record<string, string> = {
    rurik: "Р", vladimir: "Вл", yaroslav: "Я",
    ivan3: "И³", ivan4: "И⁴",
    peter1: "П", catherine2: "Е", nicholas2: "Н",
    lenin: "Л", stalin: "С", khrushchev: "Х",
    brezhnev: "Б", gorbachev: "Г",
  };
  return overrides[char.id] ?? char.name[0];
}

// Цвет рамки аватара по эпохе
const ERA_COLORS: Record<string, string> = {
  "Рюриковичи":        "border-amber-600",
  "Московское царство": "border-orange-700",
  "Романовы":          "border-yellow-600",
  "СССР":              "border-soviet-red",
};

// Цвет заголовка эпохи
const ERA_LABEL_COLORS: Record<string, string> = {
  "Рюриковичи":        "text-amber-500/70",
  "Московское царство": "text-orange-500/70",
  "Романовы":          "text-yellow-500/70",
  "СССР":              "text-soviet-red-light/70",
};

const ERA_ORDER = ["Рюриковичи", "Московское царство", "Романовы", "СССР"];

export function CharacterSidebar({
  characters,
  selectedId,
  onSelect,
  isLoading,
}: CharacterSidebarProps) {
  // Группируем персонажей по эпохам, сохраняя порядок ERA_ORDER
  const grouped = ERA_ORDER.reduce<Record<string, CharacterInfo[]>>((acc, era) => {
    acc[era] = characters.filter((c) => c.era === era);
    return acc;
  }, {});

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
              История России
            </h1>
            <p className="text-soviet-gray-light text-xs font-body mt-0.5 tracking-widest uppercase">
              Диалоги с историей
            </p>
          </div>
        </div>
      </div>

      {/* Character list grouped by era */}
      <nav className="flex-1 overflow-y-auto pb-4 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2 px-3 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-soviet-dark-3 animate-pulse" />
            ))}
          </div>
        ) : (
          ERA_ORDER.map((era) => {
            const group = grouped[era];
            if (!group || group.length === 0) return null;
            const borderColor = ERA_COLORS[era] ?? "border-soviet-gray";
            const labelColor = ERA_LABEL_COLORS[era] ?? "text-soviet-gray-light";
            return (
              <div key={era} className="mt-4">
                {/* Era header */}
                <div className="px-5 pb-1.5 flex items-center gap-2">
                  <span className={`text-[10px] font-body font-semibold tracking-widest uppercase ${labelColor}`}>
                    {era}
                  </span>
                  <div className="flex-1 h-px bg-soviet-gray/15" />
                </div>

                {/* Characters in this era */}
                <div className="px-3 space-y-0.5">
                  {group.map((char) => {
                    const isSelected = char.id === selectedId;
                    return (
                      <button
                        key={char.id}
                        onClick={() => onSelect(char.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group
                          ${isSelected
                            ? "bg-soviet-red/20 border border-soviet-red/40"
                            : "border border-transparent hover:bg-soviet-dark-3 hover:border-soviet-gray/20"
                          }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center border-2
                            ${isSelected ? borderColor : "border-soviet-gray/30"}
                            bg-soviet-dark-2 transition-all duration-150`}
                        >
                          <span className="font-display font-bold text-soviet-beige text-xs">
                            {getInitial(char)}
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
                  })}
                </div>
              </div>
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
