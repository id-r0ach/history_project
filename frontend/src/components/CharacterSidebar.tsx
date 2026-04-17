import type { BalanceInfo, CharacterInfo } from "../types";
import { FuelGauge } from "./FuelGauge";
import { TalkingAvatar } from "./TalkingAvatar";

interface CharacterSidebarProps {
  characters: CharacterInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  balance: BalanceInfo | null;
  isBalanceLoading: boolean;
  onOpenSettings: () => void;
}

const ERA_COLORS: Record<string, string> = {
  "Рюриковичи": "border-amber-600",
  "Московское царство": "border-orange-700",
  "Романовы": "border-yellow-600",
  "СССР": "border-soviet-red",
};

const ERA_LABEL_COLORS: Record<string, string> = {
  "Рюриковичи": "text-amber-500/70",
  "Московское царство": "text-orange-500/70",
  "Романовы": "text-yellow-500/70",
  "СССР": "text-soviet-red-light/70",
};

const ERA_ORDER = ["Рюриковичи", "Московское царство", "Романовы", "СССР"];

export function CharacterSidebar({
  characters,
  selectedId,
  onSelect,
  isLoading,
  balance,
  isBalanceLoading,
  onOpenSettings,
}: CharacterSidebarProps) {
  const grouped = ERA_ORDER.reduce<Record<string, CharacterInfo[]>>((acc, era) => {
    acc[era] = characters.filter((character) => character.era === era);
    return acc;
  }, {});

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-soviet-gray/30 bg-soviet-dark">
      <div className="border-b border-soviet-gray/30 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-soviet-red rotate-45">
            <span className="-rotate-45 font-display text-sm font-bold text-soviet-cream">☆</span>
          </div>
          <div>
            <h1 className="font-display text-base font-bold leading-tight tracking-wide text-soviet-cream">
              История России
            </h1>
            <p className="mt-0.5 font-body text-xs uppercase tracking-widest text-soviet-gray-light">
              Диалоги с историей
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pb-4 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-3 px-3 pt-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-xl bg-soviet-dark-3" />
            ))}
          </div>
        ) : (
          ERA_ORDER.map((era) => {
            const group = grouped[era];
            if (!group?.length) return null;

            const borderColor = ERA_COLORS[era] ?? "border-soviet-gray";
            const labelColor = ERA_LABEL_COLORS[era] ?? "text-soviet-gray-light";

            return (
              <div key={era} className="mt-4">
                <div className="flex items-center gap-2 px-5 pb-1.5">
                  <span className={`text-[10px] font-body font-semibold uppercase tracking-widest ${labelColor}`}>
                    {era}
                  </span>
                  <div className="h-px flex-1 bg-soviet-gray/15" />
                </div>

                <div className="space-y-1 px-3">
                  {group.map((char) => {
                    const isSelected = char.id === selectedId;

                    return (
                      <button
                        key={char.id}
                        onClick={() => onSelect(char.id)}
                        className={`group flex w-full items-center gap-4 rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
                          isSelected
                            ? "border-soviet-red/40 bg-soviet-red/20"
                            : "border-transparent hover:border-soviet-gray/20 hover:bg-soviet-dark-3"
                        }`}
                      >
                        <TalkingAvatar
                          characterId={char.id}
                          characterName={char.name}
                          isSpeaking={false}
                          size="sm"
                          className={isSelected ? borderColor : "border-soviet-gray/30"}
                        />

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate font-body text-sm font-medium transition-colors ${
                              isSelected
                                ? "text-soviet-cream"
                                : "text-soviet-beige/80 group-hover:text-soviet-cream"
                            }`}
                          >
                            {char.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-soviet-gray-light">{char.years}</p>
                        </div>

                        {isSelected && (
                          <div className="ml-auto h-2 w-2 shrink-0 rounded-full bg-soviet-red-light" />
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

      <FuelGauge balance={balance} isLoading={isBalanceLoading} onOpenSettings={onOpenSettings} />

      <div className="border-t border-soviet-gray/30 px-6 py-4">
        <p className="text-center font-body text-xs leading-relaxed text-soviet-gray-light">
          Исторические персонажи воссозданы с помощью AI.
          <br />
          Ответы могут быть неточными.
        </p>
      </div>
    </aside>
  );
}
