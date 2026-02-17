import { ArrowUp, ArrowDown, Battery } from "lucide-react";
import type { FRMPowerCircuit, FRMGenerator } from "../../types";
import { formatMW } from "../../utils/format";
import { generatorSummaryText } from "../../utils/power";
import { MiniGauge } from "./MiniGauge";

export function PowerCircuitCard({
  circuit,
  generators,
  onClick,
}: {
  circuit: FRMPowerCircuit;
  generators: FRMGenerator[];
  onClick: () => void;
}) {
  const hasBattery = circuit.BatteryCapacity > 0;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4 hover:border-[var(--color-satisfactory-orange)]/50 transition-colors cursor-pointer w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--color-satisfactory-text)]">
          Circuit #{circuit.CircuitGroupID}
        </span>
        {circuit.FuseTriggered && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-disconnected)]/20 text-[var(--color-disconnected)]">
            TRIPPED
          </span>
        )}
      </div>

      {/* Utilization gauge */}
      <MiniGauge
        consumed={circuit.PowerConsumed}
        production={circuit.PowerProduction}
        capacity={circuit.PowerCapacity}
        fuseTripped={circuit.FuseTriggered}
      />
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
