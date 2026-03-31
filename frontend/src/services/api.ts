import type { CharacterInfo, ChatRequest, ChatResponse, ApiError } from "../types";

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
}

export const apiClient = new ApiClient();
