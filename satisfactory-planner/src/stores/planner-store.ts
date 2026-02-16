import { create } from "zustand";
import type { ProductionTarget, RecipeSelection, SolverOutput } from "../types";

interface PlannerState {
  targets: ProductionTarget[];
  recipeOverrides: RecipeSelection;
  solverOutput: SolverOutput | null;

  addTarget: (target: ProductionTarget) => void;
  removeTarget: (index: number) => void;
  updateTarget: (index: number, target: ProductionTarget) => void;
  setRecipeOverride: (itemId: string, recipeId: string) => void;
  clearRecipeOverride: (itemId: string) => void;
  setSolverOutput: (output: SolverOutput | null) => void;
  reset: () => void;
}

export const usePlannerStore = create<PlannerState>()((set) => ({
  targets: [],
  recipeOverrides: {},
  solverOutput: null,

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

  reset: () =>
    set({ targets: [], recipeOverrides: {}, solverOutput: null }),
}));
