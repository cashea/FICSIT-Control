import { Calculator, RotateCcw } from "lucide-react";
import { usePlannerStore } from "../../stores/planner-store";
import { solve } from "../../solver";
import { TargetInputSection } from "./TargetInputSection";
import { RecipeOverrides } from "./RecipeOverrides";
import { SolverResults } from "./SolverResults";

export function PlannerView() {
  const { targets, recipeOverrides, setSolverOutput, solverOutput, reset } =
    usePlannerStore();

  function handleSolve() {
    const result = solve({ targets, recipeOverrides });
    setSolverOutput(result);
  }

  return (
    <div className="space-y-6">
      <TargetInputSection />

      <RecipeOverrides />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSolve}
          disabled={targets.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)] font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          <Calculator className="w-4 h-4" />
          Solve
        </button>
        {(targets.length > 0 || solverOutput) && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] rounded hover:text-[var(--color-satisfactory-text)] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      <SolverResults />
    </div>
  );
}
