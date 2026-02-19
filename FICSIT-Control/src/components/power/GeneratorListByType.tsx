import { useState } from "react";
import { ChevronDown, ChevronRight, Power, Pencil, Check, X } from "lucide-react";
import type { FRMGenerator } from "../../types";
import { ControlActionButton } from "../control/ControlActionButton";
import {
  groupGeneratorsByCategory,
  GENERATOR_COLORS,
  type GeneratorGroup,
} from "../../utils/power";
import { formatMW } from "../../utils/format";
import { useGeneratorNamesStore } from "../../stores/generator-names-store";
import { getGeneratorDisplayName } from "../../utils/generator-names";

function GeneratorGroupSection({ group }: { group: GeneratorGroup }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--color-satisfactory-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-satisfactory-dark)]/50 transition-colors cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
        )}
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: GENERATOR_COLORS[group.category] }}
        />
        <span className="text-sm font-medium text-[var(--color-satisfactory-text)]">
          {group.category}
        </span>
        <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
          x{group.count}
        </span>
        <span className="ml-auto text-sm font-medium text-[var(--color-connected)]">
          {formatMW(group.totalMW)}
        </span>
      </button>
      <div className="flex items-center gap-2 px-4 pb-1" onClick={(e) => e.stopPropagation()}>
        <ControlActionButton
          commandType="TOGGLE_GENERATOR_GROUP"
          payload={{ groupId: group.category, enabled: false }}
          label="Disable Group"
          icon={<Power className="w-3 h-3" />}
          feature="toggleGeneratorGroup"
        />
        <ControlActionButton
          commandType="TOGGLE_GENERATOR_GROUP"
          payload={{ groupId: group.category, enabled: true }}
          label="Enable Group"
          icon={<Power className="w-3 h-3" />}
          feature="toggleGeneratorGroup"
        />
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-satisfactory-border)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-satisfactory-text-dim)]">
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-right px-4 py-2 font-medium">Output</th>
                <th className="text-right px-4 py-2 font-medium">Max</th>
                <th className="text-right px-4 py-2 font-medium">Clock</th>
                <th className="text-right px-4 py-2 font-medium">Fuel</th>
              </tr>
            </thead>
            <tbody>
              {group.generators.map((gen) => (
                <GeneratorRow key={gen.ID} gen={gen} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GeneratorRow({ gen }: { gen: FRMGenerator }) {
  const clockPct = gen.CurrentPotential.toFixed(0);
  const isOverclocked = gen.CurrentPotential > 100;
  const hasNuclearWarning = gen.NuclearWarning && gen.NuclearWarning !== "";
  const isGeo = gen.GeoMaxPower > 0;

  const { getCustomSuffix, setCustomSuffix } = useGeneratorNamesStore();
  const customSuffix = getCustomSuffix(gen.ID);
  const displayName = getGeneratorDisplayName(gen, customSuffix);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(customSuffix);

  const handleSave = () => {
    setCustomSuffix(gen.ID, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(customSuffix);
    setIsEditing(false);
  };

  return (
    <tr className="group border-t border-[var(--color-satisfactory-border)]/50 hover:bg-[var(--color-satisfactory-dark)]/30">
      <td className="px-4 py-2 text-[var(--color-satisfactory-text)]">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                placeholder="Custom suffix"
                className="px-2 py-0.5 text-xs bg-[var(--color-satisfactory-dark)]
                  border border-[var(--color-satisfactory-border)] rounded
                  focus:outline-none focus:border-[var(--color-satisfactory-orange)]
                  flex-1 max-w-[120px]"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded"
                title="Save"
              >
                <Check className="w-3 h-3 text-[var(--color-connected)]" />
              </button>
              <button
                onClick={handleCancel}
                className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded"
                title="Cancel"
              >
                <X className="w-3 h-3 text-[var(--color-satisfactory-text-dim)]" />
              </button>
            </div>
          ) : (
            <>
              <span className="truncate max-w-[180px]" title={displayName}>
                {displayName}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded
                  opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit custom suffix"
              >
                <Pencil className="w-3 h-3 text-[var(--color-satisfactory-text-dim)]" />
              </button>
            </>
          )}
          {hasNuclearWarning && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
              {gen.NuclearWarning}
            </span>
          )}
          {!gen.CanStart && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)]">
              Stopped
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-2 text-right text-[var(--color-connected)]">
        {formatMW(gen.RegulatedDemandProd)}
      </td>
      <td className="px-4 py-2 text-right text-[var(--color-satisfactory-text-dim)]">
        {isGeo
          ? `${formatMW(gen.GeoMinPower)}-${formatMW(gen.GeoMaxPower)}`
          : formatMW(gen.PowerProductionPotential)}
      </td>
      <td className="px-4 py-2 text-right">
        <span
          className={
            isOverclocked
              ? "text-[var(--color-satisfactory-orange)]"
              : "text-[var(--color-satisfactory-text-dim)]"
          }
        >
          {clockPct}%
        </span>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-16 h-1.5 rounded bg-[var(--color-satisfactory-dark)] overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${Math.min(gen.FuelAmount * 100, 100)}%`,
                backgroundColor:
                  gen.FuelAmount > 0.3
                    ? "var(--color-connected)"
                    : gen.FuelAmount > 0.1
                      ? "var(--color-warning)"
                      : "var(--color-disconnected)",
              }}
            />
          </div>
          <span className="text-[var(--color-satisfactory-text-dim)] w-8 text-right">
            {(gen.FuelAmount * 100).toFixed(0)}%
          </span>
        </div>
      </td>
    </tr>
  );
}

export function GeneratorListByType({
  generators,
}: {
  generators: FRMGenerator[];
}) {
  const groups = groupGeneratorsByCategory(generators);

  if (generators.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
        <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-2">
          Generators
        </h4>
        <p className="text-xs text-[var(--color-satisfactory-text-dim)]">
          No generators on this circuit
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
        Generators ({generators.length})
      </h4>
      <div className="space-y-2">
        {groups.map((group) => (
          <GeneratorGroupSection key={group.category} group={group} />
        ))}
      </div>
    </div>
  );
}
