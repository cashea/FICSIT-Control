import { useState } from "react";
import { ChevronDown, ChevronRight, Factory, ArrowUpDown, Power } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { useControlStore } from "../../stores/control-store";
import { ControlActionButton } from "../control/ControlActionButton";
import { LocationBadge } from "./LocationBadge";
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

type SortKey = "recipe" | "power" | "status";

function sortMachines(machines: FRMMachine[], key: SortKey, asc: boolean): FRMMachine[] {
  const sorted = [...machines].sort((a, b) => {
    switch (key) {
      case "recipe":
        return (a.Recipe || "").localeCompare(b.Recipe || "");
      case "power":
        return (a.PowerInfo?.PowerConsumed ?? 0) - (b.PowerInfo?.PowerConsumed ?? 0);
      case "status": {
        const score = (m: FRMMachine) => m.IsProducing ? 0 : m.IsPaused ? 2 : 1;
        return score(a) - score(b);
      }
    }
  });
  return asc ? sorted : sorted.reverse();
}

function MachineTypeGroup({
  type,
  machines,
  search,
  onSelectMachine,
}: {
  type: string;
  machines: FRMMachine[];
  search: string;
  onSelectMachine?: (key: MachineKey) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortAsc, setSortAsc] = useState(true);
  const { connectionStatus, isFeatureAvailable } = useControlStore();
  const hasControl = connectionStatus === "connected" && isFeatureAvailable("toggleBuilding");

  const label = MACHINE_LABELS[type] || type;

  const filtered = search
    ? machines.filter(
        (m) =>
          (m.Recipe || "").toLowerCase().includes(search) ||
          label.toLowerCase().includes(search)
      )
    : machines;

  if (filtered.length === 0) return null;

  const running = filtered.filter((m) => m.IsProducing).length;
  const paused = filtered.filter((m) => m.IsPaused).length;
  const idle = filtered.length - running - paused;
  const sorted = sortMachines(filtered, sortKey, sortAsc);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

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
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
            ({filtered.length})
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--color-connected)]">{running} running</span>
          {idle > 0 && (
            <span className="text-[var(--color-warning)]">{idle} idle</span>
          )}
          {paused > 0 && (
            <span className="text-[var(--color-disconnected)]">{paused} paused</span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-satisfactory-border)]">
          {/* Sort header */}
          <div className="flex items-center gap-4 px-4 py-1.5 text-xs text-[var(--color-satisfactory-text-dim)] border-b border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-dark)]">
            <span className="w-4" />
            <button
              onClick={() => toggleSort("recipe")}
              className="flex items-center gap-1 hover:text-[var(--color-satisfactory-text)] flex-1"
            >
              Recipe
              {sortKey === "recipe" && <ArrowUpDown className="w-3 h-3" />}
            </button>
            <button
              onClick={() => toggleSort("power")}
              className="flex items-center gap-1 hover:text-[var(--color-satisfactory-text)] w-20 justify-end"
            >
              Power
              {sortKey === "power" && <ArrowUpDown className="w-3 h-3" />}
            </button>
            <span className="w-40 text-right">Output</span>
            <button
              onClick={() => toggleSort("status")}
              className="flex items-center gap-1 hover:text-[var(--color-satisfactory-text)] w-16 justify-end"
            >
              Status
              {sortKey === "status" && <ArrowUpDown className="w-3 h-3" />}
            </button>
            <span className="w-36 text-right">Location</span>
            {hasControl && <span className="w-16 text-right">Control</span>}
          </div>

          {sorted.map((machine, i) => {
            const primaryOutput = machine.Production[0];
            return (
              <div
                key={i}
                onClick={() => onSelectMachine?.(machineKey(machine))}
                className={`flex items-center gap-4 px-4 py-2 text-xs border-b border-[var(--color-satisfactory-border)] last:border-b-0${onSelectMachine ? " cursor-pointer hover:bg-[var(--color-satisfactory-border)]/20" : ""}`}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    machine.IsProducing
                      ? "bg-[var(--color-connected)]"
                      : machine.IsPaused
                        ? "bg-[var(--color-disconnected)]"
                        : "bg-[var(--color-warning)]"
                  }`}
                />
                <span className="flex-1 text-[var(--color-satisfactory-text)] truncate">
                  {machine.Recipe || "No recipe"}
                </span>
                <span className="w-20 text-right text-[var(--color-satisfactory-text-dim)]">
                  {machine.PowerInfo?.PowerConsumed?.toFixed(1) ?? "?"} MW
                </span>
                <span className="w-40 text-right text-[var(--color-satisfactory-text-dim)] truncate">
                  {primaryOutput
                    ? `${primaryOutput.Name} (${primaryOutput.CurrentProd.toFixed(1)}/min)`
                    : "—"}
                </span>
                <span
                  className={`w-16 text-right ${
                    machine.IsProducing
                      ? "text-[var(--color-connected)]"
                      : machine.IsPaused
                        ? "text-[var(--color-disconnected)]"
                        : "text-[var(--color-warning)]"
                  }`}
                >
                  {machine.IsProducing ? "Running" : machine.IsPaused ? "Paused" : "Idle"}
                </span>
                <span className="w-36 text-right">
                  <LocationBadge location={machine.location} />
                </span>
                {hasControl && (
                  <span className="w-16 flex justify-end">
                    <ControlActionButton
                      commandType="TOGGLE_BUILDING"
                      payload={{ buildingId: machine.ClassName, enabled: machine.IsPaused }}
                      label={machine.IsPaused ? "Enable" : "Disable"}
                      icon={<Power className="w-3 h-3" />}
                      feature="toggleBuilding"
                    />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MachineAssetList({ search, onSelectMachine }: {
  search: string;
  onSelectMachine?: (key: MachineKey) => void;
}) {
  const { machines } = useFactoryStore();
  const types = Object.entries(machines).filter(([, list]) => list.length > 0);

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
        Production Machines
      </h2>
      <div className="space-y-2">
        {types
          .sort(([, a], [, b]) => b.length - a.length)
          .map(([type, list]) => (
            <MachineTypeGroup
              key={type}
              type={type}
              machines={list}
              search={search}
              onSelectMachine={onSelectMachine}
            />
          ))}
      </div>
    </div>
  );
}
