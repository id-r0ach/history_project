export interface CharacterInfo {
  id: string;
  name: string;
  years: string;
  description: string;
  era: string;
}

export interface ChatRequest {
  character_id: string;
  session_id: string;
  message: string;
}

export interface ChatResponse {
  character_id: string;
  session_id: string;
  reply: string;
  model: string;
}

export interface ApiError {
  detail: string;
}

export interface ServiceBalance {
  service: string;
  current: number;
  initial: number;
  spent: number;
  requests: number;
  percent: number;
}

export interface BalanceInfo {
  llm: ServiceBalance;
  tts: ServiceBalance;
  total_percent: number;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

// Сообщение из БД (без поля id и timestamp — их нет на бэкенде)
export interface HistoryMessage {
  role: MessageRole;
  content: string;
}

export interface HistoryResponse {
  session_id: string;
  messages: HistoryMessage[];
}
