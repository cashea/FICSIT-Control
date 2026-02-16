export type MessageRole = "user" | "assistant";

export interface ImageAttachment {
  data: string; // base64 (no data-uri prefix)
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  provider?: AIProviderType;
  images?: ImageAttachment[];
}

export type AIProviderType = "anthropic" | "ollama";

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  model?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

export interface AIProvider {
  readonly type: AIProviderType;

  chat(
    messages: ChatMessage[],
    systemPrompt: string,
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, undefined>;

  testConnection(): Promise<{ ok: boolean; error?: string }>;
}

export const DEFAULT_ANTHROPIC_CONFIG: AIProviderConfig = {
  type: "anthropic",
  apiKey: "",
  model: "claude-sonnet-4-20250514",
};

export const DEFAULT_OLLAMA_CONFIG: AIProviderConfig = {
  type: "ollama",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.1:8b",
};
