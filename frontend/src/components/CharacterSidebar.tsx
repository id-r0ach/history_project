import type { BalanceInfo, CharacterInfo } from "../types";
import { ERA_ORDER, getThemeByEra } from "../theme";
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
    <aside className="relative flex h-full w-80 shrink-0 flex-col border-r border-white/10 bg-[var(--theme-sidebar)]/95 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,transparent,rgba(0,0,0,0.24))]" />

      <div className="relative border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--theme-accent-soft)] bg-[var(--theme-badge)] shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
            <img src="/favicon.png" alt="Логотип сайта" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-[1.15] text-[var(--theme-text)]">
              <span className="block">Диалоги с</span>
              <span className="block">историей</span>
            </h1>
            <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-[var(--theme-muted)]">
              Исторические эпохи России
            </p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto pb-4 pt-2 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-3 px-3 pt-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl border border-white/5 bg-[var(--theme-panel)]/60"
              />
            ))}
          </div>
        ) : (
          ERA_ORDER.map((era) => {
            const group = grouped[era];
            if (!group?.length) return null;

            const theme = getThemeByEra(era);

            return (
              <section key={era} className="mt-5">
                <div className="flex items-center gap-3 px-5 pb-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] shadow-[0_8px_18px_rgba(0,0,0,0.12)] ${theme.badgeClass}`}
                  >
                    {era}
                  </span>
                  <div className={`h-px flex-1 bg-gradient-to-r ${theme.dividerClass}`} />
                </div>

                <div className="space-y-2 px-3">
                  {group.map((character) => {
                    const isSelected = character.id === selectedId;

                    return (
                      <button
                        key={character.id}
                        onClick={() => onSelect(character.id)}
                        className={`group flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-[var(--theme-accent-soft)] bg-[var(--theme-panel-strong)] shadow-[0_18px_35px_rgba(0,0,0,0.22)]"
                            : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"
                        }`}
                      >
                        <TalkingAvatar
                          characterId={character.id}
                          characterName={character.name}
                          isSpeaking={false}
                          size="sm"
                          className={isSelected ? "ring-2 ring-[var(--theme-accent-soft)] ring-offset-0" : ""}
                        />

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-medium transition-colors ${
                              isSelected
                                ? "text-[var(--theme-text)]"
                                : "text-[var(--theme-text-soft)] group-hover:text-[var(--theme-text)]"
                            }`}
                          >
                            {character.name}
                          </p>
                          <p className="mt-1 truncate text-xs tracking-[0.16em] text-[var(--theme-muted)]">
                            {character.years}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--theme-accent)] shadow-[0_0_12px_var(--theme-accent)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </nav>

      <div className="relative">
        <FuelGauge balance={balance} isLoading={isBalanceLoading} onOpenSettings={onOpenSettings} />
      </div>

      <div className="relative border-t border-white/10 px-6 py-4">
        <p className="text-center text-xs leading-relaxed text-[var(--theme-muted)]">
          Исторические персонажи воссозданы с помощью AI.
          <br />
          Ответы могут быть неточными.
        </p>
      </div>
    </aside>
  );
}
