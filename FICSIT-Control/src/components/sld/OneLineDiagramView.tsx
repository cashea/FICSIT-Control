import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useConnectionStore } from "../../stores/connection-store";
import { SingleLineDiagram } from "./SingleLineDiagram";

// Lazy-import CircuitDetail from the existing power tab
import { CircuitDetail } from "../power/CircuitDetail";

export default function OneLineDiagramView() {
  const { status } = useConnectionStore();
  const [focusedCircuit, setFocusedCircuit] = useState<number | null>(null);

  if (status !== "connected") {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-satisfactory-text-dim)]">
        Connect to a Satisfactory server to view the one-line diagram.
      </div>
    );
  }

  if (focusedCircuit !== null) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <button
          onClick={() => setFocusedCircuit(null)}
          className="inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] hover:bg-[var(--color-satisfactory-panel)] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to diagram
        </button>
        <CircuitDetail
          circuitId={focusedCircuit}
          onBack={() => setFocusedCircuit(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0">
      <SingleLineDiagram onCircuitSelect={setFocusedCircuit} />
    </div>
  );
}
