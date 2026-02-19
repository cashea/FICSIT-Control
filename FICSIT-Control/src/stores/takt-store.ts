import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TaktPlan, TaktStage } from "../types";

interface TaktState {
  // Persisted
  plans: Record<string, TaktPlan>;
  stages: Record<string, TaktStage[]>; // keyed by planId

  // Ephemeral
  selectedPlanId: string | null;

  // Actions
  createPlan: (data: Omit<TaktPlan, "id" | "createdAt" | "updatedAt">) => string;
  updatePlan: (id: string, patch: Partial<TaktPlan>) => void;
  deletePlan: (id: string) => void;
  selectPlan: (id: string | null) => void;
  setStages: (planId: string, stages: TaktStage[]) => void;
}

export const useTaktStore = create<TaktState>()(
  persist(
    (set) => ({
      plans: {},
      stages: {},
      selectedPlanId: null,

      createPlan: (data) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const plan: TaktPlan = { ...data, id, createdAt: now, updatedAt: now };
        set((state) => ({
          plans: { ...state.plans, [id]: plan },
          selectedPlanId: id,
        }));
        return id;
      },

      updatePlan: (id, patch) => {
        set((state) => {
          const existing = state.plans[id];
          if (!existing) return state;
          return {
            plans: {
              ...state.plans,
              [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      deletePlan: (id) => {
        set((state) => {
          const { [id]: _, ...remainingPlans } = state.plans;
          const { [id]: __, ...remainingStages } = state.stages;
          return {
            plans: remainingPlans,
            stages: remainingStages,
            selectedPlanId: state.selectedPlanId === id ? null : state.selectedPlanId,
          };
        });
      },

      selectPlan: (id) => set({ selectedPlanId: id }),

      setStages: (planId, stages) => {
        set((state) => ({
          stages: { ...state.stages, [planId]: stages },
        }));
      },
    }),
    {
      name: "satisfactory-takt",
      partialize: (state) => ({
        plans: state.plans,
        stages: state.stages,
      }),
    },
  ),
);
