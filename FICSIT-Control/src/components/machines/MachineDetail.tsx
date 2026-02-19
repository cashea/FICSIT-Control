import { ChevronLeft } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { findMachineByKey, type MachineKey } from "../../utils/machine-id";
import { ProductionHistoryChart } from "./ProductionHistoryChart";
import { MachineControls } from "./MachineControls";
import type { FRMMachine } from "../../types";

interface MachineDetailProps {
  machineKey: MachineKey;
  onBack: () => void;
}

export function MachineDetail({ machineKey: key, onBack }: MachineDetailProps) {
  const { machines, productionHistory } = useFactoryStore();
  const result = findMachineByKey(machines, key);

  if (!result) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to machines
        </button>
        <p className="text-[var(--color-satisfactory-text-dim)]">
          Machine not found. It may have been deconstructed.
        </p>
      </div>
    );
  }

  const { machine, endpointType } = result;
  const history = productionHistory[key] ?? [];
  const primaryOutput = machine.Production[0];
  const efficiency = primaryOutput?.ProdPercent ?? 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-lg font-semibold text-[var(--color-satisfactory-text)]">
          {machine.Name}
        </h2>
        <StatusBadge machine={machine} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Power"
            value={`${machine.PowerInfo?.PowerConsumed?.toFixed(1) ?? "?"} MW`}
            sub={`Max ${machine.PowerInfo?.MaxPowerConsumed?.toFixed(1) ?? "?"} MW`}
          />
          <MetricCard
            label="Efficiency"
            value={`${efficiency.toFixed(0)}%`}
            color={efficiency >= 90 ? "var(--color-connected)" : efficiency >= 50 ? "var(--color-warning)" : "var(--color-disconnected)"}
          />
          <MetricCard label="Recipe" value={machine.Recipe || "None"} />
          <MetricCard label="Circuit" value={`#${machine.CircuitGroupID}`} />
          <MetricCard
            label="Location"
            value={`${Math.round(machine.location.x)}, ${Math.round(machine.location.y)}, ${Math.round(machine.location.z)}`}
          />
        </div>

        {/* Production I/O */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IOSection title="Inputs" items={machine.Ingredients} mode="input" />
          <IOSection title="Outputs" items={machine.Production} mode="output" />
        </div>

        {/* Production History Chart */}
        <ProductionHistoryChart history={history} />

        {/* Controls */}
        <MachineControls machineKey={key} machine={machine} endpointType={endpointType} />
      </div>
    </div>
  );
}

function StatusBadge({ machine }: { machine: FRMMachine }) {
  const status = machine.IsProducing ? "Running" : machine.IsPaused ? "Paused" : "Idle";
  const color = machine.IsProducing
    ? "var(--color-connected)"
    : machine.IsPaused
      ? "var(--color-disconnected)"
      : "var(--color-warning)";

  return (
    <span
      className="text-xs font-bold px-2 py-1 rounded"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
    >
      {status}
    </span>
  );
}

function MetricCard({ label, value, sub, color }: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
      <div className="text-xs text-[var(--color-satisfactory-text-dim)]">{label}</div>
      <div
        className="text-lg font-semibold mt-1 truncate"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs text-[var(--color-satisfactory-text-dim)] mt-1">{sub}</div>
      )}
    </div>
  );
}

type InputItem = FRMMachine["Ingredients"][number];
type OutputItem = FRMMachine["Production"][number];

function IOSection({ title, items, mode }: {
  title: string;
  items: InputItem[] | OutputItem[];
  mode: "input" | "output";
}) {
  return (
    <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
      <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--color-satisfactory-text-dim)]">None</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const percent = mode === "output"
              ? (item as OutputItem).ProdPercent
              : (item as InputItem).ConsPercent;
            const current = mode === "output"
              ? (item as OutputItem).CurrentProd
              : (item as InputItem).CurrentConsumed;
            const max = mode === "output"
              ? (item as OutputItem).MaxProd
              : (item as InputItem).MaxConsumed;

            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--color-satisfactory-text)]">{item.Name}</span>
                  <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
                    {current.toFixed(1)} / {max.toFixed(1)} /min
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--color-satisfactory-dark)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(percent, 100)}%`,
                      backgroundColor: mode === "output" ? "var(--color-connected)" : "var(--color-satisfactory-orange)",
                    }}
                  />
                </div>
                <div className="text-right text-[10px] text-[var(--color-satisfactory-text-dim)] mt-0.5">
                  {percent.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
