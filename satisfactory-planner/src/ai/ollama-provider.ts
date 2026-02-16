import type { AIProvider, ChatMessage } from "./types";

export class OllamaProvider implements AIProvider {
  readonly type = "ollama" as const;

  constructor(
    private baseUrl: string = "http://localhost:11434",
    private model: string = "llama3.1:8b",
  ) {}

  async *chat(
    messages: ChatMessage[],
    systemPrompt: string,
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, undefined> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.images?.length ? { images: m.images.map((i) => i.data) } : {}),
          })),
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama error ${response.status}: ${errorBody}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              yield json.message.content;
            }
            if (json.done) return;
          } catch {
            // Skip malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (response.ok) return { ok: true };
      return { ok: false, error: `${response.status}` };
    } catch {
      return { ok: false, error: `Cannot reach Ollama at ${this.baseUrl}` };
    }
  }
}
