import type { FRMPowerCircuit, FRMGenerator } from "../../types";
import { PowerCircuitCard } from "./PowerCircuitCard";

export function CircuitCardGrid({
  circuits,
  generators,
  onSelectCircuit,
}: {
  circuits: FRMPowerCircuit[];
  generators: FRMGenerator[];
  onSelectCircuit: (id: number) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
        Circuits
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {circuits.map((circuit) => (
          <PowerCircuitCard
            key={circuit.CircuitGroupID}
            circuit={circuit}
            generators={generators.filter(
              (g) => g.PowerInfo.CircuitGroupID === circuit.CircuitGroupID,
            )}
            onClick={() => onSelectCircuit(circuit.CircuitGroupID)}
          />
        ))}
      </div>
    </div>
  );
}
