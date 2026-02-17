import { User, Bot } from "lucide-react";
import type { ChatMessage } from "../../ai/types";

interface Props {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-[var(--color-satisfactory-blue)]/30"
            : "bg-[var(--color-satisfactory-orange)]/20"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-[var(--color-satisfactory-blue)]" />
        ) : (
          <Bot className="w-4 h-4 text-[var(--color-satisfactory-orange)]" />
        )}
      </div>

      <div
        className={`max-w-[80%] p-3 rounded-lg text-sm ${
          isUser
            ? "bg-[var(--color-satisfactory-blue)]/20 border border-[var(--color-satisfactory-blue)]/30 text-[var(--color-satisfactory-text)]"
            : "bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text)]"
        }`}
      >
        {message.images && message.images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={`data:${img.mediaType};base64,${img.data}`}
                alt={`Attachment ${i + 1}`}
                className="max-w-[200px] max-h-[200px] rounded border border-[var(--color-satisfactory-border)] object-contain"
              />
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.provider && (
          <div className="mt-1.5 text-xs text-[var(--color-satisfactory-text-dim)]">
            via {message.provider === "anthropic" ? "Claude" : "Ollama"}
          </div>
        )}
      </div>
    </div>
  );
}
