import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AlertCircle, Loader2, RotateCcw, Send } from "lucide-react";

import type { CharacterInfo, Message } from "../types";
import { apiClient } from "../services/api";
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
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

  localStorage.setItem(key, newId);
  return newId;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

  useEffect(() => {
    const sid = getOrCreateSessionId(characterId);

    stop();
    setActiveMessageId(null);
    setSessionId(sid);
    setMessages([]);
    setError(null);
    setInput("");
    setIsLoadingHistory(true);

    apiClient
      .getHistory(sid)
      .then((data) => {
        const loaded: Message[] = data.messages.map((message) => ({
          id: generateId(),
          role: message.role,
          content: message.content,
          timestamp: new Date(),
        }));
        setMessages(loaded);
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
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
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
      // ignore missing session on backend
    }

    localStorage.removeItem(storageKey(characterId));
    const newSessionId = getOrCreateSessionId(characterId);
    setSessionId(newSessionId);
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
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(message);
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading && !isLoadingHistory;
  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col bg-soviet-dark-2">
      {character && (
        <div className="shrink-0 border-b border-soviet-gray/30 bg-soviet-dark px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <TalkingAvatar
                  characterId={character.id}
                  characterName={character.name}
                  isSpeaking={false}
                  size="md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-soviet-dark bg-green-500" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-soviet-cream">
                  {character.name}
                </h2>
                <p className="text-xs font-body text-soviet-gray-light">
                  {character.description}
                </p>
              </div>
            </div>

            {hasMessages && !isLoadingHistory && (
              <button
                onClick={() => void handleReset()}
                title="Начать новый диалог"
                className="flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-body text-soviet-gray-light transition-all duration-150 hover:border-soviet-gray/30 hover:bg-soviet-dark-3 hover:text-soviet-beige"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Новый диалог
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 scrollbar-thin">
        {isLoadingHistory && (
          <div className="flex h-full items-center justify-center gap-2 text-soviet-gray-light">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-body">Загружаем историю...</span>
          </div>
        )}

        {!isLoadingHistory && !hasMessages && (
          <div className="flex h-full flex-col items-center justify-center gap-4 pb-10 text-center">
            <TalkingAvatar
              characterId={character?.id ?? ""}
              characterName={character?.name ?? "?"}
              isSpeaking={false}
              size="lg"
            />
            <div>
              <p className="font-display text-lg font-semibold text-soviet-cream">
                {character?.name ?? "Выберите персонажа"}
              </p>
              <p className="mt-1 max-w-xs text-sm font-body text-soviet-gray-light">
                {character
                  ? `Начните диалог с ${character.name}. Задайте любой вопрос об эпохе.`
                  : "Выберите исторического персонажа из списка слева."}
              </p>
            </div>
            {character && (
              <div className="flex max-w-sm flex-wrap justify-center gap-2">
                {getStarterQuestions(character.id).map((question) => (
                  <button
                    key={question}
                    onClick={() => setInput(question)}
                    className="rounded-full border border-soviet-gray/30 px-3 py-1.5 text-xs font-body text-soviet-beige/70 transition-all duration-150 hover:border-soviet-red/40 hover:bg-soviet-red/10 hover:text-soviet-beige"
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
          <div className="flex items-start gap-2.5 rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm font-body text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-soviet-gray/30 bg-soviet-dark px-6 py-4">
        <div
          className={`flex items-end gap-3 rounded-2xl border bg-soviet-dark-3 px-4 py-3 transition-colors duration-150 ${
            canSend || input.length > 0 ? "border-soviet-red/40" : "border-soviet-gray/30"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoadingHistory
                ? "Загружаем историю..."
                : character
                  ? `Задайте вопрос ${character.name}...`
                  : "Выберите персонажа для начала диалога..."
            }
            disabled={!character || isLoading || isLoadingHistory}
            rows={1}
            className="min-h-[24px] flex-1 resize-none bg-transparent text-sm font-body leading-relaxed text-soviet-cream outline-none placeholder-soviet-gray-light disabled:opacity-50"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={!canSend}
            aria-label="Отправить сообщение"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-150 ${
              canSend
                ? "bg-soviet-red text-white shadow-lg shadow-soviet-red/30 hover:bg-soviet-red-bright"
                : "cursor-not-allowed bg-soviet-gray/20 text-soviet-gray-light"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs font-body text-soviet-gray-light">
          Enter - отправить · Shift+Enter - новая строка
        </p>
      </div>
    </div>
  );
}

function getStarterQuestions(characterId: string): string[] {
  const map: Record<string, string[]> = {
    khrushchev: [
      "Расскажите о секретном докладе 1956 года",
      "Что вы думаете о Карибском кризисе?",
      "Как проходила «Оттепель»?",
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
