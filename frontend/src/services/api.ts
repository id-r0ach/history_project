import type {
  CharacterInfo,
  ChatRequest,
  ChatResponse,
  HistoryResponse,
  ApiError,
} from "../types";

const BASE_URL = "/api";

class ApiClient {
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const err: ApiError = await response.json();
        errorDetail = err.detail ?? errorDetail;
      } catch {
        // ignore parse error, keep generic message
      }
      throw new Error(errorDetail);
    }

    return response.json() as Promise<T>;
  }

  async getCharacters(): Promise<CharacterInfo[]> {
    return this.request<CharacterInfo[]>("/characters");
  }

  async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getHistory(sessionId: string): Promise<HistoryResponse> {
    return this.request<HistoryResponse>(`/history/${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.request<unknown>(`/sessions/${sessionId}`, {
      method: "DELETE",
    });
  }

  async synthesizeSpeech(characterId: string, text: string): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character_id: characterId, text }),
    });
    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const err = await response.json() as { detail?: string };
        detail = err.detail ?? detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }
    return response.blob();
  }
}

export const apiClient = new ApiClient();
