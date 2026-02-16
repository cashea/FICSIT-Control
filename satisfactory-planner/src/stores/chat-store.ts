import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, AIProviderConfig, ImageAttachment } from "../ai/types";
import { DEFAULT_ANTHROPIC_CONFIG } from "../ai/types";
import type { AIProviderType } from "../ai/types";
import { createProvider } from "../ai/create-provider";
import { buildSystemPrompt } from "../ai/system-prompt";
import { useFactoryStore } from "./factory-store";
import { useConnectionStore } from "./connection-store";

export type AIConnectionStatus = "idle" | "testing" | "connected" | "error";

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  providerConfig: AIProviderConfig;
  aiConnectionStatus: AIConnectionStatus;
  aiConnectionError: string | null;
  _abortController: AbortController | null;

  setProviderConfig: (config: AIProviderConfig) => void;
  setProviderType: (type: AIProviderType) => void;
  sendMessage: (content: string, images?: ImageAttachment[]) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
  clearError: () => void;
  testAIConnection: () => Promise<void>;
}

let messageCounter = 0;
function makeId(): string {
  return `msg_${Date.now()}_${++messageCounter}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      streamingContent: "",
      error: null,
      providerConfig: DEFAULT_ANTHROPIC_CONFIG,
      aiConnectionStatus: "idle" as AIConnectionStatus,
      aiConnectionError: null,
      _abortController: null,

      setProviderConfig: (config) => set({ providerConfig: config }),

      setProviderType: (type) => {
        const current = get().providerConfig;
        if (type === "anthropic") {
          set({
            providerConfig: {
              type: "anthropic",
              apiKey: current.apiKey ?? "",
              model: current.model ?? "claude-sonnet-4-20250514",
            },
          });
        } else {
          set({
            providerConfig: {
              type: "ollama",
              ollamaUrl: current.ollamaUrl ?? "http://localhost:11434",
              ollamaModel: current.ollamaModel ?? "llama3.1:8b",
            },
          });
        }
      },

      sendMessage: async (content: string, images?: ImageAttachment[]) => {
        const state = get();
        if (state.isStreaming) return;

        const userMessage: ChatMessage = {
          id: makeId(),
          role: "user",
          content,
          timestamp: Date.now(),
          ...(images?.length ? { images } : {}),
        };

        const abortController = new AbortController();

        set((s) => ({
          messages: [...s.messages, userMessage],
          isStreaming: true,
          streamingContent: "",
          error: null,
          _abortController: abortController,
        }));

        try {
          const provider = createProvider(state.providerConfig);

          const factoryState = useFactoryStore.getState();
          const connectionState = useConnectionStore.getState();
          const systemPrompt = buildSystemPrompt({
            isConnected: connectionState.status === "connected",
            powerCircuits: factoryState.powerCircuits,
            productionStats: factoryState.productionStats,
            inventory: factoryState.inventory,
            machines: factoryState.machines,
          });

          const allMessages = get().messages;

          let fullContent = "";
          for await (const chunk of provider.chat(
            allMessages,
            systemPrompt,
            abortController.signal,
          )) {
            fullContent += chunk;
            set({ streamingContent: fullContent });
          }

          const assistantMessage: ChatMessage = {
            id: makeId(),
            role: "assistant",
            content: fullContent,
            timestamp: Date.now(),
            provider: state.providerConfig.type,
          };

          set((s) => ({
            messages: [...s.messages, assistantMessage],
            isStreaming: false,
            streamingContent: "",
            _abortController: null,
          }));
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            const partial = get().streamingContent;
            if (partial.length > 0) {
              const partialMessage: ChatMessage = {
                id: makeId(),
                role: "assistant",
                content: partial + "\n\n*(response stopped)*",
                timestamp: Date.now(),
                provider: state.providerConfig.type,
              };
              set((s) => ({
                messages: [...s.messages, partialMessage],
                isStreaming: false,
                streamingContent: "",
                _abortController: null,
              }));
            } else {
              set({
                isStreaming: false,
                streamingContent: "",
                _abortController: null,
              });
            }
          } else {
            const errorMessage =
              e instanceof Error ? e.message : "Unknown error";
            set({
              isStreaming: false,
              streamingContent: "",
              error: errorMessage,
              _abortController: null,
            });
          }
        }
      },

      stopStreaming: () => {
        const { _abortController } = get();
        if (_abortController) {
          _abortController.abort();
        }
      },

      testAIConnection: async () => {
        const config = get().providerConfig;
        set({ aiConnectionStatus: "testing", aiConnectionError: null });
        try {
          const provider = createProvider(config);
          const result = await provider.testConnection();
          if (result.ok) {
            set({ aiConnectionStatus: "connected", aiConnectionError: null });
          } else {
            set({ aiConnectionStatus: "error", aiConnectionError: result.error ?? "Connection failed" });
          }
        } catch (e) {
          set({ aiConnectionStatus: "error", aiConnectionError: e instanceof Error ? e.message : "Unknown error" });
        }
      },

      clearMessages: () => set({ messages: [], error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "satisfactory-chat",
      partialize: (state) => ({
        providerConfig: state.providerConfig,
        // Strip images from persisted messages to avoid bloating localStorage
        messages: state.messages.map(({ images: _images, ...rest }) => rest),
      }),
    },
  ),
);
