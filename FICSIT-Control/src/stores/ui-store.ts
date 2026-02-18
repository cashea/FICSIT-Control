import { create } from "zustand";

export type ActiveTab = "status" | "assets" | "dashboard" | "power" | "oneline" | "planner" | "recipes" | "ai";

interface UIState {
  activeTab: ActiveTab;

  setActiveTab: (tab: ActiveTab) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTab: "status",

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
