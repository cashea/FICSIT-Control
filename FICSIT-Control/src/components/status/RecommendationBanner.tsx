import { useState } from "react";
import { Lightbulb, RefreshCw, Loader2, X, Settings, MessageCircleReply } from "lucide-react";
import { useRecommendation } from "../../hooks/useRecommendation";
import { useUIStore } from "../../stores/ui-store";
import { useChatStore } from "../../stores/chat-store";

export function RecommendationBanner() {
  const { status, text, error, lastUpdated, isAIConfigured, isFactoryConnected, refresh } =
    useRecommendation();
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setDraftMessage = useChatStore((s) => s.setDraftMessage);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  const handleReplyToAI = () => {
    if (text) {
      const message = `Regarding your recommendation: "${text}"\n\n`;
      setDraftMessage(message);
      setActiveTab("ai");
    }
  };

  if (!isAIConfigured) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)]">
        <Lightbulb className="w-4 h-4 text-[var(--color-satisfactory-text-dim)] shrink-0" />
        <span className="text-sm text-[var(--color-satisfactory-text-dim)] flex-1">
          Configure an AI provider to get live factory recommendations.
        </span>
        <button
          onClick={() => setActiveTab("ai")}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-[var(--color-satisfactory-orange)]/50 text-[var(--color-satisfactory-orange)] hover:bg-[var(--color-satisfactory-orange)]/10 transition-colors"
        >
          <Settings className="w-3 h-3" />
          Configure
        </button>
      </div>
    );
  }

  if (!isFactoryConnected) return null;

  // Dismissed until a newer recommendation arrives
  const isDismissed =
    dismissedAt !== null && lastUpdated !== null && dismissedAt >= lastUpdated;

  // First load — no text yet
  if (!text && status === "loading") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)]">
        <Loader2 className="w-4 h-4 text-[var(--color-satisfactory-orange)] animate-spin shrink-0" />
        <span className="text-sm text-[var(--color-satisfactory-text-dim)]">
          Analyzing factory...
        </span>
      </div>
    );
  }

  if (!text || isDismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-satisfactory-orange)]/30 bg-[var(--color-satisfactory-orange)]/5">
      <Lightbulb className="w-4 h-4 text-[var(--color-satisfactory-orange)] shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[var(--color-satisfactory-text)]">{text}</span>
        {error && (
          <span className="text-xs text-[var(--color-disconnected)] ml-2">
            (refresh failed)
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleReplyToAI}
          className="p-1.5 rounded hover:bg-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] transition-colors"
          title="Reply to AI"
        >
          <MessageCircleReply className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={refresh}
          disabled={status === "loading"}
          className="p-1.5 rounded hover:bg-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] transition-colors disabled:opacity-50"
          title="Refresh recommendation"
        >
          {status === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={() => setDismissedAt(Date.now())}
          className="p-1.5 rounded hover:bg-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
