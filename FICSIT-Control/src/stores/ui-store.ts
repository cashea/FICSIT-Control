import { create } from "zustand";

export type ActiveTab = "status" | "assets" | "inventory" | "dashboard" | "power" | "oneline" | "planner" | "takt" | "recipes" | "favorites" | "ai";

interface UIState {
  activeTab: ActiveTab;
  /** Endpoint name of machine type to highlight/expand in MachineBreakdown */
  highlightedMachineType: string | null;

  setActiveTab: (tab: ActiveTab) => void;
  setHighlightedMachineType: (type: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTab: "status",
  highlightedMachineType: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setHighlightedMachineType: (type) => set({ highlightedMachineType: type }),
}));
