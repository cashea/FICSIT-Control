import { Battery, ArrowUp, ArrowDown } from "lucide-react";
import type { FRMPowerCircuit } from "../../types";
import { formatMW } from "../../utils/format";

export function BatteryDetailPanel({ circuit }: { circuit: FRMPowerCircuit }) {
  if (circuit.BatteryCapacity <= 0) {
    return (
      <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4 flex items-center gap-3">
        <Battery className="w-5 h-5 text-[var(--color-satisfactory-text-dim)] opacity-30" />
        <span className="text-sm text-[var(--color-satisfactory-text-dim)]">
          No batteries on this circuit
        </span>
      </div>
    );
  }

  const pct = circuit.BatteryPercent;
  const diff = circuit.BatteryDifferential;
  const charging = diff > 0;
  const discharging = diff < 0;

  const fillColor =
    pct > 60
      ? "var(--color-connected)"
      : pct > 20
        ? "var(--color-warning)"
        : "var(--color-disconnected)";

  return (
    <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
      <h4 className="text-xs font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
        Battery
      </h4>
      <div className="flex items-center gap-6">
        {/* Battery icon with fill */}
        <div className="relative w-12 h-24">
          {/* Battery cap */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1.5 rounded-t bg-[var(--color-satisfactory-border)]" />
          {/* Battery body */}
          <div className="absolute top-1.5 inset-x-0 bottom-0 rounded border-2 border-[var(--color-satisfactory-border)] overflow-hidden">
            {/* Fill */}
            <div
              className="absolute bottom-0 inset-x-0 transition-all duration-700"
              style={{
                height: `${pct}%`,
                backgroundColor: fillColor,
                opacity: 0.6,
              }}
            />
          </div>
          {/* Percent overlay */}
          <div className="absolute inset-0 flex items-center justify-center pt-1.5">
            <span className="text-xs font-bold text-[var(--color-satisfactory-text)]">
              {pct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          {/* Differential */}
          <div className="flex items-center gap-1.5">
            {charging && <ArrowUp className="w-4 h-4 text-[var(--color-connected)]" />}
            {discharging && <ArrowDown className="w-4 h-4 text-[var(--color-warning)]" />}
            <span
              className={
                charging
                  ? "text-[var(--color-connected)]"
                  : discharging
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-satisfactory-text-dim)]"
              }
            >
              {diff > 0 ? "+" : ""}
              {formatMW(diff)}
            </span>
          </div>

          {/* Time remaining */}
          <div className="text-xs text-[var(--color-satisfactory-text-dim)]">
            {charging && circuit.BatteryTimeFull && (
              <span>Full in: {circuit.BatteryTimeFull}</span>
            )}
            {discharging && circuit.BatteryTimeEmpty && (
              <span>Empty in: {circuit.BatteryTimeEmpty}</span>
            )}
            {!charging && !discharging && <span>Idle</span>}
          </div>

          {/* Capacity */}
          <div className="text-xs text-[var(--color-satisfactory-text-dim)]">
            Capacity: {formatMW(circuit.BatteryCapacity)}
          </div>
        </div>
      </div>
    </div>
  );
}
