import { AlertTriangle } from "lucide-react";
import { usePlannerStore } from "../../stores/planner-store";
import { ResultsSummary } from "./ResultsSummary";
import { ProductionChain } from "./ProductionChain";

export function SolverResults() {
  const { solverOutput } = usePlannerStore();
  if (!solverOutput) return null;

  return (
    <div className="space-y-6">
      {solverOutput.warnings.length > 0 && (
        <div className="space-y-1">
          {solverOutput.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-lg text-[var(--color-warning)] text-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
      <ResultsSummary output={solverOutput} />
      <ProductionChain output={solverOutput} />
    </div>
  );
}
