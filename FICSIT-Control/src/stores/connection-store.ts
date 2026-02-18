import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConnectionStatus } from "../types";
import { FRMClient } from "../api/frm-client";
import type { FRMEndpoint } from "../api/frm-client";
import { useFactoryStore } from "./factory-store";

let pollTimer: ReturnType<typeof setInterval> | null = null;

const MACHINE_ENDPOINTS = [
  "getAssembler",
  "getSmelter",
  "getConstructor",
  "getRefinery",
  "getManufacturer",
  "getFoundry",
  "getBlender",
  "getPackager",
] as const;

interface ConnectionState {
  host: string;
  port: number;
  status: ConnectionStatus;
  error: string | null;
  lastUpdate: number | null;
  client: FRMClient | null;

  setHost: (host: string) => void;
  setPort: (port: number) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      host: "localhost",
      port: 8080,
      status: "disconnected",
      error: null,
      lastUpdate: null,
      client: null,

      setHost: (host) => set({ host }),
      setPort: (port) => set({ port }),

      connect: async () => {
        const { host, port } = get();
        const client = new FRMClient(host, port);

        set({ status: "connecting", error: null, client });

        try {
          await client.connect();
          set({ status: "connected", error: null });

          // Set up data handler to route any WebSocket push data to factory store
          client.onData((endpoint: FRMEndpoint, data: unknown) => {
            set({ lastUpdate: Date.now() });
            const factory = useFactoryStore.getState();

            switch (endpoint) {
              case "getPower":
                factory.setPowerCircuits(data as never[]);
                break;
              case "getProdStats":
                factory.setProductionStats(data as never[]);
                break;
              case "getStorageInv":
                factory.setInventory(data as never[]);
                break;
              case "getAssembler":
              case "getSmelter":
              case "getConstructor":
              case "getRefinery":
              case "getManufacturer":
              case "getFoundry":
              case "getBlender":
              case "getPackager":
              case "getParticleAccelerator":
                factory.setMachines(endpoint, data as never[]);
                break;
              case "getGenerators":
                factory.setGenerators(data as never[]);
                break;
            }
          });

          // Poll FRM via REST for reliable data delivery
          const pollData = async () => {
            if (get().status !== "connected") return;
            const c = get().client;
            if (!c) return;
            const factory = useFactoryStore.getState();

            const [power, prod, storage, generators] = await Promise.allSettled([
              c.getPower(),
              c.getProdStats(),
              c.getStorageInv(),
              c.getGenerators(),
            ]);

            if (power.status === "fulfilled") factory.setPowerCircuits(power.value);
            if (prod.status === "fulfilled") factory.setProductionStats(prod.value);
            if (storage.status === "fulfilled") factory.setInventory(storage.value);
            if (generators.status === "fulfilled") factory.setGenerators(generators.value);

            const machineResults = await Promise.allSettled(
              MACHINE_ENDPOINTS.map((type) => c.getMachines(type)),
            );
            for (let i = 0; i < MACHINE_ENDPOINTS.length; i++) {
              const result = machineResults[i];
              if (result.status === "fulfilled") {
                factory.setMachines(MACHINE_ENDPOINTS[i], result.value);
              } else {
                console.warn(`[FRM] ${MACHINE_ENDPOINTS[i]} failed:`, result.reason);
              }
            }

            set({ lastUpdate: Date.now() });
          };

          // Initial fetch + start polling every 3s
          await pollData();
          pollTimer = setInterval(pollData, 3000);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connection failed";
          set({ status: "error", error: message, client: null });
          client.disconnect();
        }
      },

      disconnect: () => {
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
        const { client } = get();
        if (client) {
          client.disconnect();
        }
        set({
          status: "disconnected",
          error: null,
          client: null,
          lastUpdate: null,
        });
        useFactoryStore.getState().reset();
      },
    }),
    {
      name: "satisfactory-connection",
      partialize: (state) => ({ host: state.host, port: state.port }),
    }
  )
);
