import { useState } from "react";
import { Zap } from "lucide-react";
import { useConnectionStore } from "../../stores/connection-store";
import { PowerOverview } from "./PowerOverview";
import { CircuitDetail } from "./CircuitDetail";

export function PowerGridView() {
  const { status } = useConnectionStore();
  const [selectedCircuit, setSelectedCircuit] = useState<number | null>(null);

  if (status !== "connected") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-satisfactory-text-dim)]">
        <Zap className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg mb-2">Not connected to game</p>
        <p className="text-sm">
          Connect to FICSIT Remote Monitoring to view power grid data.
        </p>
      </div>
    );
  }

  if (selectedCircuit !== null) {
    return (
      <CircuitDetail
        circuitId={selectedCircuit}
        onBack={() => setSelectedCircuit(null)}
      />
    );
  }

  return <PowerOverview onSelectCircuit={setSelectedCircuit} />;
}
