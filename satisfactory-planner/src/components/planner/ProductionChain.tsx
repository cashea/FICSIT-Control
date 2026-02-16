import { ArrowRight } from "lucide-react";
import { ITEMS } from "../../data/items";
import { RECIPES } from "../../data/recipes";
import { BUILDINGS } from "../../data/buildings";
import type { SolverOutput } from "../../types";

export function ProductionChain({ output }: { output: SolverOutput }) {
  if (output.nodes.length === 0) return null;

  // Sort nodes: raw resource producers first, final products last
  // Use a simple heuristic: nodes with fewer downstream edges appear first
  const nodeOutDegree = new Map<string, number>();
  for (const node of output.nodes) {
    nodeOutDegree.set(node.id, 0);
  }
  for (const edge of output.edges) {
    nodeOutDegree.set(
      edge.fromNodeId,
      (nodeOutDegree.get(edge.fromNodeId) ?? 0) + 1,
    );
  }

  // Nodes that produce raw resource inputs come first (high out-degree),
  // final products last (low out-degree)
  const sorted = [...output.nodes].sort((a, b) => {
    const aOut = nodeOutDegree.get(a.id) ?? 0;
    const bOut = nodeOutDegree.get(b.id) ?? 0;
    if (bOut !== aOut) return bOut - aOut;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Production Chain</h2>
      <div className="space-y-2">
        {sorted.map((node) => {
          const recipe = RECIPES[node.recipeId];
          const building =
            BUILDINGS[node.buildingId as keyof typeof BUILDINGS];

          return (
            <div
              key={node.id}
              className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-sm">
                    {recipe?.name ?? node.recipeId}
                  </span>
                  <span className="ml-2 text-sm text-[var(--color-satisfactory-text-dim)]">
                    {node.buildingCount.toFixed(1)}x{" "}
                    {building?.name ?? node.buildingId}
                  </span>
                </div>
                <span className="text-sm text-[var(--color-satisfactory-orange)] font-mono">
                  {node.powerMW.toFixed(1)} MW
                </span>
              </div>

              <div className="flex items-start gap-4 text-sm">
                {/* Inputs */}
                <div className="flex-1">
                  <div className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
                    Inputs
                  </div>
                  {node.inputs.length === 0 ? (
                    <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
                      None
                    </span>
                  ) : (
                    <div className="space-y-0.5">
                      {node.inputs.map((inp) => (
                        <div
                          key={inp.itemId}
                          className="flex justify-between"
                        >
                          <span>
                            {ITEMS[inp.itemId]?.name ?? inp.itemId}
                          </span>
                          <span className="font-mono text-[var(--color-satisfactory-text-dim)]">
                            {inp.ratePerMinute.toFixed(1)}/min
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 mt-4 text-[var(--color-satisfactory-text-dim)] shrink-0" />

                {/* Outputs */}
                <div className="flex-1">
                  <div className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
                    Outputs
                  </div>
                  <div className="space-y-0.5">
                    {node.outputs.map((out) => (
                      <div
                        key={out.itemId}
                        className="flex justify-between"
                      >
                        <span>
                          {ITEMS[out.itemId]?.name ?? out.itemId}
                        </span>
                        <span className="font-mono text-[var(--color-satisfactory-text-dim)]">
                          {out.ratePerMinute.toFixed(1)}/min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
