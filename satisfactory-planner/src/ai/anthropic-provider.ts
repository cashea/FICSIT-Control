import type { AIProvider, ChatMessage, ImageAttachment } from "./types";

export class AnthropicProvider implements AIProvider {
  readonly type = "anthropic" as const;

  constructor(
    private apiKey: string,
    private model: string = "claude-sonnet-4-20250514",
  ) {}

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
    // Only send key from browser if no server-side env key is configured
    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }
    return headers;
  }

  async *chat(
    messages: ChatMessage[],
    systemPrompt: string,
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, undefined> {
    const response = await fetch("/api/anthropic/v1/messages", {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: AnthropicProvider.buildContent(m.content, m.images),
        })),
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
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
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const event = JSON.parse(data);
            if (
              event.type === "content_block_delta" &&
              event.delta?.type === "text_delta"
            ) {
              yield event.delta.text;
            }
            if (event.type === "error") {
              throw new Error(
                `Stream error: ${event.error?.message ?? "Unknown"}`,
              );
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private static buildContent(
    text: string,
    images?: ImageAttachment[],
  ): string | Array<Record<string, unknown>> {
    if (!images || images.length === 0) return text;
    const blocks: Array<Record<string, unknown>> = images.map((img) => ({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.data },
    }));
    if (text) blocks.push({ type: "text", text });
    return blocks;
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });
      if (response.ok) return { ok: true };
      const body = await response.text();
      return { ok: false, error: `${response.status}: ${body}` };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
}
