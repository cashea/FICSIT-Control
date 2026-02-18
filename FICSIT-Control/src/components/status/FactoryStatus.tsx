import { useState } from "react";
import { useConnectionStore } from "../../stores/connection-store";
import { OverviewCards } from "./OverviewCards";
import { MachineBreakdown } from "./MachineBreakdown";
import { BottleneckList } from "./BottleneckList";
import { RecommendationBanner } from "./RecommendationBanner";
import { MachineDetail } from "../machines/MachineDetail";
import type { MachineKey } from "../../utils/machine-id";

export function FactoryStatus() {
  const { status } = useConnectionStore();
  const [selectedMachine, setSelectedMachine] = useState<MachineKey | null>(null);

  if (status !== "connected") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-satisfactory-text-dim)]">
        <p className="text-lg mb-2">Not connected to game</p>
        <p className="text-sm mb-4">
          Connect to FICSIT Remote Monitoring in the sidebar to view factory
          status.
        </p>
        <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)] text-sm max-w-md">
          <p className="mb-2 text-[var(--color-satisfactory-text)]">
            In Satisfactory, open chat and type:
          </p>
          <code className="block px-3 py-2 bg-[var(--color-satisfactory-dark)] rounded text-[var(--color-satisfactory-orange)] font-mono">
            /frm http start
          </code>
          <p className="mt-2 text-xs">
            This starts the FRM web server so this app can connect to your game.
          </p>
        </div>
      </div>
    );
  }

  if (selectedMachine !== null) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <MachineDetail
          machineKey={selectedMachine}
          onBack={() => setSelectedMachine(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6">
      <OverviewCards />
      <RecommendationBanner />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BottleneckList />
          <MachineBreakdown onSelectMachine={setSelectedMachine} />
        </div>
      </div>
    </div>
  );
}
