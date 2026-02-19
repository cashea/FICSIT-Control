import { Plus, Trash2 } from "lucide-react";
import { ITEMS } from "../../data/items";
import { useTaktStore } from "../../stores/takt-store";

export function TaktPlanList() {
  const { plans, selectedPlanId, createPlan, deletePlan, selectPlan } =
    useTaktStore();

  const planList = Object.values(plans).sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  );

  function handleCreate() {
    createPlan({
      name: "New Plan",
      itemId: "",
      demandPerMin: 60,
      uptimePct: 100,
      tags: [],
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--color-satisfactory-text)]">
          Plans
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)] font-medium hover:brightness-110 transition-all"
        >
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      {planList.length === 0 ? (
        <p className="text-xs text-[var(--color-satisfactory-text-dim)]">
          No plans yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-1">
          {planList.map((plan) => {
            const item = plan.itemId ? ITEMS[plan.itemId] : null;
            const isSelected = plan.id === selectedPlanId;
            return (
              <div
                key={plan.id}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[var(--color-satisfactory-orange)]/20 border border-[var(--color-satisfactory-orange)]/40"
                    : "hover:bg-[var(--color-satisfactory-border)]/30 border border-transparent"
                }`}
                onClick={() => selectPlan(plan.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-satisfactory-text)] truncate">
                    {plan.name}
                  </p>
                  <p className="text-xs text-[var(--color-satisfactory-text-dim)] truncate">
                    {item ? item.name : "No item"} — {plan.demandPerMin}/min
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlan(plan.id);
                  }}
                  className="p-1 text-[var(--color-satisfactory-text-dim)] hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
