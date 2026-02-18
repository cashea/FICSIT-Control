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
      <div className="flex items-center justify-center h-64 text-[var(--color-satisfactory-text-dim)]">
        Connect to a Satisfactory server to view the one-line diagram.
      </div>
    );
  }

  if (focusedCircuit !== null) {
    return (
      <div>
        <button
          onClick={() => setFocusedCircuit(null)}
          className="inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] hover:bg-[var(--color-satisfactory-panel)] transition-colors"
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
    <div className="h-[calc(100vh-140px)]">
      <SingleLineDiagram onCircuitSelect={setFocusedCircuit} />
    </div>
  );
}
