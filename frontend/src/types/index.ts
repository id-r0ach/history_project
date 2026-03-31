export interface CharacterInfo {
  id: string;
  name: string;
  years: string;
  description: string;
}

export interface ChatRequest {
  character_id: string;
  message: string;
}

export interface ChatResponse {
  character_id: string;
  reply: string;
  model: string;
}

export interface ApiError {
  detail: string;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}
