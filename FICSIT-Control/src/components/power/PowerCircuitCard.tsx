import { ArrowUp, ArrowDown, Battery } from "lucide-react";
import type { FRMPowerCircuit, FRMGenerator } from "../../types";
import { formatMW } from "../../utils/format";
import { generatorSummaryText } from "../../utils/power";

function utilizationColor(pct: number, fuse: boolean): string {
  if (fuse) return "text-[var(--color-disconnected)]";
  if (pct > 90) return "text-[var(--color-warning)]";
  if (pct > 70) return "text-[var(--color-warning)]";
  return "text-[var(--color-connected)]";
}

function barColor(pct: number, fuse: boolean): string {
  if (fuse) return "var(--color-disconnected)";
  if (pct > 90) return "var(--color-warning)";
  if (pct > 70) return "var(--color-warning)";
  return "var(--color-connected)";
}

export function PowerCircuitCard({
  circuit,
  generators,
  onClick,
}: {
  circuit: FRMPowerCircuit;
  generators: FRMGenerator[];
  onClick: () => void;
}) {
  const utilization =
    circuit.PowerCapacity > 0
      ? (circuit.PowerConsumed / circuit.PowerCapacity) * 100
      : 0;
  const prodPct =
    circuit.PowerCapacity > 0
      ? Math.min((circuit.PowerProduction / circuit.PowerCapacity) * 100, 100)
      : 0;
  const consPct =
    circuit.PowerCapacity > 0
      ? Math.min((circuit.PowerConsumed / circuit.PowerCapacity) * 100, 100)
      : 0;
  const hasBattery = circuit.BatteryCapacity > 0;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4 hover:border-[var(--color-satisfactory-orange)]/50 transition-colors cursor-pointer w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--color-satisfactory-text)]">
          Circuit #{circuit.CircuitGroupID}
        </span>
        <div className="flex items-center gap-2">
          {circuit.FuseTriggered && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-disconnected)]/20 text-[var(--color-disconnected)]">
              TRIPPED
            </span>
          )}
          <span className={`text-xs font-medium ${utilizationColor(utilization, circuit.FuseTriggered)}`}>
            {utilization.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="relative h-3 rounded bg-[var(--color-satisfactory-dark)] mb-1">
        {/* Production fill */}
        <div
          className="absolute inset-y-0 left-0 rounded transition-all duration-500"
          style={{
            width: `${prodPct}%`,
            backgroundColor: "var(--color-connected)",
            opacity: 0.3,
          }}
        />
        {/* Consumption marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 transition-all duration-500"
          style={{
            left: `${consPct}%`,
            backgroundColor: barColor(utilization, circuit.FuseTriggered),
          }}
        />
        {/* Consumption fill */}
        <div
          className="absolute inset-y-0 left-0 rounded transition-all duration-500"
          style={{
            width: `${consPct}%`,
            backgroundColor: barColor(utilization, circuit.FuseTriggered),
            opacity: 0.5,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--color-satisfactory-text-dim)] mb-3">
        <span>{formatMW(circuit.PowerConsumed)} / {formatMW(circuit.PowerCapacity)}</span>
        <span>Prod: {formatMW(circuit.PowerProduction)}</span>
      </div>

      {/* Battery row */}
      {hasBattery && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-satisfactory-text-dim)] mb-2">
          <Battery className="w-3.5 h-3.5" />
          <span>{circuit.BatteryPercent.toFixed(0)}%</span>
          {circuit.BatteryDifferential > 0 ? (
            <ArrowUp className="w-3 h-3 text-[var(--color-connected)]" />
          ) : circuit.BatteryDifferential < 0 ? (
            <ArrowDown className="w-3 h-3 text-[var(--color-warning)]" />
          ) : null}
        </div>
      )}

      {/* Generator summary */}
      <div className="text-[10px] text-[var(--color-satisfactory-text-dim)] truncate">
        {generatorSummaryText(generators)}
      </div>
    </button>
  );
}
