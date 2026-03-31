import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from "react";
import { Send, AlertCircle } from "lucide-react";

import type { Message, CharacterInfo } from "../types";
import { apiClient } from "../services/api";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  characterId: string;
  character: CharacterInfo | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatWindow({ characterId, character }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset messages when character changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput("");
  }, [characterId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.sendMessage({
        character_id: characterId,
        message: text,
      });

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(message);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, isLoading, characterId]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div className="flex flex-col h-full bg-soviet-dark-2">
      {/* Header */}
      {character && (
        <div className="px-6 py-4 border-b border-soviet-gray/30 bg-soviet-dark shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-soviet-dark-3 border border-soviet-red/50 flex items-center justify-center">
                <span className="font-display font-bold text-soviet-beige text-base">
                  {character.name[0]}
                </span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-soviet-dark" />
            </div>
            <div>
              <h2 className="font-display text-soviet-cream font-semibold text-base">
                {character.name}
              </h2>
              <p className="text-soviet-gray-light text-xs font-body">
                {character.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scrollbar-thin">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-10">
            <div className="w-16 h-16 bg-soviet-red/10 border border-soviet-red/30 rounded-full flex items-center justify-center">
              <span className="text-soviet-red-light text-2xl font-display font-bold">
                {character?.name[0] ?? "?"}
              </span>
            </div>
            <div>
              <p className="font-display text-soviet-cream text-lg font-semibold">
                {character?.name ?? "Выберите персонажа"}
              </p>
              <p className="text-soviet-gray-light text-sm font-body mt-1 max-w-xs">
                {character
                  ? `Начните диалог с ${character.name}. Задайте любой вопрос об эпохе.`
                  : "Выберите исторического персонажа из списка слева."}
              </p>
            </div>
            {character && (
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {getStarterQuestions(character.id).map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs font-body text-soviet-beige/70 border border-soviet-gray/30 rounded-full px-3 py-1.5
                      hover:border-soviet-red/40 hover:text-soviet-beige hover:bg-soviet-red/10 transition-all duration-150"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} character={character} />
        ))}

        {isLoading && <TypingIndicator character={character} />}

        {error && (
          <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 text-red-300 text-sm font-body">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-soviet-gray/30 bg-soviet-dark shrink-0">
        <div
          className={`flex items-end gap-3 bg-soviet-dark-3 border rounded-2xl px-4 py-3 transition-colors duration-150
            ${canSend || input.length > 0 ? "border-soviet-red/40" : "border-soviet-gray/30"}`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              character
                ? `Задайте вопрос ${character.name}…`
                : "Выберите персонажа для начала диалога…"
            }
            disabled={!character || isLoading}
            rows={1}
            className="flex-1 bg-transparent text-soviet-cream placeholder-soviet-gray-light text-sm font-body
              resize-none outline-none leading-relaxed disabled:opacity-50 min-h-[24px]"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={!canSend}
            aria-label="Отправить сообщение"
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150
              ${
                canSend
                  ? "bg-soviet-red hover:bg-soviet-red-bright text-white shadow-lg shadow-soviet-red/30"
                  : "bg-soviet-gray/20 text-soviet-gray-light cursor-not-allowed"
              }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-soviet-gray-light text-xs font-body mt-2 text-center">
          Enter — отправить · Shift+Enter — новая строка
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
  };
  return map[characterId] ?? [];
}
