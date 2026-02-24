import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { LocationBadge } from "../assets/LocationBadge";
import type { FRMMachine } from "../../types";

interface Bottleneck {
  name: string;
  type: "production" | "machine";
  efficiency: number;
  detail: string;
  /** Individual machines for this bottleneck group (when available) */
  machines?: FRMMachine[];
}

function BottleneckRow({ b }: { b: Bottleneck }) {
  const [expanded, setExpanded] = useState(false);
  const hasMachines = b.machines && b.machines.length > 0;

  return (
    <div className="bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)]">
      <div
        onClick={() => hasMachines && setExpanded(!expanded)}
        className={`flex items-center justify-between p-3${hasMachines ? " cursor-pointer hover:bg-[var(--color-satisfactory-border)]/20" : ""}`}
      >
        <div className="flex items-center gap-3">
          {hasMachines ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-satisfactory-text-dim)]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-satisfactory-text-dim)]" />
            )
          ) : (
            <div
              className={`w-2 h-2 rounded-full ${
                b.efficiency === 0
                  ? "bg-[var(--color-disconnected)]"
                  : b.efficiency < 25
                    ? "bg-[var(--color-disconnected)]"
                    : "bg-[var(--color-warning)]"
              }`}
            />
          )}
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

      {expanded && b.machines && (
        <div className="border-t border-[var(--color-satisfactory-border)]">
          {b.machines.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 text-xs border-b border-[var(--color-satisfactory-border)]/50 last:border-b-0 hover:bg-[var(--color-satisfactory-border)]/20"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    m.IsPaused
                      ? "bg-[var(--color-disconnected)]"
                      : "bg-[var(--color-warning)]"
                  }`}
                />
                <span className="text-[var(--color-satisfactory-text)]">
                  {m.Name}
                </span>
                <span className="text-[var(--color-satisfactory-text-dim)]">
                  {m.Recipe || "No recipe"}
                </span>
              </div>
              <LocationBadge
                location={m.location}
                entityType={m.Name}
                entityName={m.Recipe}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
    // Group by recipe, keeping machine references
    const byRecipe = new Map<string, FRMMachine[]>();
    for (const m of stoppedMachines) {
      const key = m.Recipe || "No recipe";
      const list = byRecipe.get(key);
      if (list) list.push(m);
      else byRecipe.set(key, [m]);
    }
    for (const [recipe, group] of byRecipe) {
      bottlenecks.push({
        name: `${group.length}x idle machine${group.length > 1 ? "s" : ""}`,
        type: "machine",
        efficiency: 0,
        detail: recipe,
        machines: group,
      });
    }
  }

  if (pausedMachines.length > 0) {
    bottlenecks.push({
      name: `${pausedMachines.length} paused machine${pausedMachines.length > 1 ? "s" : ""}`,
      type: "machine",
      efficiency: 0,
      detail: "Manually paused",
      machines: pausedMachines,
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
          <BottleneckRow key={i} b={b} />
        ))}
      </div>
    </div>
  );
}
