import { useChatStore } from "../../stores/chat-store";
import { Trash2 } from "lucide-react";
import type { AIProviderType } from "../../ai/types";

export function AISettings() {
  const { providerConfig, setProviderConfig, setProviderType, clearMessages } =
    useChatStore();

  return (
    <div className="p-4 border-b border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] space-y-3">
      {/* Provider toggle */}
      <div>
        <label className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1 block">
          Provider
        </label>
        <div className="flex gap-2">
          {(["anthropic", "ollama"] as AIProviderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setProviderType(type)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                providerConfig.type === type
                  ? "border-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-orange)] bg-[var(--color-satisfactory-orange)]/10"
                  : "border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
              }`}
            >
              {type === "anthropic" ? "Claude" : "Ollama"}
            </button>
          ))}
        </div>
      </div>

      {/* Anthropic settings */}
      {providerConfig.type === "anthropic" && (
        <>
          <div>
            <label className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1 block">
              API Key
            </label>
            {__ANTHROPIC_ENV_KEY__ ? (
              <div className="px-3 py-1.5 text-sm text-[var(--color-connected)] bg-[var(--color-connected)]/10 border border-[var(--color-connected)]/30 rounded">
                Using ANTHROPIC_API_KEY from environment
              </div>
            ) : (
              <input
                type="password"
                value={providerConfig.apiKey ?? ""}
                onChange={(e) =>
                  setProviderConfig({ ...providerConfig, apiKey: e.target.value })
                }
                placeholder="sk-ant-..."
                className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)]"
              />
            )}
          </div>
          <div>
            <label className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1 block">
              Model
            </label>
            <select
              value={providerConfig.model ?? "claude-sonnet-4-20250514"}
              onChange={(e) =>
                setProviderConfig({ ...providerConfig, model: e.target.value })
              }
              className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
            >
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
              <option value="claude-haiku-4-20250514">Claude Haiku 4</option>
              <option value="claude-opus-4-20250514">Claude Opus 4</option>
            </select>
          </div>
        </>
      )}

      {/* Ollama settings */}
      {providerConfig.type === "ollama" && (
        <>
          <div>
            <label className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1 block">
              Ollama URL
            </label>
            <input
              type="text"
              value={providerConfig.ollamaUrl ?? "http://localhost:11434"}
              onChange={(e) =>
                setProviderConfig({
                  ...providerConfig,
                  ollamaUrl: e.target.value,
                })
              }
              className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1 block">
              Model
            </label>
            <input
              type="text"
              value={providerConfig.ollamaModel ?? "llama3.1:8b"}
              onChange={(e) =>
                setProviderConfig({
                  ...providerConfig,
                  ollamaModel: e.target.value,
                })
              }
              placeholder="llama3.1:8b"
              className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
            />
          </div>
        </>
      )}

      {/* Clear chat */}
      <button
        onClick={clearMessages}
        className="flex items-center gap-1.5 text-xs text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-disconnected)] transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Clear conversation
      </button>
    </div>
  );
}
