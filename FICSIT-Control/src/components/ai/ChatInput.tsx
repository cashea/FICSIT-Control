import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Square, X, Image } from "lucide-react";
import { useChatStore } from "../../stores/chat-store";
import type { ImageAttachment } from "../../ai/types";

function fileToAttachment(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // strip "data:<media>;base64," prefix
      const base64 = dataUrl.split(",")[1];
      resolve({
        data: base64,
        mediaType: file.type as ImageAttachment["mediaType"],
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export function ChatInput() {
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isStreaming, stopStreaming, draftMessage, setDraftMessage } = useChatStore();

  // Apply draft message when it changes
  useEffect(() => {
    if (draftMessage !== null) {
      // Use a microtask to avoid setState-in-render issues
      Promise.resolve().then(() => {
        setInput(draftMessage);
        setDraftMessage(null);
        // Auto-resize textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
          textareaRef.current.focus();
        }
      });
    }
  }, [draftMessage, setDraftMessage]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if ((!trimmed && pendingImages.length === 0) || isStreaming) return;
    setInput("");
    setPendingImages([]);
    sendMessage(trimmed || "(image)", pendingImages.length > 0 ? pendingImages : undefined);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, pendingImages, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  const addImageFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => ACCEPTED_TYPES.has(f.type));
    if (imageFiles.length === 0) return;
    const attachments = await Promise.all(imageFiles.map(fileToAttachment));
    setPendingImages((prev) => [...prev, ...attachments]);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const imageItems: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/") && ACCEPTED_TYPES.has(item.type)) {
          const file = item.getAsFile();
          if (file) imageItems.push(file);
        }
      }
      if (imageItems.length > 0) {
        e.preventDefault();
        addImageFiles(imageItems);
      }
    },
    [addImageFiles],
  );

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-[var(--color-satisfactory-border)] p-3">
      {/* Pending image previews */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {pendingImages.map((img, i) => (
            <div
              key={i}
              className="relative group w-16 h-16 rounded border border-[var(--color-satisfactory-border)] overflow-hidden bg-[var(--color-satisfactory-dark)]"
            >
              <img
                src={`data:${img.mediaType};base64,${img.data}`}
                alt={`Attachment ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-disconnected)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            isStreaming
              ? "Waiting for response..."
              : pendingImages.length > 0
                ? "Add a message or send the image..."
                : "Ask about your factory... (paste images with Ctrl+V)"
          }
          disabled={isStreaming}
          rows={1}
          className="flex-1 px-3 py-2 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded-lg text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)] resize-none disabled:opacity-50 focus:outline-none focus:border-[var(--color-satisfactory-orange)]/50"
        />
        {isStreaming ? (
          <button
            onClick={stopStreaming}
            className="p-2 rounded-lg bg-[var(--color-disconnected)]/20 text-[var(--color-disconnected)] border border-[var(--color-disconnected)]/30 hover:bg-[var(--color-disconnected)]/30 transition-colors"
            title="Stop generating"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() && pendingImages.length === 0}
            className="p-2 rounded-lg bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] border border-[var(--color-satisfactory-orange)]/30 hover:bg-[var(--color-satisfactory-orange)]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Send message"
          >
            {pendingImages.length > 0 ? (
              <Image className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
