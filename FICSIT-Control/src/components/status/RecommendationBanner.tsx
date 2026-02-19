```tsx
import { useState, useCallback, type ReactNode } from "react";
import {
  Lightbulb,
  RefreshCw,
  Loader2,
  X,
  Settings,
  MessageCircleReply,
} from "lucide-react";
import { useRecommendation } from "../../hooks/useRecommendation";
import { useUIStore } from "../../stores/ui-store";
import { useChatStore } from "../../stores/chat-store";

const REPLY_MESSAGE_TEMPLATE = (text: string) => `Regarding your recommendation: "${text}"\n\n`;

/** Parse [[endpoint|Label]] markers in recommendation text into clickable spans */
function parseRecommendationText(
  text: string,
  onClickType: (endpoint: string) => void,
): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const endpoint = match[1];
    const label = match[2];
    parts.push(
      <button
        key={match.index}
        onClick={(e) => {
          e.stopPropagation();
          onClickType(endpoint);
        }}
        className="underline decoration-[var(--color-satisfactory-orange)]/50 text-[var(--color-satisfactory-orange)] hover:text-[var(--color-satisfactory-orange)]/80 transition-colors cursor-pointer"
      >
        {label}
      </button>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function RecommendationBanner() {
  const { status, text, error, lastUpdated, isAIConfigured, isFactoryConnected, refresh } =
    useRecommendation();

  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setHighlightedMachineType = useUIStore((s) => s.setHighlightedMachineType);
  const setDraftMessage = useChatStore((s) => s.setDraftMessage);

  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  const handleMachineTypeClick = useCallback(
    (endpoint: string) => {
      setHighlightedMachineType(endpoint);
      setActiveTab("status");
    },
    [setHighlightedMachineType, setActiveTab],
  );

  const handleReplyToAI = useCallback(() => {
    if (text) {
      setDraftMessage(REPLY_MESSAGE_TEMPLATE(text));
      setActiveTab("ai");
    }
  }, [text, setDraftMessage, setActiveTab]);

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
        <span className="text-sm text-[var(--color-satisfactory-text)]">
          {parseRecommendationText(text!, handleMachineTypeClick)}
        </span>
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
```
