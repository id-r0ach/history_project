import { useCallback, useEffect, useState } from "react";

import type { BalanceInfo, CharacterInfo } from "./types";
import { CharacterSidebar } from "./components/CharacterSidebar";
import { ChatWindow } from "./components/ChatWindow";
import { SettingsModal } from "./components/SettingsModal";
import { apiClient } from "./services/api";
import { getThemeByEra } from "./theme";

const FALLBACK_CHARACTERS: CharacterInfo[] = [
  {
    id: "khrushchev",
    name: "Никита Хрущёв",
    years: "1953–1964",
    description: "Первый секретарь ЦК КПСС",
    era: "СССР",
  },
  {
    id: "stalin",
    name: "Иосиф Сталин",
    years: "1924–1953",
    description: "Генеральный секретарь ЦК ВКП(б) / КПСС",
    era: "СССР",
  },
  {
    id: "lenin",
    name: "Владимир Ленин",
    years: "1917–1924",
    description: "Председатель Совета народных комиссаров",
    era: "СССР",
  },
];

export default function App() {
  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const refreshBalance = useCallback(() => {
    apiClient
      .getBalance()
      .then(setBalance)
      .catch(() => {
        // Balance is non-critical for the main flow.
      });
  }, []);

  useEffect(() => {
    apiClient
      .getCharacters()
      .then((data) => {
        setCharacters(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {
        setCharacters(FALLBACK_CHARACTERS);
        setSelectedId(FALLBACK_CHARACTERS[0].id);
      })
      .finally(() => setIsFetching(false));
  }, []);

  useEffect(() => {
    setIsBalanceLoading(true);
    apiClient
      .getBalance()
      .then(setBalance)
      .finally(() => setIsBalanceLoading(false));
  }, []);

  const selectedCharacter = characters.find((character) => character.id === selectedId) ?? null;
  const activeTheme = getThemeByEra(selectedCharacter?.era);

  return (
    <div className={`theme-shell ${activeTheme.shellClass} flex h-screen w-screen overflow-hidden font-body`}>
      <CharacterSidebar
        characters={characters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        isLoading={isFetching}
        balance={balance}
        isBalanceLoading={isBalanceLoading}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="h-full min-w-0 flex-1 bg-[var(--theme-surface)]">
        {selectedId ? (
          <ChatWindow
            key={selectedId}
            characterId={selectedId}
            character={selectedCharacter}
            onMessageSent={refreshBalance}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--theme-muted)]">
            Выберите персонажа для начала диалога
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        balance={balance}
        onBalanceUpdate={(nextBalance) => {
          setBalance(nextBalance);
        }}
      />
    </div>
  );
}
