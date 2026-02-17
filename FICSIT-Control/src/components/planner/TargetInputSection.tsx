import { useState } from "react";
import { Target, Plus, X, Clock, Gauge } from "lucide-react";
import { ITEMS } from "../../data/items";
import { PRODUCIBLE_ITEMS } from "../../data/items";
import { usePlannerStore } from "../../stores/planner-store";
import { ItemSelect } from "./ItemSelect";
import type { TargetInputMode } from "../../types";

export function TargetInputSection() {
  const {
    targets,
    addTarget,
    removeTarget,
    updateTarget,
    batchTimeMinutes,
    setBatchTimeMinutes,
  } = usePlannerStore();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(10);
  const [inputMode, setInputMode] = useState<TargetInputMode>("rate");

  function handleModeChange(mode: TargetInputMode) {
    setInputMode(mode);
    if (mode === "quantity" && batchTimeMinutes === null) {
      setBatchTimeMinutes(10);
    }
    if (mode === "rate" && batchTimeMinutes !== null) {
      setBatchTimeMinutes(null);
    }
  }

  function handleAdd() {
    if (!selectedItemId || inputValue <= 0) return;

    const ratePerMinute =
      inputMode === "quantity" && batchTimeMinutes && batchTimeMinutes > 0
        ? inputValue / batchTimeMinutes
        : inputValue;

    addTarget({
      itemId: selectedItemId,
      ratePerMinute,
      inputMode,
      inputValue,
    });
    setSelectedItemId(null);
    setInputValue(inputMode === "rate" ? 10 : 100);
  }

  function handleUpdateValue(index: number, newValue: number) {
    if (isNaN(newValue) || newValue <= 0) return;
    const target = targets[index];
    const mode = target.inputMode ?? "rate";
    const ratePerMinute =
      mode === "quantity" && batchTimeMinutes && batchTimeMinutes > 0
        ? newValue / batchTimeMinutes
        : newValue;
    updateTarget(index, {
      ...target,
      inputValue: newValue,
      ratePerMinute,
    });
  }

  const isQuantityMode = inputMode === "quantity";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-[var(--color-satisfactory-orange)]" />
          Production Targets
        </h2>

        {/* Mode toggle */}
        <div className="flex rounded border border-[var(--color-satisfactory-border)] overflow-hidden">
          <button
            onClick={() => handleModeChange("rate")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              !isQuantityMode
                ? "bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)]"
                : "bg-[var(--color-satisfactory-panel)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Rate
          </button>
          <button
            onClick={() => handleModeChange("quantity")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              isQuantityMode
                ? "bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)]"
                : "bg-[var(--color-satisfactory-panel)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Quantity
          </button>
        </div>
      </div>

      {/* Batch time (quantity mode only) */}
      {isQuantityMode && (
        <div className="flex items-center gap-2 p-3 bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)]">
          <Clock className="w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
          <span className="text-sm text-[var(--color-satisfactory-text-dim)]">
            Produce within
          </span>
          <input
            type="number"
            min="0.1"
            step="1"
            value={batchTimeMinutes ?? 10}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) setBatchTimeMinutes(val);
            }}
            className="w-20 px-2 py-1 text-sm text-right bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
          />
          <span className="text-sm text-[var(--color-satisfactory-text-dim)]">
            minutes
          </span>
        </div>
      )}

      {/* Existing targets */}
      {targets.length > 0 && (
        <div className="space-y-1">
          {targets.map((target, i) => {
            const mode = target.inputMode ?? "rate";
            const displayValue = target.inputValue ?? target.ratePerMinute;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)]"
              >
                <span className="flex-1 text-sm font-medium">
                  {ITEMS[target.itemId]?.name ?? target.itemId}
                </span>
                <input
                  type="number"
                  min="0.1"
                  step={mode === "rate" ? "0.1" : "1"}
                  value={displayValue}
                  onChange={(e) =>
                    handleUpdateValue(i, parseFloat(e.target.value))
                  }
                  className="w-24 px-2 py-1 text-sm text-right bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
                />
                <span className="text-xs text-[var(--color-satisfactory-text-dim)] w-8">
                  {mode === "rate" ? "/min" : "qty"}
                </span>
                {mode === "quantity" && (
                  <span className="text-xs text-[var(--color-satisfactory-text-dim)] font-mono">
                    ({target.ratePerMinute.toFixed(1)}/min)
                  </span>
                )}
                <button
                  onClick={() => removeTarget(i)}
                  className="p-1 text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-disconnected)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new target */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ItemSelect
            items={PRODUCIBLE_ITEMS}
            value={selectedItemId}
            onChange={setSelectedItemId}
            placeholder="Select item to produce..."
          />
        </div>
        <input
          type="number"
          min="0.1"
          step={isQuantityMode ? "1" : "0.1"}
          value={inputValue}
          onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
          className="w-24 px-2 py-1 text-sm text-right bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
        />
        <span className="text-xs text-[var(--color-satisfactory-text-dim)] w-8">
          {isQuantityMode ? "qty" : "/min"}
        </span>
        <button
          onClick={handleAdd}
          disabled={!selectedItemId || inputValue <= 0}
          className="p-1.5 bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)] rounded hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
