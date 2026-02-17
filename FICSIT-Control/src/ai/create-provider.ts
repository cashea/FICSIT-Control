import type { AIProvider, AIProviderConfig } from "./types";
import { AnthropicProvider } from "./anthropic-provider";
import { OllamaProvider } from "./ollama-provider";

export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case "anthropic":
      if (!config.apiKey && !__ANTHROPIC_ENV_KEY__)
        throw new Error("Anthropic API key is required — set ANTHROPIC_API_KEY env var or enter a key in settings");
      return new AnthropicProvider(config.apiKey ?? "", config.model);
    case "ollama":
      return new OllamaProvider(config.ollamaUrl, config.ollamaModel);
    default:
      throw new Error(`Unknown provider type`);
  }
}
