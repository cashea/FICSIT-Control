import { useRef, useEffect } from "react";
import { useChatStore } from "../../stores/chat-store";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { Loader2, Bot } from "lucide-react";

export function ChatMessageList() {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center h-full text-[var(--color-satisfactory-text-dim)]">
          <Bot className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">
            Ask about your factory, recipes, or optimization strategies.
          </p>
          <p className="text-xs mt-1">
            Connect to FRM for live factory analysis.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessageBubble key={msg.id} message={msg} />
      ))}

      {isStreaming && (
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--color-satisfactory-orange)]/20 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-4 h-4 text-[var(--color-satisfactory-orange)]" />
          </div>
          <div className="flex-1 p-3 rounded-lg bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] text-sm text-[var(--color-satisfactory-text)]">
            {streamingContent ? (
              <div className="whitespace-pre-wrap">{streamingContent}</div>
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-satisfactory-text-dim)]" />
            )}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
