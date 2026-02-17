import { Zap, AlertTriangle, Battery } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { formatMW } from "../../utils/format";
import type { FRMPowerCircuit } from "../../types";

function utilizationColor(percent: number): string {
  if (percent > 90) return "text-[var(--color-disconnected)]";
  if (percent > 70) return "text-[var(--color-warning)]";
  return "text-[var(--color-connected)]";
}

function utilizationBarColor(percent: number): string {
  if (percent > 90) return "bg-[var(--color-disconnected)]";
  if (percent > 70) return "bg-[var(--color-warning)]";
  return "bg-[var(--color-connected)]";
}

function CircuitCard({ circuit }: { circuit: FRMPowerCircuit }) {
  const utilization =
    circuit.PowerCapacity > 0
      ? (circuit.PowerConsumed / circuit.PowerCapacity) * 100
      : 0;

  const hasBattery = circuit.BatteryCapacity > 0;

  return (
    <div
      className={`p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border ${
        circuit.FuseTriggered
          ? "border-[var(--color-disconnected)]"
          : "border-[var(--color-satisfactory-border)]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium">
            Circuit {circuit.CircuitGroupID}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {circuit.FuseTriggered && (
            <div className="flex items-center gap-1 text-[var(--color-disconnected)] text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              Fuse tripped
            </div>
          )}
          <span className={`text-sm font-medium ${utilizationColor(utilization)}`}>
            {utilization.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="w-full h-2 bg-[var(--color-satisfactory-dark)] rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${utilizationBarColor(utilization)}`}
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-[var(--color-satisfactory-text-dim)]">Production</div>
          <div className="text-[var(--color-connected)] font-medium">
            {formatMW(circuit.PowerProduction)}
          </div>
        </div>
        <div>
          <div className="text-[var(--color-satisfactory-text-dim)]">Consumption</div>
          <div className="text-[var(--color-satisfactory-orange)] font-medium">
            {formatMW(circuit.PowerConsumed)}
          </div>
        </div>
        <div>
          <div className="text-[var(--color-satisfactory-text-dim)]">Capacity</div>
          <div className="font-medium">{formatMW(circuit.PowerCapacity)}</div>
        </div>
      </div>

      {/* Battery section */}
      {hasBattery && (
        <div className="mt-3 pt-3 border-t border-[var(--color-satisfactory-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-3.5 h-3.5 text-[var(--color-satisfactory-text-dim)]" />
            <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
              Battery
            </span>
            <span className="text-xs font-medium">
              {circuit.BatteryPercent.toFixed(1)}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[var(--color-satisfactory-text-dim)]">Differential</div>
              <div
                className={
                  circuit.BatteryDifferential > 0
                    ? "text-[var(--color-connected)]"
                    : circuit.BatteryDifferential < 0
                      ? "text-[var(--color-disconnected)]"
                      : "text-[var(--color-satisfactory-text-dim)]"
                }
              >
                {circuit.BatteryDifferential > 0 ? "+" : ""}
                {circuit.BatteryDifferential.toFixed(1)} MW
              </div>
            </div>
            <div>
              <div className="text-[var(--color-satisfactory-text-dim)]">Time Empty</div>
              <div>{circuit.BatteryTimeEmpty || "—"}</div>
            </div>
            <div>
              <div className="text-[var(--color-satisfactory-text-dim)]">Time Full</div>
              <div>{circuit.BatteryTimeFull || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PowerCircuitList({ search }: { search: string }) {
  const { powerCircuits } = useFactoryStore();

  const filtered = search
    ? powerCircuits.filter((c) =>
        `circuit ${c.CircuitGroupID}`.toLowerCase().includes(search)
      )
    : powerCircuits;

  if (powerCircuits.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
        No power circuit data available
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Power Circuits
        </h2>
        <div className="p-4 text-center text-sm text-[var(--color-satisfactory-text-dim)]">
          No circuits match your search
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        Power Circuits
        <span className="text-sm font-normal text-[var(--color-satisfactory-text-dim)]">
          ({filtered.length})
        </span>
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((circuit) => (
          <CircuitCard key={circuit.CircuitGroupID} circuit={circuit} />
        ))}
      </div>
    </div>
  );
}
