import { create } from "zustand";
import type {
  FRMPowerCircuit,
  FRMProdStat,
  FRMStorageContainer,
  FRMMachine,
} from "../types";

interface FactoryState {
  powerCircuits: FRMPowerCircuit[];
  productionStats: FRMProdStat[];
  inventory: FRMStorageContainer[];
  machines: Record<string, FRMMachine[]>;

  setPowerCircuits: (data: FRMPowerCircuit[]) => void;
  setProductionStats: (data: FRMProdStat[]) => void;
  setInventory: (data: FRMStorageContainer[]) => void;
  setMachines: (type: string, data: FRMMachine[]) => void;
  reset: () => void;
}

const initialState = {
  powerCircuits: [] as FRMPowerCircuit[],
  productionStats: [] as FRMProdStat[],
  inventory: [] as FRMStorageContainer[],
  machines: {} as Record<string, FRMMachine[]>,
};

export const useFactoryStore = create<FactoryState>()((set) => ({
  ...initialState,

  setPowerCircuits: (data) => set({ powerCircuits: data }),
  setProductionStats: (data) => set({ productionStats: data }),
  setInventory: (data) => set({ inventory: data }),
  setMachines: (type, data) =>
    set((state) => ({
      machines: { ...state.machines, [type]: data },
    })),
  reset: () => set(initialState),
}));
