import { ChevronLeft } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { getConsumersForCircuit } from "../../utils/power";
import { SemicircleGauge } from "./SemicircleGauge";
import { BatteryDetailPanel } from "./BatteryDetailPanel";
import { CircuitMetricsCards } from "./CircuitMetricsCards";
import { PowerSankeyDiagram } from "./PowerSankeyDiagram";
import { GeneratorListByType } from "./GeneratorListByType";
import { ConsumerBreakdown } from "./ConsumerBreakdown";

export function CircuitDetail({
  circuitId,
  onBack,
}: {
  circuitId: number;
  onBack: () => void;
}) {
  const { powerCircuits, generators, machines } = useFactoryStore();

  const circuit = powerCircuits.find((c) => c.CircuitGroupID === circuitId);
  const circuitGenerators = generators.filter((g) => g.CircuitID === circuitId);
  const consumers = getConsumersForCircuit(machines, circuitId);

  if (!circuit) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Overview
        </button>
        <p className="text-[var(--color-satisfactory-text-dim)]">
          Circuit #{circuitId} not found. It may have been disconnected.
        </p>
      </div>
    );
  }

  const utilization =
    circuit.PowerCapacity > 0
      ? circuit.PowerConsumed / circuit.PowerCapacity
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-lg font-semibold text-[var(--color-satisfactory-text)]">
          Circuit #{circuitId}
        </h2>
        {circuit.FuseTriggered && (
          <span className="text-xs font-bold px-2 py-1 rounded bg-[var(--color-disconnected)]/20 text-[var(--color-disconnected)]">
            FUSE TRIPPED
          </span>
        )}
      </div>

      {/* Gauge + Battery + Metrics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex justify-center">
          <SemicircleGauge
            value={utilization}
            max={1}
            fuseTripped={circuit.FuseTriggered}
          />
        </div>
        <BatteryDetailPanel circuit={circuit} />
        <CircuitMetricsCards circuit={circuit} />
      </div>

      {/* Sankey diagram */}
      <PowerSankeyDiagram
        generators={circuitGenerators}
        consumers={consumers}
      />

      {/* Generators + Consumers side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GeneratorListByType generators={circuitGenerators} />
        <ConsumerBreakdown consumers={consumers} />
      </div>
    </div>
  );
}
