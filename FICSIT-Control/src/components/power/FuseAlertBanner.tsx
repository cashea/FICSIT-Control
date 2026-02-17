import { AlertTriangle } from "lucide-react";
import type { FRMPowerCircuit } from "../../types";

export function FuseAlertBanner({ circuits }: { circuits: FRMPowerCircuit[] }) {
  const tripped = circuits.filter((c) => c.FuseTriggered);
  if (tripped.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-disconnected)] bg-[var(--color-disconnected)]/10">
      <AlertTriangle className="w-5 h-5 text-[var(--color-disconnected)] animate-pulse shrink-0" />
      <div className="text-sm">
        <span className="font-semibold text-[var(--color-disconnected)]">
          FUSE TRIPPED
        </span>
        <span className="text-[var(--color-satisfactory-text-dim)] ml-2">
          Circuit{tripped.length > 1 ? "s" : ""}{" "}
          {tripped.map((c) => `#${c.CircuitGroupID}`).join(", ")}
        </span>
      </div>
    </div>
  );
}
