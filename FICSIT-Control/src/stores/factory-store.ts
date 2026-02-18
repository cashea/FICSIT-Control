import { create } from "zustand";
import type {
  FRMPowerCircuit,
  FRMProdStat,
  FRMStorageContainer,
  FRMMachine,
  FRMGenerator,
} from "../types";

export interface PowerSnapshot {
  time: number;
  production: number;
  consumed: number;
  capacity: number;
}

const MAX_HISTORY = 120; // ~6 min at 3s polls
const MIN_SNAP_INTERVAL = 2000; // deduplicate WS + REST double-fires

interface FactoryState {
  powerCircuits: FRMPowerCircuit[];
  powerHistory: Record<number, PowerSnapshot[]>;
  productionStats: FRMProdStat[];
  inventory: FRMStorageContainer[];
  machines: Record<string, FRMMachine[]>;
  generators: FRMGenerator[];

  setPowerCircuits: (data: FRMPowerCircuit[]) => void;
  setProductionStats: (data: FRMProdStat[]) => void;
  setInventory: (data: FRMStorageContainer[]) => void;
  setMachines: (type: string, data: FRMMachine[]) => void;
  setGenerators: (data: FRMGenerator[]) => void;
  reset: () => void;
}

const initialState = {
  powerCircuits: [] as FRMPowerCircuit[],
  powerHistory: {} as Record<number, PowerSnapshot[]>,
  productionStats: [] as FRMProdStat[],
  inventory: [] as FRMStorageContainer[],
  machines: {} as Record<string, FRMMachine[]>,
  generators: [] as FRMGenerator[],
};

export const useFactoryStore = create<FactoryState>()((set) => ({
  ...initialState,

  setPowerCircuits: (data) =>
    set((state) => {
      const now = Date.now();
      const history = { ...state.powerHistory };
      for (const c of data) {
        const id = c.CircuitGroupID;
        const prev = history[id] ?? [];
        const last = prev[prev.length - 1];
        // Skip if too soon after last snapshot, or if timestamp would go backward
        if (last && (now - last.time < MIN_SNAP_INTERVAL || now <= last.time)) continue;
        const snap: PowerSnapshot = {
          time: now,
          production: c.PowerProduction,
          consumed: c.PowerConsumed,
          capacity: c.PowerCapacity,
        };
        history[id] = [...prev.slice(-(MAX_HISTORY - 1)), snap];
      }
      return { powerCircuits: data, powerHistory: history };
    }),
  setProductionStats: (data) => set({ productionStats: data }),
  setInventory: (data) => set({ inventory: data }),
  setMachines: (type, data) =>
    set((state) => ({
      machines: { ...state.machines, [type]: data },
    })),
  setGenerators: (data) => set({ generators: data }),
  reset: () => set(initialState),
}));
