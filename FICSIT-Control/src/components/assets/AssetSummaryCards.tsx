import { Factory, Zap, Package, AlertTriangle, Gauge } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { formatMW } from "../../utils/format";
import type { FRMMachine } from "../../types";

function getAllMachines(machines: Record<string, FRMMachine[]>): FRMMachine[] {
  return Object.values(machines).flat();
}

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtitle,
  alert,
}: {
  icon: typeof Factory;
  iconColor: string;
  label: string;
  value: string;
  subtitle?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border ${
        alert
          ? "border-[var(--color-disconnected)]"
          : "border-[var(--color-satisfactory-border)]"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && (
        <div className="text-xs text-[var(--color-satisfactory-text-dim)] mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function AssetSummaryCards() {
  const { powerCircuits, inventory, machines } = useFactoryStore();

  const allMachines = getAllMachines(machines);
  const runningCount = allMachines.filter((m) => m.IsProducing).length;
  const pausedCount = allMachines.filter((m) => m.IsPaused).length;
  const idleCount = allMachines.length - runningCount - pausedCount;

  const totalCapacity = powerCircuits.reduce(
    (s, c) => s + c.PowerCapacity,
    0
  );
  const totalConsumed = powerCircuits.reduce(
    (s, c) => s + c.PowerConsumed,
    0
  );
  const totalProduced = powerCircuits.reduce(
    (s, c) => s + c.PowerProduction,
    0
  );
  const anyFuse = powerCircuits.some((c) => c.FuseTriggered);

  const totalSlots = inventory.reduce(
    (s, c) => s + c.Inventory.length,
    0
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Factory}
        iconColor="text-blue-400"
        label="Total Machines"
        value={allMachines.length.toString()}
        subtitle={`${runningCount} running · ${idleCount} idle · ${pausedCount} paused`}
        alert={pausedCount > 0}
      />
      <StatCard
        icon={anyFuse ? AlertTriangle : Zap}
        iconColor={anyFuse ? "text-[var(--color-disconnected)]" : "text-yellow-400"}
        label="Power Circuits"
        value={powerCircuits.length.toString()}
        subtitle={`${formatMW(totalCapacity)} total capacity`}
        alert={anyFuse}
      />
      <StatCard
        icon={Package}
        iconColor="text-[var(--color-satisfactory-orange)]"
        label="Storage Containers"
        value={inventory.length.toString()}
        subtitle={`${totalSlots.toLocaleString()} total item slots`}
      />
      <StatCard
        icon={Gauge}
        iconColor="text-purple-400"
        label="Total Power Draw"
        value={formatMW(totalConsumed)}
        subtitle={`${formatMW(totalProduced)} produced · ${formatMW(totalCapacity)} capacity`}
      />
    </div>
  );
}
