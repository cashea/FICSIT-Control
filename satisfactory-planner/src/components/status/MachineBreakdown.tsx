import { useState } from "react";
import { ChevronDown, ChevronRight, Factory } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import type { FRMMachine } from "../../types";

const MACHINE_LABELS: Record<string, string> = {
  getAssembler: "Assemblers",
  getSmelter: "Smelters",
  getConstructor: "Constructors",
  getRefinery: "Refineries",
  getManufacturer: "Manufacturers",
  getFoundry: "Foundries",
  getBlender: "Blenders",
  getPackager: "Packagers",
  getParticleAccelerator: "Particle Accelerators",
};

function MachineTypeRow({
  type,
  machines,
}: {
  type: string;
  machines: FRMMachine[];
}) {
  const [expanded, setExpanded] = useState(false);
  const running = machines.filter((m) => m.IsProducing).length;
  const paused = machines.filter((m) => m.IsPaused).length;
  const idle = machines.length - running - paused;

  return (
    <div className="border border-[var(--color-satisfactory-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-[var(--color-satisfactory-panel)] hover:bg-[var(--color-satisfactory-border)]/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
          )}
          <span className="font-medium text-sm">
            {MACHINE_LABELS[type] || type}
          </span>
          <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
            ({machines.length})
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--color-connected)]">
            {running} running
          </span>
          {idle > 0 && (
            <span className="text-[var(--color-warning)]">{idle} idle</span>
          )}
          {paused > 0 && (
            <span className="text-[var(--color-disconnected)]">
              {paused} paused
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-satisfactory-border)]">
          {machines.map((machine, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 text-xs border-b border-[var(--color-satisfactory-border)] last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    machine.IsProducing
                      ? "bg-[var(--color-connected)]"
                      : machine.IsPaused
                        ? "bg-[var(--color-disconnected)]"
                        : "bg-[var(--color-warning)]"
                  }`}
                />
                <span className="text-[var(--color-satisfactory-text)]">
                  {machine.Recipe || "No recipe"}
                </span>
              </div>
              <span className="text-[var(--color-satisfactory-text-dim)]">
                {machine.PowerInfo?.PowerConsumed?.toFixed(1) ?? "?"} MW
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MachineBreakdown() {
  const { machines } = useFactoryStore();
  const types = Object.entries(machines).filter(
    ([, list]) => list.length > 0
  );

  if (types.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
        No machine data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Factory className="w-5 h-5 text-blue-400" />
        Machines by Type
      </h2>
      <div className="space-y-2">
        {types
          .sort(([, a], [, b]) => b.length - a.length)
          .map(([type, list]) => (
            <MachineTypeRow key={type} type={type} machines={list} />
          ))}
      </div>
    </div>
  );
}
