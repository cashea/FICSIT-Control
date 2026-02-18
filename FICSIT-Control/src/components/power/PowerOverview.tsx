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
    <div className="flex flex-col flex-1 min-h-0 gap-6">
      <FuseAlertBanner circuits={powerCircuits} />
      <PowerSummaryCards circuits={powerCircuits} />
      <GenerationMixBar generators={generators} />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <CircuitCardGrid
          circuits={powerCircuits}
          generators={generators}
          onSelectCircuit={onSelectCircuit}
        />
      </div>
    </div>
  );
}
