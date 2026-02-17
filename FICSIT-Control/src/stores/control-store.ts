import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConnectionStatus, ControlFeatureMap, CapabilitiesResponse, CommandType, CommandLogEntry } from "../types";
import { ControlClient } from "../api/control/control-client";
import { PayloadSchemaByType } from "../api/control/control-schemas";

const MAX_COMMAND_LOG = 50;
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX = 5;

interface ControlState {
  // Persisted
  controlHost: string;
  controlPort: number;
  token: string;

  // Ephemeral
  connectionStatus: ConnectionStatus;
  error: string | null;
  capabilities: CapabilitiesResponse | null;
  commandLog: CommandLogEntry[];
  client: ControlClient | null;

  // Actions
  setControlHost: (host: string) => void;
  setControlPort: (port: number) => void;
  setToken: (token: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  submitCommand: (type: CommandType, payload: unknown) => Promise<string | null>;
  isFeatureAvailable: (feature: keyof ControlFeatureMap) => boolean;
}

export const useControlStore = create<ControlState>()(
  persist(
    (set, get) => ({
      controlHost: "localhost",
      controlPort: 9090,
      token: "",

      connectionStatus: "disconnected",
      error: null,
      capabilities: null,
      commandLog: [],
      client: null,

      setControlHost: (host) => set({ controlHost: host }),
      setControlPort: (port) => set({ controlPort: port }),
      setToken: (token) => set({ token }),

      connect: async () => {
        const { controlHost, controlPort, token } = get();
        if (!token) {
          set({ connectionStatus: "error", error: "Token is required" });
          return;
        }

        const client = new ControlClient(controlHost, controlPort, token);
        set({ connectionStatus: "connecting", error: null, client });

        try {
          // Fetch capabilities first (no auth required)
          const capabilities = await client.fetchCapabilities();
          set({ capabilities });

          // Connect WebSocket stream for live command status events
          await client.connectStream();

          // Route WS events to update command log entries
          client.onEvent((event) => {
            set((state) => ({
              commandLog: state.commandLog.map((entry) =>
                entry.commandId === event.commandId
                  ? {
                      ...entry,
                      status: event.status,
                      result: event.result ?? null,
                      error: event.error ?? null,
                      updatedAt: Date.now(),
                    }
                  : entry
              ),
            }));
          });

          set({ connectionStatus: "connected", error: null });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connection failed";
          set({ connectionStatus: "error", error: message, client: null, capabilities: null });
          client.disconnect();
        }
      },

      disconnect: () => {
        const { client } = get();
        if (client) {
          client.disconnect();
        }
        set({
          connectionStatus: "disconnected",
          error: null,
          client: null,
          capabilities: null,
          commandLog: [],
        });
      },

      submitCommand: async (type, payload) => {
        const { client, connectionStatus, commandLog } = get();
        if (connectionStatus !== "connected" || !client) {
          return null;
        }

        // Validate payload against the schema for this command type
        const payloadSchema = PayloadSchemaByType[type];
        const payloadResult = payloadSchema.safeParse(payload);
        if (!payloadResult.success) {
          return null;
        }

        // Client-side rate limiting
        const now = Date.now();
        const recentCommands = commandLog.filter(
          (entry) => now - entry.submittedAt < RATE_LIMIT_WINDOW_MS
        );
        if (recentCommands.length >= RATE_LIMIT_MAX) {
          return null;
        }

        const idempotencyKey = crypto.randomUUID();

        try {
          const response = await client.submitCommand({
            idempotencyKey,
            type,
            payload: payloadResult.data,
          });

          const entry: CommandLogEntry = {
            commandId: response.commandId,
            idempotencyKey,
            type,
            payload: payloadResult.data,
            status: response.status,
            result: response.result,
            error: response.error,
            submittedAt: now,
            updatedAt: now,
          };

          set((state) => ({
            commandLog: [...state.commandLog.slice(-(MAX_COMMAND_LOG - 1)), entry],
          }));

          return response.commandId;
        } catch {
          return null;
        }
      },

      isFeatureAvailable: (feature) => {
        const { capabilities, connectionStatus } = get();
        if (connectionStatus !== "connected" || !capabilities) return false;
        return capabilities.features[feature] === true;
      },
    }),
    {
      name: "satisfactory-control",
      partialize: (state) => ({
        controlHost: state.controlHost,
        controlPort: state.controlPort,
        token: state.token,
      }),
    }
  )
);
