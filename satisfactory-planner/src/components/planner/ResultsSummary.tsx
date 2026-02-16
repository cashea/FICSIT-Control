import { Zap, Factory, Pickaxe } from "lucide-react";
import { ITEMS } from "../../data/items";
import { BUILDINGS } from "../../data/buildings";
import type { SolverOutput } from "../../types";

export function ResultsSummary({ output }: { output: SolverOutput }) {
  const totalBuildings = output.nodes.reduce(
    (sum, n) => sum + n.buildingCount,
    0,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Raw Resources */}
      <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
        <div className="flex items-center gap-2 mb-3">
          <Pickaxe className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold">Raw Resources</span>
        </div>
        {output.rawResources.length === 0 ? (
          <p className="text-xs text-[var(--color-satisfactory-text-dim)]">
            None
          </p>
        ) : (
          <div className="space-y-1">
            {output.rawResources.map((r) => (
              <div
                key={r.itemId}
                className="flex justify-between text-sm"
              >
                <span className="text-[var(--color-satisfactory-text-dim)]">
                  {ITEMS[r.itemId]?.name ?? r.itemId}
                </span>
                <span className="font-mono">
                  {r.ratePerMinute.toFixed(1)}/min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Power */}
      <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold">Power</span>
        </div>
        <div className="text-2xl font-bold mb-2">
          {output.totalPowerMW.toFixed(1)} MW
        </div>
        <div className="space-y-1">
          {Object.entries(output.powerByBuilding).map(([id, data]) => {
            const name =
              BUILDINGS[id as keyof typeof BUILDINGS]?.name ?? id;
            return (
              <div
                key={id}
                className="flex justify-between text-xs text-[var(--color-satisfactory-text-dim)]"
              >
                <span>
                  {data.count.toFixed(1)}x {name}
                </span>
                <span className="font-mono">{data.totalMW.toFixed(1)} MW</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total Buildings */}
      <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
        <div className="flex items-center gap-2 mb-3">
          <Factory className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">Buildings</span>
        </div>
        <div className="text-2xl font-bold mb-2">
          {totalBuildings.toFixed(1)} total
        </div>
        <div className="space-y-1">
          {Object.entries(output.powerByBuilding).map(([id, data]) => {
            const name =
              BUILDINGS[id as keyof typeof BUILDINGS]?.name ?? id;
            return (
              <div
                key={id}
                className="flex justify-between text-xs text-[var(--color-satisfactory-text-dim)]"
              >
                <span>{name}</span>
                <span className="font-mono">{data.count.toFixed(1)}x</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
