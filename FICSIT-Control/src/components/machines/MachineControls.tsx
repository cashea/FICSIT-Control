import { useState } from "react";
import { Power, Loader2, Check, X } from "lucide-react";
import { useControlStore } from "../../stores/control-store";
import { ControlActionButton } from "../control/ControlActionButton";
import { RECIPES_LIST } from "../../data/recipes";
import { ENDPOINT_TO_BUILDING_ID, type MachineKey } from "../../utils/machine-id";
import type { FRMMachine } from "../../types";

interface MachineControlsProps {
  machineKey: MachineKey;
  machine: FRMMachine;
  endpointType: string;
}

export function MachineControls({ machineKey: key, machine, endpointType }: MachineControlsProps) {
  const { connectionStatus } = useControlStore();

  if (connectionStatus !== "connected") return null;

  return (
    <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)] space-y-4">
      <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)]">Controls</h4>
      <div className="flex flex-wrap items-start gap-6">
        <div className="space-y-1">
          <label className="text-xs text-[var(--color-satisfactory-text-dim)]">Power</label>
          <div>
            <ControlActionButton
              commandType="TOGGLE_BUILDING"
              payload={{ buildingId: machine.ClassName, enabled: machine.IsPaused }}
              label={machine.IsPaused ? "Enable" : "Disable"}
              icon={<Power className="w-3 h-3" />}
              feature="toggleBuilding"
              className="px-3 py-1 text-xs"
            />
          </div>
        </div>
        <OverclockSlider machineKey={key} />
        <RecipeSelector machineKey={key} machine={machine} endpointType={endpointType} />
      </div>
    </div>
  );
}

function OverclockSlider({ machineKey: key }: { machineKey: MachineKey }) {
  const { submitCommand, isFeatureAvailable, connectionStatus } = useControlStore();
  const [value, setValue] = useState(100);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  if (connectionStatus !== "connected" || !isFeatureAvailable("setOverclock")) return null;

  const handleApply = async () => {
    setState("submitting");
    const commandId = await submitCommand("SET_OVERCLOCK", {
      machineId: key,
      clockPercent: value,
    });
    setState(commandId ? "success" : "error");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-[var(--color-satisfactory-text-dim)]">
        Overclock: {value}%
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={250}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-40 accent-[var(--color-satisfactory-orange)]"
        />
        <button
          onClick={handleApply}
          disabled={state === "submitting"}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded transition-colors bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] hover:bg-[var(--color-satisfactory-orange)]/30 disabled:opacity-50"
        >
          {state === "submitting" && <Loader2 className="w-3 h-3 animate-spin" />}
          {state === "success" && <Check className="w-3 h-3 text-[var(--color-connected)]" />}
          {state === "error" && <X className="w-3 h-3 text-[var(--color-disconnected)]" />}
          {state === "idle" ? "Apply" : state === "submitting" ? "..." : state === "success" ? "Done" : "Failed"}
        </button>
      </div>
      <p className="text-[10px] text-[var(--color-satisfactory-text-dim)]">
        Current overclock not available from FRM
      </p>
    </div>
  );
}

function RecipeSelector({ machineKey: key, machine, endpointType }: {
  machineKey: MachineKey;
  machine: FRMMachine;
  endpointType: string;
}) {
  const { submitCommand, isFeatureAvailable, connectionStatus } = useControlStore();
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  if (connectionStatus !== "connected" || !isFeatureAvailable("setRecipe")) return null;

  const buildingId = ENDPOINT_TO_BUILDING_ID[endpointType];
  if (!buildingId) return null;

  const compatibleRecipes = RECIPES_LIST.filter((r) => r.buildingId === buildingId);
  const defaultRecipes = compatibleRecipes.filter((r) => !r.isAlternate);
  const alternateRecipes = compatibleRecipes.filter((r) => r.isAlternate);

  // Match current recipe by RecipeClassName (strip Recipe_ prefix and _C suffix)
  const currentRecipeId = machine.RecipeClassName
    ?.replace(/^Recipe_/, "")
    ?.replace(/_C$/, "") ?? "";

  const handleChange = async (recipeId: string) => {
    if (recipeId === currentRecipeId || !recipeId) return;
    setState("submitting");
    const commandId = await submitCommand("SET_RECIPE", {
      machineId: key,
      recipeId,
    });
    setState(commandId ? "success" : "error");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-[var(--color-satisfactory-text-dim)]">
        Recipe
        {state === "success" && <Check className="w-3 h-3 text-[var(--color-connected)] inline ml-1" />}
        {state === "error" && <X className="w-3 h-3 text-[var(--color-disconnected)] inline ml-1" />}
        {state === "submitting" && <Loader2 className="w-3 h-3 animate-spin inline ml-1" />}
      </label>
      <select
        value={currentRecipeId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={state === "submitting"}
        className="block w-56 px-2 py-1 text-xs bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] disabled:opacity-50"
      >
        {defaultRecipes.length > 0 && (
          <optgroup label="Default">
            {defaultRecipes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </optgroup>
        )}
        {alternateRecipes.length > 0 && (
          <optgroup label="Alternate">
            {alternateRecipes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
