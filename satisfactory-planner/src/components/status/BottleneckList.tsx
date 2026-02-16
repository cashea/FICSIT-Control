import { AlertTriangle } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import type { FRMMachine } from "../../types";

interface Bottleneck {
  name: string;
  type: "production" | "machine";
  efficiency: number;
  detail: string;
}

export function BottleneckList() {
  const { productionStats, machines } = useFactoryStore();

  const bottlenecks: Bottleneck[] = [];

  // Production bottlenecks: items with low production efficiency
  for (const stat of productionStats) {
    if (stat.MaxProd > 0 && stat.ProdPercent < 50) {
      bottlenecks.push({
        name: stat.Name,
        type: "production",
        efficiency: stat.ProdPercent,
        detail: `${stat.CurrentProd.toFixed(1)} / ${stat.MaxProd.toFixed(1)} per min`,
      });
    }
  }

  // Machine bottlenecks: idle or paused machines
  const allMachines: FRMMachine[] = Object.values(machines).flat();
  const stoppedMachines = allMachines.filter(
    (m) => !m.IsProducing && !m.IsPaused
  );
  const pausedMachines = allMachines.filter((m) => m.IsPaused);

  if (stoppedMachines.length > 0) {
    // Group by recipe for cleaner display
    const byRecipe = new Map<string, number>();
    for (const m of stoppedMachines) {
      const key = m.Recipe || "No recipe";
      byRecipe.set(key, (byRecipe.get(key) || 0) + 1);
    }
    for (const [recipe, count] of byRecipe) {
      bottlenecks.push({
        name: `${count}x idle machine${count > 1 ? "s" : ""}`,
        type: "machine",
        efficiency: 0,
        detail: recipe,
      });
    }
  }

  if (pausedMachines.length > 0) {
    bottlenecks.push({
      name: `${pausedMachines.length} paused machine${pausedMachines.length > 1 ? "s" : ""}`,
      type: "machine",
      efficiency: 0,
      detail: "Manually paused",
    });
  }

  bottlenecks.sort((a, b) => a.efficiency - b.efficiency);

  if (bottlenecks.length === 0) {
    return (
      <div className="p-4 bg-[var(--color-connected)]/10 border border-[var(--color-connected)]/30 rounded-lg text-[var(--color-connected)] text-sm">
        No bottlenecks detected — factory running smoothly!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
        Bottlenecks
        <span className="text-sm font-normal text-[var(--color-satisfactory-text-dim)]">
          ({bottlenecks.length})
        </span>
      </h2>
      <div className="space-y-1">
        {bottlenecks.map((b, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  b.efficiency === 0
                    ? "bg-[var(--color-disconnected)]"
                    : b.efficiency < 25
                      ? "bg-[var(--color-disconnected)]"
                      : "bg-[var(--color-warning)]"
                }`}
              />
              <div>
                <div className="text-sm font-medium">{b.name}</div>
                <div className="text-xs text-[var(--color-satisfactory-text-dim)]">
                  {b.detail}
                </div>
              </div>
            </div>
            <span
              className={`text-sm font-mono ${
                b.efficiency < 25
                  ? "text-[var(--color-disconnected)]"
                  : "text-[var(--color-warning)]"
              }`}
            >
              {b.efficiency.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
