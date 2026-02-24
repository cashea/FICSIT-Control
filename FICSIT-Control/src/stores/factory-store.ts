import { create } from "zustand";
import type {
  FRMPowerCircuit,
  FRMProdStat,
  FRMStorageContainer,
  FRMMachine,
  FRMGenerator,
  FRMBelt,
  FRMCable,
  FRMSwitch,
  FRMRecipe,
} from "../types";
import { machineKey, type MachineKey } from "../utils/machine-id";

export interface PowerSnapshot {
  time: number;
  production: number;
  consumed: number;
  capacity: number;
}

export interface ItemEfficiencyPoint {
  time: number;
  prodPercent: number;
  currentProd: number;
  maxProd: number;
}

export interface MachineEfficiencyPoint {
  time: number;
  percent: number;
  running: number;
  total: number;
}

export interface ProductionSnapshot {
  time: number;
  outputs: Array<{
    className: string;
    name: string;
    currentProd: number;
    maxProd: number;
    prodPercent: number;
  }>;
  inputs: Array<{
    className: string;
    name: string;
    currentConsumed: number;
    maxConsumed: number;
    consPercent: number;
  }>;
  powerConsumed: number;
  isProducing: boolean;
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
  belts: FRMBelt[];
  cables: FRMCable[];
  switches: FRMSwitch[];
  unlockedRecipes: FRMRecipe[];
  productionHistory: Record<MachineKey, ProductionSnapshot[]>;
  itemEfficiencyHistory: Record<string, ItemEfficiencyPoint[]>;
  machineEfficiencyHistory: MachineEfficiencyPoint[];

  setPowerCircuits: (data: FRMPowerCircuit[]) => void;
  setProductionStats: (data: FRMProdStat[]) => void;
  setInventory: (data: FRMStorageContainer[]) => void;
  setMachines: (type: string, data: FRMMachine[]) => void;
  setGenerators: (data: FRMGenerator[]) => void;
  setBelts: (data: FRMBelt[]) => void;
  setCables: (data: FRMCable[]) => void;
  setSwitches: (data: FRMSwitch[]) => void;
  setUnlockedRecipes: (data: FRMRecipe[]) => void;
  reset: () => void;
}

const initialState = {
  powerCircuits: [] as FRMPowerCircuit[],
  powerHistory: {} as Record<number, PowerSnapshot[]>,
  productionStats: [] as FRMProdStat[],
  inventory: [] as FRMStorageContainer[],
  machines: {} as Record<string, FRMMachine[]>,
  generators: [] as FRMGenerator[],
  belts: [] as FRMBelt[],
  cables: [] as FRMCable[],
  switches: [] as FRMSwitch[],
  unlockedRecipes: [] as FRMRecipe[],
  productionHistory: {} as Record<MachineKey, ProductionSnapshot[]>,
  itemEfficiencyHistory: {} as Record<string, ItemEfficiencyPoint[]>,
  machineEfficiencyHistory: [] as MachineEfficiencyPoint[],
};

export const useFactoryStore = create<FactoryState>()((set) => ({
  ...initialState,

  setPowerCircuits: (data) =>
    set((state) => {
      const now = Date.now();
      let historyChanged = false;
      const history = { ...state.powerHistory };
      for (const c of data) {
        const id = c.CircuitGroupID;
        const prev = history[id] ?? [];
        const last = prev[prev.length - 1];
        // Skip if too soon after last snapshot, or if timestamp would go backward
        if (
          last &&
          (now - last.time < MIN_SNAP_INTERVAL || now <= last.time)
        )
          continue;
        const snap: PowerSnapshot = {
          time: now,
          production: c.PowerProduction,
          consumed: c.PowerConsumed,
          capacity: c.PowerCapacity,
        };
        history[id] = [...prev.slice(-(MAX_HISTORY - 1)), snap];
        historyChanged = true;
      }
      return {
        powerCircuits: data,
        ...(historyChanged ? { powerHistory: history } : {}),
      };
    }),
  setProductionStats: (data) =>
    set((state) => {
      const now = Date.now();
      const history = { ...state.itemEfficiencyHistory };
      let changed = false;
      for (const stat of data) {
        if (stat.MaxProd <= 0) continue;
        const prev = history[stat.Name] ?? [];
        const last = prev[prev.length - 1];
        if (last && now - last.time < MIN_SNAP_INTERVAL) continue;
        const point: ItemEfficiencyPoint = {
          time: now,
          prodPercent: stat.ProdPercent,
          currentProd: stat.CurrentProd,
          maxProd: stat.MaxProd,
        };
        history[stat.Name] = [...prev.slice(-(MAX_HISTORY - 1)), point];
        changed = true;
      }
      return {
        productionStats: data,
        ...(changed ? { itemEfficiencyHistory: history } : {}),
      };
    }),
  setInventory: (data) => set({ inventory: data }),
  setMachines: (type, data) =>
    set((state) => {
      const now = Date.now();
      let historyChanged = false;
      const history = { ...state.productionHistory };
      for (const m of data) {
        const key = machineKey(m);
        const prev = history[key] ?? [];
        const last = prev[prev.length - 1];
        if (last && now - last.time < MIN_SNAP_INTERVAL) continue;
        const snap: ProductionSnapshot = {
          time: now,
          outputs: m.Production.map((p) => ({
            className: p.ClassName,
            name: p.Name,
            currentProd: p.CurrentProd,
            maxProd: p.MaxProd,
            prodPercent: p.ProdPercent,
          })),
          inputs: m.Ingredients.map((ing) => ({
            className: ing.ClassName,
            name: ing.Name,
            currentConsumed: ing.CurrentConsumed,
            maxConsumed: ing.MaxConsumed,
            consPercent: ing.ConsPercent,
          })),
          powerConsumed: m.PowerInfo?.PowerConsumed ?? 0,
          isProducing: m.IsProducing,
        };
        history[key] = [...prev.slice(-(MAX_HISTORY - 1)), snap];
        historyChanged = true;
      }
      // Compute overall machine efficiency with updated type
      const updatedMachines = { ...state.machines, [type]: data };
      const all = Object.values(updatedMachines).flat();
      const running = all.filter((m) => m.IsProducing).length;
      const total = all.length;
      const pct = total > 0 ? (running / total) * 100 : 0;

      const prevEff = state.machineEfficiencyHistory;
      const lastEff = prevEff[prevEff.length - 1];
      let effUpdate: Partial<FactoryState> = {};
      if (!lastEff || now - lastEff.time >= MIN_SNAP_INTERVAL) {
        effUpdate = {
          machineEfficiencyHistory: [
            ...prevEff.slice(-(MAX_HISTORY - 1)),
            { time: now, percent: pct, running, total },
          ],
        };
      }

      return {
        machines: updatedMachines,
        ...(historyChanged ? { productionHistory: history } : {}),
        ...effUpdate,
      };
    }),
  setGenerators: (data) => set({ generators: data }),
  setBelts: (data) => set({ belts: data }),
  setCables: (data) => set({ cables: data }),
  setSwitches: (data) => set({ switches: data }),
  setUnlockedRecipes: (data) => set({ unlockedRecipes: data }),
  reset: () => set(initialState),
}));
