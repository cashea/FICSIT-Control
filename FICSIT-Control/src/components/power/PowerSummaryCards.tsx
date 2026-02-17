import { Zap, Gauge, TrendingUp, Battery } from "lucide-react";
import type { FRMPowerCircuit } from "../../types";
import { formatMW } from "../../utils/format";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
      <div className="flex items-center gap-2 text-[var(--color-satisfactory-text-dim)] text-xs mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`text-xl font-bold ${color ?? "text-[var(--color-satisfactory-text)]"}`}>
        {value}
      </div>
      {sub && (
        <div className="text-xs text-[var(--color-satisfactory-text-dim)] mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

export function PowerSummaryCards({ circuits }: { circuits: FRMPowerCircuit[] }) {
  const totalProd = circuits.reduce((s, c) => s + c.PowerProduction, 0);
  const totalCons = circuits.reduce((s, c) => s + c.PowerConsumed, 0);
  const totalCap = circuits.reduce((s, c) => s + c.PowerCapacity, 0);
  const headroom = totalCap > 0 ? ((totalCap - totalCons) / totalCap) * 100 : 0;

  const circuitsWithBattery = circuits.filter((c) => c.BatteryCapacity > 0);
  const batteryAvg =
    circuitsWithBattery.length > 0
      ? circuitsWithBattery.reduce((s, c) => s + c.BatteryPercent, 0) /
        circuitsWithBattery.length
      : -1;

  const headroomColor =
    headroom > 30
      ? "text-[var(--color-connected)]"
      : headroom > 10
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-satisfactory-text)]";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        icon={Zap}
        label="Production"
        value={formatMW(totalProd)}
        color="text-[var(--color-connected)]"
      />
      <StatCard
        icon={Zap}
        label="Consumption"
        value={formatMW(totalCons)}
        color="text-[var(--color-warning)]"
      />
      <StatCard
        icon={Gauge}
        label="Capacity"
        value={formatMW(totalCap)}
        sub={`${circuits.length} circuit${circuits.length !== 1 ? "s" : ""}`}
      />
      <StatCard
        icon={TrendingUp}
        label="Headroom"
        value={`${headroom.toFixed(1)}%`}
        sub={formatMW(totalCap - totalCons)}
        color={headroomColor}
      />
      <StatCard
        icon={Battery}
        label="Battery Avg"
        value={batteryAvg >= 0 ? `${batteryAvg.toFixed(0)}%` : "—"}
        sub={
          circuitsWithBattery.length > 0
            ? `${circuitsWithBattery.length} circuit${circuitsWithBattery.length !== 1 ? "s" : ""} with batteries`
            : "No batteries"
        }
      />
    </div>
  );
}
