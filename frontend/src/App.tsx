import { useEffect, useState } from "react";
import type { CharacterInfo } from "./types";
import { apiClient } from "./services/api";
import { CharacterSidebar } from "./components/CharacterSidebar";
import { ChatWindow } from "./components/ChatWindow";

// Fallback characters shown while fetching from backend
const FALLBACK_CHARACTERS: CharacterInfo[] = [
  {
    id: "khrushchev",
    name: "Никита Хрущёв",
    years: "1894–1971",
    description: "Первый секретарь ЦК КПСС (1953–1964)",
  },
  {
    id: "stalin",
    name: "Иосиф Сталин",
    years: "1878–1953",
    description: "Генеральный секретарь ЦК ВКП(б) / КПСС (1922–1953)",
  },
  {
    id: "lenin",
    name: "Владимир Ленин",
    years: "1870–1924",
    description: "Председатель Совета народных комиссаров (1917–1924)",
  },
];

export default function App() {
  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    apiClient
      .getCharacters()
      .then((data) => {
        setCharacters(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {
        // Use fallback if backend is unavailable at startup
        setCharacters(FALLBACK_CHARACTERS);
        setSelectedId(FALLBACK_CHARACTERS[0].id);
      })
      .finally(() => setIsFetching(false));
  }, []);

  const selectedCharacter =
    characters.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-screen w-screen bg-soviet-dark overflow-hidden font-body">
      <CharacterSidebar
        characters={characters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        isLoading={isFetching}
      />
      <main className="flex-1 min-w-0 h-full">
        {selectedId ? (
          <ChatWindow
            key={selectedId}
            characterId={selectedId}
            character={selectedCharacter}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-soviet-gray-light font-body text-sm">
            Выберите персонажа для начала диалога
          </div>
        )}
      </main>
    </div>
  );
}
