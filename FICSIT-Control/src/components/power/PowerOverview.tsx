import { useFactoryStore } from "../../stores/factory-store";
import { FuseAlertBanner } from "./FuseAlertBanner";
import { PowerSummaryCards } from "./PowerSummaryCards";
import { GenerationMixBar } from "./GenerationMixBar";
import { CircuitCardGrid } from "./CircuitCardGrid";

export function PowerOverview({
  onSelectCircuit,
}: {
  onSelectCircuit: (id: number) => void;
}) {
  const { powerCircuits, generators } = useFactoryStore();

  return (
    <div className="space-y-6">
      <FuseAlertBanner circuits={powerCircuits} />
      <PowerSummaryCards circuits={powerCircuits} />
      <GenerationMixBar generators={generators} />
      <CircuitCardGrid
        circuits={powerCircuits}
        generators={generators}
        onSelectCircuit={onSelectCircuit}
      />
    </div>
  );
}
