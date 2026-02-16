import { useState } from "react";
import { Target, Plus, X } from "lucide-react";
import { ITEMS } from "../../data/items";
import { PRODUCIBLE_ITEMS } from "../../data/items";
import { usePlannerStore } from "../../stores/planner-store";
import { ItemSelect } from "./ItemSelect";

export function TargetInputSection() {
  const { targets, addTarget, removeTarget, updateTarget } = usePlannerStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [rate, setRate] = useState(10);

  function handleAdd() {
    if (!selectedItemId || rate <= 0) return;
    addTarget({ itemId: selectedItemId, ratePerMinute: rate });
    setSelectedItemId(null);
    setRate(10);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Target className="w-5 h-5 text-[var(--color-satisfactory-orange)]" />
        Production Targets
      </h2>

      {/* Existing targets */}
      {targets.length > 0 && (
        <div className="space-y-1">
          {targets.map((target, i) => (
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
                step="0.1"
                value={target.ratePerMinute}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    updateTarget(i, { ...target, ratePerMinute: val });
                  }
                }}
                className="w-24 px-2 py-1 text-sm text-right bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
              />
              <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
                /min
              </span>
              <button
                onClick={() => removeTarget(i)}
                className="p-1 text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-disconnected)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
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
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
          className="w-24 px-2 py-1 text-sm text-right bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
        />
        <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
          /min
        </span>
        <button
          onClick={handleAdd}
          disabled={!selectedItemId || rate <= 0}
          className="p-1.5 bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)] rounded hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
