import { useEffect, useState } from "react";

import { getThemeByEra } from "../theme";
import type { CharacterInfo } from "../types";
import { TalkingAvatar } from "./TalkingAvatar";

interface TypingIndicatorProps {
  character: CharacterInfo | null;
}

const PHRASES: Record<string, string[]> = {
  lenin: [
    "Анализирую классовые противоречия...",
    "Изучаю труды Маркса и Энгельса...",
    "Формулирую тезисы...",
  ],
  stalin: [
    "Взвешиваю каждое слово...",
    "Формирую позицию...",
    "Обдумываю ответ...",
  ],
  khrushchev: [
    "Вспоминаю, как это было...",
    "Собираюсь с мыслями...",
    "А вот помню такой случай...",
  ],
  brezhnev: [
    "Готовлю речь...",
    "Взвешиваю ситуацию...",
    "Консультируюсь с Политбюро...",
  ],
  gorbachev: [
    "Ищу новое мышление...",
    "Анализирую...",
    "Переосмысляю...",
  ],
  rurik: [
    "Вспоминаю походы...",
    "Собираю дружину мыслей...",
    "Слушаю гул северного ветра...",
  ],
  vladimir: [
    "Советуюсь с летописью...",
    "Размышляю о крещении Руси...",
    "Собираю слова для ответа...",
  ],
  yaroslav: [
    "Листаю Русскую Правду...",
    "Собираю мудрый ответ...",
    "Сверяюсь с летописями...",
  ],
  ivan3: [
    "Объединяю мысли, как земли...",
    "Взвешиваю государев ответ...",
    "Размышляю о Руси...",
  ],
  ivan4: [
    "Взвешиваю царское слово...",
    "Вспоминаю годы правления...",
    "Размышляю об ответе...",
  ],
  peter1: [
    "Прокладываю курс ответа...",
    "Собираю реформы в одну мысль...",
    "Думаю по-европейски...",
  ],
  catherine2: [
    "Обращаюсь к философии...",
    "Формулирую мысль...",
    "Вспоминаю эпоху Просвещения...",
  ],
  alexander2: [
    "Сверяюсь с замыслом реформ...",
    "Обдумываю государственный ответ...",
    "Взвешиваю слово императора...",
  ],
  nicholas2: [
    "Собираюсь с мыслями...",
    "Взвешиваю слова...",
    "Размышляю...",
  ],
};

const DEFAULT_PHRASES = ["Думаю...", "Вспоминаю...", "Обдумываю ответ..."];

export function TypingIndicator({ character }: TypingIndicatorProps) {
  const theme = getThemeByEra(character?.era);
  const phrases = (character ? PHRASES[character.id] : null) ?? DEFAULT_PHRASES;

  const [index, setIndex] = useState(() => Math.floor(Math.random() * phrases.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((current) => (current + 1) % phrases.length);
        setVisible(true);
      }, 280);
    }, 2600);

    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="flex items-end gap-4">
      <div className="shrink-0">
        <TalkingAvatar
          characterId={character?.id ?? ""}
          characterName={character?.name ?? "?"}
          isSpeaking={false}
          size="sm"
        />
      </div>

      <div className="flex items-center gap-3 rounded-[24px] rounded-tl-md border border-white/10 bg-[var(--theme-panel)]/88 px-5 py-4 shadow-[0_16px_30px_rgba(0,0,0,0.16)] backdrop-blur-md">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--theme-accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-[var(--theme-accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-[var(--theme-accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>

        <span
          className={`text-xs italic text-[var(--theme-muted)] transition-opacity duration-300 ${theme.accentClass}`}
          style={{ opacity: visible ? 1 : 0 }}
        >
          {phrases[index]}
        </span>
      </div>
    </div>
  );
}
