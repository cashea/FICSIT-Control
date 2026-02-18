import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Factory } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { useUIStore } from "../../stores/ui-store";
import { machineKey, type MachineKey } from "../../utils/machine-id";
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
  onSelectMachine,
  highlighted,
}: {
  type: string;
  machines: FRMMachine[];
  onSelectMachine?: (key: MachineKey) => void;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const running = machines.filter((m) => m.IsProducing).length;
  const paused = machines.filter((m) => m.IsPaused).length;
  const idle = machines.length - running - paused;

  useEffect(() => {
    if (highlighted) {
      setExpanded(true);
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlighted]);

  return (
    <div
      ref={rowRef}
      className={`border rounded-lg overflow-hidden transition-colors ${highlighted ? "border-[var(--color-satisfactory-orange)] ring-1 ring-[var(--color-satisfactory-orange)]/30" : "border-[var(--color-satisfactory-border)]"}`}
    >
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
              onClick={() => onSelectMachine?.(machineKey(machine))}
              className={`flex items-center justify-between px-4 py-2 text-xs border-b border-[var(--color-satisfactory-border)] last:border-b-0${onSelectMachine ? " cursor-pointer hover:bg-[var(--color-satisfactory-border)]/20" : ""}`}
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

export function MachineBreakdown({ onSelectMachine }: {
  onSelectMachine?: (key: MachineKey) => void;
} = {}) {
  const { machines } = useFactoryStore();
  const { highlightedMachineType, setHighlightedMachineType } = useUIStore();
  const types = Object.entries(machines).filter(
    ([, list]) => list.length > 0
  );

  // Clear highlight after a short delay so the ring fades
  useEffect(() => {
    if (!highlightedMachineType) return;
    const timer = setTimeout(() => setHighlightedMachineType(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedMachineType, setHighlightedMachineType]);

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
            <MachineTypeRow key={type} type={type} machines={list} onSelectMachine={onSelectMachine} highlighted={highlightedMachineType === type} />
          ))}
      </div>
    </div>
  );
}
