import { useState } from "react";
import { AlertTriangle, List, GitBranch } from "lucide-react";
import { usePlannerStore } from "../../stores/planner-store";
import { ResultsSummary } from "./ResultsSummary";
import { ProductionChain } from "./ProductionChain";
import { ProductionGraph } from "../graph/ProductionGraph";

type ViewMode = "list" | "graph";

export function SolverResults() {
  const { solverOutput } = usePlannerStore();
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

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

      {solverOutput.nodes.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-satisfactory-text-dim)]">
            View:
          </span>
          <div className="flex rounded border border-[var(--color-satisfactory-border)] overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)]"
                  : "bg-[var(--color-satisfactory-panel)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "graph"
                  ? "bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)]"
                  : "bg-[var(--color-satisfactory-panel)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Graph
            </button>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <ProductionChain output={solverOutput} />
      ) : (
        <ProductionGraph output={solverOutput} />
      )}
    </div>
  );
}
