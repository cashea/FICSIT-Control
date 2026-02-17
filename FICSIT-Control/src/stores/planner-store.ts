import { create } from "zustand";
import type { ProductionTarget, RecipeSelection, SolverOutput } from "../types";

interface PlannerState {
  targets: ProductionTarget[];
  recipeOverrides: RecipeSelection;
  solverOutput: SolverOutput | null;
  batchTimeMinutes: number | null;

  addTarget: (target: ProductionTarget) => void;
  removeTarget: (index: number) => void;
  updateTarget: (index: number, target: ProductionTarget) => void;
  setRecipeOverride: (itemId: string, recipeId: string) => void;
  clearRecipeOverride: (itemId: string) => void;
  setSolverOutput: (output: SolverOutput | null) => void;
  setBatchTimeMinutes: (mins: number | null) => void;
  reset: () => void;
}

export const usePlannerStore = create<PlannerState>()((set) => ({
  targets: [],
  recipeOverrides: {},
  solverOutput: null,
  batchTimeMinutes: null,

  addTarget: (target) =>
    set((state) => ({ targets: [...state.targets, target] })),

  removeTarget: (index) =>
    set((state) => ({
      targets: state.targets.filter((_, i) => i !== index),
    })),

  updateTarget: (index, target) =>
    set((state) => ({
      targets: state.targets.map((t, i) => (i === index ? target : t)),
    })),

  setRecipeOverride: (itemId, recipeId) =>
    set((state) => ({
      recipeOverrides: { ...state.recipeOverrides, [itemId]: recipeId },
    })),

  clearRecipeOverride: (itemId) =>
    set((state) => {
      const { [itemId]: _, ...rest } = state.recipeOverrides;
      return { recipeOverrides: rest };
    }),

  setSolverOutput: (output) => set({ solverOutput: output }),

  setBatchTimeMinutes: (mins) =>
    set((state) => ({
      batchTimeMinutes: mins,
      targets: state.targets.map((t) =>
        t.inputMode === "quantity" && mins && mins > 0 && t.inputValue != null
          ? { ...t, ratePerMinute: t.inputValue / mins }
          : t,
      ),
    })),

  reset: () =>
    set({
      targets: [],
      recipeOverrides: {},
      solverOutput: null,
      batchTimeMinutes: null,
    }),
}));
