import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, Loader2, RotateCcw, Send } from "lucide-react";

import { apiClient } from "../services/api";
import { getThemeByEra } from "../theme";
import type { CharacterInfo, Message } from "../types";
import { useTTS } from "../hooks/useTTS";
import { MessageBubble } from "./MessageBubble";
import { TalkingAvatar } from "./TalkingAvatar";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  characterId: string;
  character: CharacterInfo | null;
  onMessageSent?: () => void;
}

function storageKey(characterId: string): string {
  return `soviet_chat_session_${characterId}`;
}

function getOrCreateSessionId(characterId: string): string {
  const key = storageKey(characterId);
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
          const r = (Math.random() * 16) | 0;
          const v = char === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

  localStorage.setItem(key, newId);
  return newId;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStarterQuestions(characterId: string): string[] {
  const map: Record<string, string[]> = {
    khrushchev: [
      "Расскажите о секретном докладе 1956 года",
      "Что вы думаете о Карибском кризисе?",
      "Как проходила оттепель?",
    ],
    stalin: [
      "Как вы победили в Великой Отечественной войне?",
      "Что такое социализм в одной стране?",
      "Расскажите об индустриализации СССР",
    ],
    lenin: [
      "Почему произошла революция 1917 года?",
      "Что такое НЭП?",
      "Расскажите о диктатуре пролетариата",
    ],
    ivan4: [
      "Как вы создавали опричнину?",
      "Почему вы приняли титул царя?",
      "Расскажите о взятии Казани",
    ],
  };

  return map[characterId] ?? [];
}

function getQuestionPrompt(characterId: string): string {
  const map: Record<string, string> = {
    lenin: "Задайте вопрос Владимиру Ленину",
    stalin: "Задайте вопрос Иосифу Сталину",
    khrushchev: "Задайте вопрос Никите Хрущёву",
    brezhnev: "Задайте вопрос Леониду Брежневу",
    gorbachev: "Задайте вопрос Михаилу Горбачёву",
    peter1: "Задайте вопрос Петру I",
    catherine2: "Задайте вопрос Екатерине II",
    alexander2: "Задайте вопрос Александру II",
    nicholas2: "Задайте вопрос Николаю II",
    ivan3: "Задайте вопрос Ивану III",
    ivan4: "Задайте вопрос Ивану Грозному",
    rurik: "Задайте вопрос Рюрику",
    vladimir: "Задайте вопрос Владимиру Святославовичу",
    yaroslav: "Задайте вопрос Ярославу Мудрому",
  };

  return map[characterId] ?? "Задайте вопрос персонажу";
}

function getConversationPrompt(characterId: string): string {
  const map: Record<string, string> = {
    lenin: "Начните разговор с Владимиром Лениным",
    stalin: "Начните разговор с Иосифом Сталиным",
    khrushchev: "Начните разговор с Никитой Хрущёвым",
    brezhnev: "Начните разговор с Леонидом Брежневым",
    gorbachev: "Начните разговор с Михаилом Горбачёвым",
    peter1: "Начните разговор с Петром I",
    catherine2: "Начните разговор с Екатериной II",
    alexander2: "Начните разговор с Александром II",
    nicholas2: "Начните разговор с Николаем II",
    ivan3: "Начните разговор с Иваном III",
    ivan4: "Начните разговор с Иваном Грозным",
    rurik: "Начните разговор с Рюриком",
    vladimir: "Начните разговор с Владимиром Святославовичем",
    yaroslav: "Начните разговор с Ярославом Мудрым",
  };

  return map[characterId] ?? "Начните разговор с персонажем";
}

export function ChatWindow({ characterId, character, onMessageSent }: ChatWindowProps) {
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId(characterId));
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const { state: ttsState, speak, restart, stop } = useTTS();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const theme = getThemeByEra(character?.era);

  useEffect(() => {
    const nextSessionId = getOrCreateSessionId(characterId);

    stop();
    setActiveMessageId(null);
    setSessionId(nextSessionId);
    setMessages([]);
    setError(null);
    setInput("");
    setIsLoadingHistory(true);

    apiClient
      .getHistory(nextSessionId)
      .then((data) => {
        const loadedMessages: Message[] = data.messages.map((message) => ({
          id: generateId(),
          role: message.role,
          content: message.content,
          timestamp: new Date(),
        }));

        setMessages(loadedMessages);
      })
      .catch(() => {
        setMessages([]);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [characterId, stop]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    if (ttsState === "idle" || ttsState === "error") {
      setActiveMessageId(null);
    }
  }, [ttsState]);

  const handleReset = useCallback(async () => {
    stop();
    setActiveMessageId(null);

    try {
      await apiClient.deleteSession(sessionId);
    } catch {
      // Ignore missing session on backend.
    }

    localStorage.removeItem(storageKey(characterId));
    const nextSessionId = getOrCreateSessionId(characterId);
    setSessionId(nextSessionId);
    setMessages([]);
    setError(null);
    setInput("");
    textareaRef.current?.focus();
  }, [characterId, sessionId, stop]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    stop();
    setActiveMessageId(null);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.sendMessage({
        character_id: characterId,
        session_id: sessionId,
        message: text,
      });

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onMessageSent?.();
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(detail);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [characterId, input, isLoading, onMessageSent, sessionId, stop]);

  const handleSpeakMessage = useCallback(
    async (message: Message) => {
      if (!character || message.role !== "assistant") return;
      setActiveMessageId(message.id);
      await speak(character.id, message.content);
    },
    [character, speak]
  );

  const handleRestartMessage = useCallback(
    async (message: Message) => {
      if (!character || message.role !== "assistant") return;
      setActiveMessageId(message.id);
      await restart(character.id, message.content);
    },
    [character, restart]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading && !isLoadingHistory;
  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex h-full flex-col bg-[var(--theme-surface)] text-[var(--theme-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,transparent,rgba(0,0,0,0.18))]" />

      {character && (
        <div className="relative shrink-0 border-b border-white/10 bg-[var(--theme-panel)]/85 px-6 py-5 backdrop-blur-xl">
          <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/60 to-transparent" />
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <TalkingAvatar
                  characterId={character.id}
                  characterName={character.name}
                  isSpeaking={false}
                  size="md"
                />
                <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--theme-accent-soft)] bg-[var(--theme-badge)] px-1 text-[10px] text-[var(--theme-accent)]">
                  {theme.crest}
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${theme.badgeClass}`}
                  >
                    {character.era}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--theme-muted)]">
                    {theme.title}
                  </span>
                </div>
                <h2 className="font-display text-[30px] font-semibold leading-none text-[var(--theme-text)]">
                  {character.name}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--theme-text-soft)]">
                  {character.description}
                </p>
              </div>
            </div>

            {hasMessages && !isLoadingHistory && (
              <button
                onClick={() => void handleReset()}
                title="Начать новый диалог"
                className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[var(--theme-text-soft)] transition-all duration-150 hover:border-[var(--theme-accent-soft)] hover:bg-[var(--theme-badge)] hover:text-[var(--theme-text)]"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Новый диалог
                </span>
              </button>
            )}
          </div>

          <p className="mt-4 max-w-3xl text-xs uppercase tracking-[0.28em] text-[var(--theme-muted)]">
            {theme.subtitle}
          </p>
        </div>
      )}

      <div className="relative flex-1 space-y-6 overflow-y-auto px-6 py-6 scrollbar-thin">
        {isLoadingHistory && (
          <div className="flex h-full items-center justify-center gap-2 text-[var(--theme-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Загружаем историю...</span>
          </div>
        )}

        {!isLoadingHistory && !hasMessages && (
          <div className="flex h-full flex-col items-center justify-center gap-5 pb-12 text-center">
            <TalkingAvatar
              characterId={character?.id ?? ""}
              characterName={character?.name ?? "?"}
              isSpeaking={false}
              size="lg"
            />

            <div className="max-w-2xl">
              <p className="font-display text-3xl font-semibold text-[var(--theme-text)]">
                {character?.name ?? "Выберите персонажа"}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--theme-text-soft)]">
                {character
                  ? `Перед вами ${theme.title.toLowerCase()}. ${getConversationPrompt(character.id)} и задайте вопрос о событиях, власти, войнах или быте эпохи.`
                  : "Выберите исторического персонажа из списка слева."}
              </p>
            </div>

            {character && (
              <div className="flex max-w-2xl flex-wrap justify-center gap-2.5">
                {getStarterQuestions(character.id).map((question) => (
                  <button
                    key={question}
                    onClick={() => setInput(question)}
                    className="rounded-full border border-[var(--theme-accent-soft)] bg-[var(--theme-badge)] px-4 py-2 text-xs text-[var(--theme-text-soft)] transition-all duration-150 hover:border-[var(--theme-accent)] hover:text-[var(--theme-text)]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoadingHistory &&
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              character={character}
              ttsState={ttsState}
              isSpeaking={activeMessageId === message.id && (ttsState === "playing" || ttsState === "paused")}
              onSpeak={() => void handleSpeakMessage(message)}
              onRestart={() => void handleRestartMessage(message)}
            />
          ))}

        {isLoading && <TypingIndicator character={character} />}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="relative shrink-0 border-t border-white/10 bg-[var(--theme-panel)]/82 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 rounded-[28px] border border-white/10 bg-[var(--theme-panel-strong)]/90 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoadingHistory
                ? "Загружаем историю..."
                : character
                  ? getQuestionPrompt(character.id)
                  : "Выберите персонажа для начала диалога..."
            }
            disabled={!character || isLoading || isLoadingHistory}
            rows={1}
            className="min-h-[48px] flex-1 resize-none self-center bg-transparent py-[11px] text-sm leading-6 text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)] disabled:opacity-50"
          />

          <button
            onClick={() => void sendMessage()}
            disabled={!canSend}
            aria-label="Отправить сообщение"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-150 ${
              canSend
                ? "bg-[var(--theme-accent)] text-[var(--theme-send-text)] shadow-[0_14px_26px_rgba(0,0,0,0.25)] hover:scale-[1.02]"
                : "cursor-not-allowed bg-white/10 text-[var(--theme-muted)]"
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-[var(--theme-muted)]">
          Enter - отправить · Shift+Enter - новая строка
        </p>
      </div>
    </div>
  );
}
