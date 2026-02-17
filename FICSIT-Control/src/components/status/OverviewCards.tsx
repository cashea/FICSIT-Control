import { Factory, Zap, TrendingUp, Package, AlertTriangle } from "lucide-react";
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

export function OverviewCards() {
  const { powerCircuits, productionStats, inventory, machines } =
    useFactoryStore();

  const allMachines = getAllMachines(machines);
  const runningCount = allMachines.filter((m) => m.IsProducing).length;
  const pausedCount = allMachines.filter((m) => m.IsPaused).length;
  const idleCount = allMachines.length - runningCount - pausedCount;

  const totalPowerProd = powerCircuits.reduce(
    (s, c) => s + c.PowerProduction,
    0
  );
  const totalPowerCons = powerCircuits.reduce(
    (s, c) => s + c.PowerConsumed,
    0
  );
  const totalPowerCap = powerCircuits.reduce(
    (s, c) => s + c.PowerCapacity,
    0
  );
  const powerUtil =
    totalPowerCap > 0 ? (totalPowerCons / totalPowerCap) * 100 : 0;
  const anyFuse = powerCircuits.some((c) => c.FuseTriggered);

  const efficiency =
    allMachines.length > 0
      ? (runningCount / allMachines.length) * 100
      : 0;

  const uniqueItems = new Set(productionStats.map((s) => s.ClassName)).size;
  const totalContainers = inventory.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        icon={Factory}
        iconColor="text-blue-400"
        label="Machines"
        value={allMachines.length.toString()}
        subtitle={`${runningCount} running · ${idleCount} idle · ${pausedCount} paused`}
        alert={pausedCount > 0}
      />
      <StatCard
        icon={anyFuse ? AlertTriangle : Zap}
        iconColor={anyFuse ? "text-[var(--color-disconnected)]" : "text-yellow-400"}
        label="Power"
        value={formatMW(totalPowerCons)}
        subtitle={`${formatMW(totalPowerProd)} produced · ${powerUtil.toFixed(0)}% util`}
        alert={anyFuse || powerUtil > 90}
      />
      <StatCard
        icon={TrendingUp}
        iconColor="text-[var(--color-connected)]"
        label="Efficiency"
        value={`${efficiency.toFixed(0)}%`}
        subtitle={`${runningCount} of ${allMachines.length} machines active`}
      />
      <StatCard
        icon={TrendingUp}
        iconColor="text-purple-400"
        label="Items Produced"
        value={uniqueItems.toString()}
        subtitle="unique item types"
      />
      <StatCard
        icon={Package}
        iconColor="text-[var(--color-satisfactory-orange)]"
        label="Storage"
        value={totalContainers.toString()}
        subtitle="containers tracked"
      />
    </div>
  );
}
