import { useEffect, useState } from "react";
import type { CharacterInfo } from "../types";
import { TalkingAvatar } from "./TalkingAvatar";

interface TypingIndicatorProps {
  character: CharacterInfo | null;
}

const AVATARS: Record<string, string> = {
  khrushchev: "Х", stalin: "С", lenin: "Л",
  rurik: "Р", vladimir: "Вл", yaroslav: "Я",
  ivan3: "И³", ivan4: "И⁴",
  peter1: "П", catherine2: "Е", nicholas2: "Н",
  brezhnev: "Б", gorbachev: "Г",
};

// Фразы по персонажам. Если персонаж не найден — используется DEFAULT
const PHRASES: Record<string, string[]> = {
  lenin: [
    "Анализирую классовые противоречия…",
    "Изучаю труды Маркса и Энгельса…",
    "Формулирую тезисы…",
    "Обдумываю позицию партии…",
    "Вспоминаю опыт революции…",
  ],
  stalin: [
    "Взвешиваю каждое слово…",
    "Обдумываю ответ…",
    "Консультируюсь с историей…",
    "Формирую позицию…",
    "Вспоминаю…",
  ],
  khrushchev: [
    "Вспоминаю, как это было…",
    "Думаю, думаю…",
    "Собираюсь с мыслями…",
    "А вот помню такой случай…",
    "Обдумываю ответ…",
  ],
  brezhnev: [
    "Обдумываю…",
    "Вспоминаю годы застоя…",
    "Взвешиваю ситуацию…",
    "Консультируюсь с Политбюро…",
    "Готовлю речь…",
  ],
  gorbachev: [
    "Переосмысливаю…",
    "Ищу новое мышление…",
    "Взвешиваю все стороны…",
    "Думаю о перестройке…",
    "Анализирую…",
  ],
  rurik: [
    "Вспоминаю походы…",
    "Думаю на языке предков…",
    "Собираюсь с мыслями…",
    "Вспоминаю дружину…",
    "Обдумываю…",
  ],
  vladimir: [
    "Молюсь и размышляю…",
    "Вспоминаю крещение Руси…",
    "Обдумываю ответ…",
    "Советуюсь с митрополитом…",
    "Вспоминаю…",
  ],
  yaroslav: [
    "Листаю «Русскую Правду»…",
    "Обдумываю мудрый ответ…",
    "Вспоминаю летописи…",
    "Взвешиваю слова…",
    "Думаю…",
  ],
  ivan3: [
    "Вспоминаю объединение земель…",
    "Обдумываю государственный ответ…",
    "Взвешиваю каждое слово…",
    "Думаю о Руси…",
    "Размышляю…",
  ],
  ivan4: [
    "Размышляю об опричнине…",
    "Вспоминаю годы правления…",
    "Взвешиваю слова…",
    "Обдумываю ответ…",
    "Думаю…",
  ],
  peter1: [
    "Вспоминаю реформы…",
    "Думаю по-европейски…",
    "Обдумываю ответ…",
    "Прокладываю курс…",
    "Взвешиваю…",
  ],
  catherine2: [
    "Обращаюсь к философии…",
    "Вспоминаю эпоху Просвещения…",
    "Формулирую мысль…",
    "Обдумываю ответ…",
    "Размышляю…",
  ],
  nicholas2: [
    "Вспоминаю те годы…",
    "Обдумываю ответ…",
    "Размышляю…",
    "Собираюсь с мыслями…",
    "Взвешиваю слова…",
  ],
};

const DEFAULT_PHRASES = [
  "Думаю…",
  "Вспоминаю…",
  "Размышляю…",
  "Обдумываю ответ…",
  "Собираюсь с мыслями…",
];

export function TypingIndicator({ character }: TypingIndicatorProps) {
  const phrases =
    (character ? PHRASES[character.id] : null) ?? DEFAULT_PHRASES;

  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * phrases.length)
  );
  const [visible, setVisible] = useState(true);

  // Меняем фразу каждые 2.8 сек с плавным fade
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % phrases.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="flex gap-3 items-end">
      {/* Avatar */}
      <div className="shrink-0">
        <TalkingAvatar
          characterId={character?.id ?? ""}
          characterName={character?.name ?? "?"}
          isSpeaking={false}
          size="sm"
        />
      </div>

      {/* Bubble */}
      <div className="bg-soviet-dark-3 border border-soviet-gray/20 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-3">
        {/* Три точки */}
        <div className="flex gap-1.5 items-center shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-soviet-red-light animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-soviet-red-light animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-soviet-red-light animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>

        {/* Фраза с fade */}
        <span
          className="text-soviet-gray-light text-xs font-body italic transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {phrases[index]}
        </span>
      </div>
    </div>
  );
}
