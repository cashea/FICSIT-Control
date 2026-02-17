import { Zap, Gauge, TrendingUp } from "lucide-react";
import type { FRMPowerCircuit } from "../../types";
import { formatMW } from "../../utils/format";

export function CircuitMetricsCards({ circuit }: { circuit: FRMPowerCircuit }) {
  const headroomMW = circuit.PowerCapacity - circuit.PowerConsumed;
  const headroomPct =
    circuit.PowerCapacity > 0
      ? (headroomMW / circuit.PowerCapacity) * 100
      : 0;

  const headroomColor =
    headroomPct > 30
      ? "text-[var(--color-connected)]"
      : headroomPct > 10
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-satisfactory-text)]";

  const cards = [
    {
      icon: Zap,
      label: "Production",
      value: formatMW(circuit.PowerProduction),
      color: "text-[var(--color-connected)]",
    },
    {
      icon: Zap,
      label: "Consumption",
      value: formatMW(circuit.PowerConsumed),
      color: "text-[var(--color-warning)]",
    },
    {
      icon: Gauge,
      label: "Capacity",
      value: formatMW(circuit.PowerCapacity),
      color: "text-[var(--color-satisfactory-text)]",
    },
    {
      icon: TrendingUp,
      label: "Headroom",
      value: `${headroomPct.toFixed(1)}%`,
      sub: formatMW(headroomMW),
      color: headroomColor,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4"
        >
          <div className="flex items-center gap-2 text-[var(--color-satisfactory-text-dim)] text-xs mb-1">
            <c.icon className="w-3.5 h-3.5" />
            {c.label}
          </div>
          <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
          {"sub" in c && c.sub && (
            <div className="text-xs text-[var(--color-satisfactory-text-dim)] mt-0.5">
              {c.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
