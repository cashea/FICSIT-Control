import { useState, useEffect, useRef, useCallback } from "react";
import { createProvider } from "../ai/create-provider";
import { buildRecommendationPrompt } from "../ai/recommendation-prompt";
import { useChatStore } from "../stores/chat-store";
import { useFactoryStore } from "../stores/factory-store";
import { useConnectionStore } from "../stores/connection-store";
import type { ChatMessage } from "../ai/types";

export type RecommendationStatus = "idle" | "loading" | "success" | "error";

interface RecommendationState {
  status: RecommendationStatus;
  text: string | null;
  error: string | null;
  lastUpdated: number | null;
}

const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export function useRecommendation() {
  const [state, setState] = useState<RecommendationState>({
    status: "idle",
    text: null,
    error: null,
    lastUpdated: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const providerConfig = useChatStore((s) => s.providerConfig);
  const connectionStatus = useConnectionStore((s) => s.status);

  const isAIConfigured =
    providerConfig.type === "anthropic"
      ? !!(providerConfig.apiKey || __ANTHROPIC_ENV_KEY__)
      : !!providerConfig.ollamaUrl;

  const isFactoryConnected = connectionStatus === "connected";

  const fetchRecommendation = useCallback(async () => {
    if (!isAIConfigured || !isFactoryConnected) {
      setState((s) => ({ ...s, status: "idle" }));
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, status: "loading", error: null }));

    try {
      const provider = createProvider(providerConfig);
      const factory = useFactoryStore.getState();
      const { systemPrompt, userMessage } = buildRecommendationPrompt({
        isConnected: true,
        powerCircuits: factory.powerCircuits,
        productionStats: factory.productionStats,
        inventory: factory.inventory,
        machines: factory.machines,
      });

      const messages: ChatMessage[] = [
        {
          id: "rec",
          role: "user",
          content: userMessage,
          timestamp: Date.now(),
        },
      ];

      let content = "";
      for await (const chunk of provider.chat(
        messages,
        systemPrompt,
        controller.signal,
      )) {
        content += chunk;
      }

      if (mountedRef.current) {
        setState({
          status: "success",
          text: content.trim(),
          error: null,
          lastUpdated: Date.now(),
        });
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          status: "error",
          error: e instanceof Error ? e.message : "Unknown error",
        }));
      }
    }
  }, [isAIConfigured, isFactoryConnected, providerConfig]);

  // Auto-refresh on timer + initial fetch
  useEffect(() => {
    if (!isAIConfigured || !isFactoryConnected) return;

    fetchRecommendation();
    timerRef.current = setInterval(fetchRecommendation, REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchRecommendation, isAIConfigured, isFactoryConnected]);

  // Pause when tab hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (isAIConfigured && isFactoryConnected) {
        fetchRecommendation();
        timerRef.current = setInterval(fetchRecommendation, REFRESH_INTERVAL_MS);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchRecommendation, isAIConfigured, isFactoryConnected]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    ...state,
    isAIConfigured,
    isFactoryConnected,
    refresh: fetchRecommendation,
  };
}
