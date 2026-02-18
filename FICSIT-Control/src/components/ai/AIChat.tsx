import { useState, useEffect } from "react";
import { Settings, Circle, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { AISettings } from "./AISettings";
import { useChatStore } from "../../stores/chat-store";

const STATUS_COLORS = {
  idle: "text-[var(--color-satisfactory-text-dim)]",
  testing: "text-[var(--color-satisfactory-orange)]",
  connected: "text-[var(--color-connected)]",
  error: "text-[var(--color-disconnected)]",
} as const;

const STATUS_LABELS = {
  idle: "Not tested",
  testing: "Testing...",
  connected: "Connected",
  error: "Connection failed",
} as const;

export function AIChat() {
  const [showSettings, setShowSettings] = useState(false);
  const { error, clearError, aiConnectionStatus, aiConnectionError, testAIConnection, providerConfig, messages, clearMessages } = useChatStore();

  // Test connection on mount and when provider config changes
  useEffect(() => {
    const hasConfig =
      providerConfig.type === "anthropic"
        ? !!(providerConfig.apiKey || __ANTHROPIC_ENV_KEY__)
        : !!providerConfig.ollamaUrl;
    if (hasConfig) {
      testAIConnection();
    }
  }, [providerConfig.type, providerConfig.apiKey, providerConfig.model, providerConfig.ollamaUrl, providerConfig.ollamaModel, testAIConnection]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-satisfactory-border)]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-satisfactory-text)]">
            AI Assistant
          </h2>
          <div className="flex items-center gap-1.5">
            {aiConnectionStatus === "testing" ? (
              <Loader2 className={`w-3 h-3 animate-spin ${STATUS_COLORS[aiConnectionStatus]}`} />
            ) : (
              <Circle className={`w-3 h-3 fill-current ${STATUS_COLORS[aiConnectionStatus]}`} />
            )}
            <span className={`text-xs ${STATUS_COLORS[aiConnectionStatus]}`}>
              {aiConnectionStatus === "error" && aiConnectionError
                ? aiConnectionError
                : STATUS_LABELS[aiConnectionStatus]}
            </span>
            {(aiConnectionStatus === "error" || aiConnectionStatus === "connected") && (
              <button
                onClick={testAIConnection}
                className="p-0.5 rounded hover:bg-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] transition-colors"
                title="Retest connection"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 rounded hover:bg-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded transition-colors ${
            showSettings
              ? "bg-[var(--color-satisfactory-orange)]/10 text-[var(--color-satisfactory-orange)]"
              : "hover:bg-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)]"
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      {showSettings && <AISettings />}

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-disconnected)]/10 border-b border-[var(--color-disconnected)]/30 text-sm text-[var(--color-disconnected)]">
          <span className="truncate mr-2">{error}</span>
          <button onClick={clearError} className="text-xs underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Messages area */}
      <ChatMessageList />

      {/* Input area */}
      <ChatInput />
    </div>
  );
}

export default AIChat;
