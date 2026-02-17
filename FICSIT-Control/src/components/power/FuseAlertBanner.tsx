import { AlertTriangle, Zap } from "lucide-react";
import type { FRMPowerCircuit } from "../../types";
import { useControlStore } from "../../stores/control-store";

export function FuseAlertBanner({ circuits }: { circuits: FRMPowerCircuit[] }) {
  const tripped = circuits.filter((c) => c.FuseTriggered);
  const { connectionStatus, isFeatureAvailable, submitCommand } = useControlStore();

  if (tripped.length === 0) return null;

  const canResetFuse =
    connectionStatus === "connected" && isFeatureAvailable("resetFuse");

  const handleReset = (circuitId: number) => {
    submitCommand("RESET_FUSE", { circuitId });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-disconnected)] bg-[var(--color-disconnected)]/10">
      <AlertTriangle className="w-5 h-5 text-[var(--color-disconnected)] animate-pulse shrink-0" />
      <div className="text-sm flex-1">
        <span className="font-semibold text-[var(--color-disconnected)]">
          FUSE TRIPPED
        </span>
        <span className="text-[var(--color-satisfactory-text-dim)] ml-2">
          Circuit{tripped.length > 1 ? "s" : ""}{" "}
          {tripped.map((c, i) => (
            <span key={c.CircuitGroupID}>
              {i > 0 && ", "}
              #{c.CircuitGroupID}
              {canResetFuse && (
                <button
                  onClick={() => handleReset(c.CircuitGroupID)}
                  className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] hover:bg-[var(--color-satisfactory-orange)]/30 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  Reset
                </button>
              )}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
