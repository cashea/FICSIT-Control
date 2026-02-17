import { Zap, AlertTriangle } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { useConnectionStore } from "../../stores/connection-store";
import { formatMW } from "../../utils/format";

export function PowerDashboard() {
  const { powerCircuits } = useFactoryStore();
  const { status } = useConnectionStore();

  if (status !== "connected") {
    return (
      <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
        Connect to FRM to view power data
      </div>
    );
  }

  if (powerCircuits.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
        No power data available
      </div>
    );
  }

  const totalProduction = powerCircuits.reduce(
    (sum, c) => sum + c.PowerProduction,
    0
  );
  const totalConsumption = powerCircuits.reduce(
    (sum, c) => sum + c.PowerConsumed,
    0
  );
  const totalCapacity = powerCircuits.reduce(
    (sum, c) => sum + c.PowerCapacity,
    0
  );
  const anyFuseTriggered = powerCircuits.some((c) => c.FuseTriggered);

  const utilizationPercent =
    totalCapacity > 0 ? (totalConsumption / totalCapacity) * 100 : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        Power Grid
      </h2>

      {anyFuseTriggered && (
        <div className="flex items-center gap-2 p-3 bg-[var(--color-disconnected)]/10 border border-[var(--color-disconnected)]/30 rounded-lg text-[var(--color-disconnected)]">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">Fuse triggered! Power grid overloaded.</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
          <div className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Production
          </div>
          <div className="text-xl font-bold text-[var(--color-connected)]">
            {formatMW(totalProduction)}
          </div>
        </div>

        <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
          <div className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Consumption
          </div>
          <div className="text-xl font-bold text-[var(--color-satisfactory-orange)]">
            {formatMW(totalConsumption)}
          </div>
        </div>

        <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
          <div className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Capacity
          </div>
          <div className="text-xl font-bold">{formatMW(totalCapacity)}</div>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--color-satisfactory-text-dim)]">
            Grid Utilization
          </span>
          <span
            className={
              utilizationPercent > 90
                ? "text-[var(--color-disconnected)]"
                : utilizationPercent > 70
                  ? "text-[var(--color-warning)]"
                  : "text-[var(--color-connected)]"
            }
          >
            {utilizationPercent.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-3 bg-[var(--color-satisfactory-dark)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              utilizationPercent > 90
                ? "bg-[var(--color-disconnected)]"
                : utilizationPercent > 70
                  ? "bg-[var(--color-warning)]"
                  : "bg-[var(--color-connected)]"
            }`}
            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Per-circuit breakdown */}
      {powerCircuits.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)]">
            Circuits ({powerCircuits.length})
          </h3>
          {powerCircuits.map((circuit) => (
            <div
              key={circuit.CircuitGroupID}
              className="flex items-center justify-between p-3 bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)] text-sm"
            >
              <span>Circuit {circuit.CircuitGroupID}</span>
              <div className="flex gap-4">
                <span className="text-[var(--color-connected)]">
                  {formatMW(circuit.PowerProduction)}
                </span>
                <span className="text-[var(--color-satisfactory-text-dim)]">/</span>
                <span className="text-[var(--color-satisfactory-orange)]">
                  {formatMW(circuit.PowerConsumed)}
                </span>
                {circuit.FuseTriggered && (
                  <AlertTriangle className="w-4 h-4 text-[var(--color-disconnected)]" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
