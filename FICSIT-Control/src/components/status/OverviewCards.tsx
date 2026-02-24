import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Factory, Zap, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import type { MachineEfficiencyPoint } from "../../stores/factory-store";
import { formatMW } from "../../utils/format";
import type { FRMMachine } from "../../types";

function getAllMachines(machines: Record<string, FRMMachine[]>): FRMMachine[] {
  return Object.values(machines).flat();
}

const SPARK_W = 200;
const SPARK_H = 64;
const SPARK_PAD = 4;

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MachineEfficiencySparkline({ points }: { points: MachineEfficiencyPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="text-[10px] text-[var(--color-satisfactory-text-dim)] px-1">
        Collecting data...
      </div>
    );
  }

  const minT = points[0].time;
  const maxT = points[points.length - 1].time;
  const rangeT = maxT - minT || 1;

  const coords = points.map((p) => ({
    x: SPARK_PAD + ((p.time - minT) / rangeT) * (SPARK_W - SPARK_PAD * 2),
    y: SPARK_PAD + (1 - p.percent / 100) * (SPARK_H - SPARK_PAD * 2),
  }));

  const pathD = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const areaD = `${pathD} L${coords[coords.length - 1].x.toFixed(1)},${SPARK_H - SPARK_PAD} L${coords[0].x.toFixed(1)},${SPARK_H - SPARK_PAD} Z`;

  const latest = points[points.length - 1];
  const lineColor =
    latest.percent >= 75
      ? "var(--color-connected)"
      : latest.percent >= 50
        ? "var(--color-warning)"
        : "var(--color-disconnected)";

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] font-medium text-[var(--color-satisfactory-text-dim)] text-center">
        Machine Efficiency
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--color-satisfactory-text-dim)]">
        <span>{formatTime(minT)}</span>
        <span className="font-medium" style={{ color: lineColor }}>
          {latest.percent.toFixed(0)}%
        </span>
        <span>{formatTime(maxT)}</span>
      </div>
      <svg width={SPARK_W} height={SPARK_H} className="block">
        {/* 50% reference line */}
        <line
          x1={SPARK_PAD} y1={SPARK_H / 2} x2={SPARK_W - SPARK_PAD} y2={SPARK_H / 2}
          stroke="var(--color-satisfactory-border)" strokeWidth={0.5} strokeDasharray="2,2"
        />
        {/* Fill area */}
        <path d={areaD} fill={lineColor} opacity={0.15} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* End dot */}
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={2.5} fill={lineColor} />
      </svg>
      <div className="text-[10px] text-[var(--color-satisfactory-text-dim)] text-center">
        {latest.running} of {latest.total} machines running
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtitle,
  alert,
  tooltipContent,
}: {
  icon: typeof Factory;
  iconColor: string;
  label: string;
  value: string;
  subtitle?: string;
  alert?: boolean;
  tooltipContent?: React.ReactNode;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseEnter() {
    if (!tooltipContent) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    }
    setShowTooltip(true);
  }

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className={`p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border ${
          alert
            ? "border-[var(--color-disconnected)]"
            : "border-[var(--color-satisfactory-border)]"
        }${tooltipContent ? " cursor-default" : ""}`}
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

      {showTooltip && tooltipContent &&
        createPortal(
          <div
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translateX(-50%)",
            }}
            className="fixed z-50 px-3 py-2 rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] shadow-lg pointer-events-none"
          >
            {tooltipContent}
          </div>,
          document.body,
        )}
    </>
  );
}

export function OverviewCards() {
  const { powerCircuits, productionStats, inventory, machines, machineEfficiencyHistory } =
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
        tooltipContent={
          machineEfficiencyHistory.length >= 2
            ? <MachineEfficiencySparkline points={machineEfficiencyHistory} />
            : undefined
        }
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
