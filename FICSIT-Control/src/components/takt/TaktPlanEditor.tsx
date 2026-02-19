import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { TaktPlan, TaktStage } from "../../types";
import { ITEMS_LIST } from "../../data/items";
import { ItemSelect } from "../planner/ItemSelect";
import { computeTakt, validateTaktPlan } from "../../solver/takt";
import { useTaktStore } from "../../stores/takt-store";
import { TaktStageTable } from "./TaktStageTable";

export function TaktPlanEditor() {
  const { plans, stages, selectedPlanId, updatePlan, setStages } =
    useTaktStore();

  const plan = selectedPlanId ? plans[selectedPlanId] : null;
  const planStages = selectedPlanId
    ? (stages[selectedPlanId] ?? []).sort((a, b) => a.order - b.order)
    : [];

  const result = useMemo(() => {
    if (!plan) return null;
    return computeTakt(plan, planStages);
  }, [plan, planStages]);

  const errors = useMemo(() => {
    if (!plan) return [];
    return validateTaktPlan(plan);
  }, [plan]);

  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-satisfactory-text-dim)]">
        Select or create a plan to get started
      </div>
    );
  }

  function handleUpdate(patch: Partial<TaktPlan>) {
    if (selectedPlanId) updatePlan(selectedPlanId, patch);
  }

  function handleStagesChange(newStages: TaktStage[]) {
    if (selectedPlanId) setStages(selectedPlanId, newStages);
  }

  const showWarnings =
    result &&
    (result.taktSecPerItem < 1 ||
      (plan.uptimePct < 10));

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Plan Name
          </label>
          <input
            type="text"
            value={plan.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Item
          </label>
          <ItemSelect
            items={ITEMS_LIST}
            value={plan.itemId}
            onChange={(itemId) => handleUpdate({ itemId })}
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Demand (items/min)
          </label>
          <input
            type="number"
            value={plan.demandPerMin}
            onChange={(e) =>
              handleUpdate({ demandPerMin: parseFloat(e.target.value) || 0 })
            }
            min={0}
            step={1}
            className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Uptime (%)
          </label>
          <input
            type="number"
            value={plan.uptimePct}
            onChange={(e) =>
              handleUpdate({ uptimePct: parseFloat(e.target.value) || 100 })
            }
            min={1}
            max={100}
            step={1}
            className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Actual Throughput (items/min){" "}
            <span className="text-[var(--color-satisfactory-text-dim)]">
              — optional
            </span>
          </label>
          <input
            type="number"
            value={plan.actualPerMin ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              handleUpdate({
                actualPerMin: val === "" ? undefined : parseFloat(val) || 0,
              });
            }}
            min={0}
            step={1}
            placeholder="Leave blank for takt-only"
            className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)]"
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Tags
            <span className="text-[var(--color-satisfactory-text-dim)]">
              {" "}— comma-separated
            </span>
          </label>
          <input
            type="text"
            value={plan.tags.join(", ")}
            onChange={(e) =>
              handleUpdate({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            placeholder="e.g. tier-5, iron"
            className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)]"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            Notes
          </label>
          <textarea
            value={plan.notes ?? ""}
            onChange={(e) => handleUpdate({ notes: e.target.value || undefined })}
            rows={2}
            className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] resize-y"
          />
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="p-3 rounded border border-red-500/30 bg-red-500/10 space-y-1">
          {errors.map((err) => (
            <p key={err} className="text-xs text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Live Results */}
      {result && errors.length === 0 && (
        <div className="p-4 rounded border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] space-y-3">
          <h3 className="text-sm font-medium text-[var(--color-satisfactory-orange)]">
            Results
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[var(--color-satisfactory-text-dim)]">
                Effective Demand
              </span>
              <p className="font-mono text-[var(--color-satisfactory-text)]">
                {result.effectiveDemandPerMin.toFixed(2)} items/min
              </p>
            </div>
            <div>
              <span className="text-[var(--color-satisfactory-text-dim)]">
                Takt Time
              </span>
              <p className="font-mono text-[var(--color-satisfactory-text)]">
                {result.taktSecPerItem.toFixed(2)} sec/item
              </p>
            </div>

            {result.actualCycleSecPerItem != null && (
              <>
                <div>
                  <span className="text-[var(--color-satisfactory-text-dim)]">
                    Actual Cycle Time
                  </span>
                  <p className="font-mono text-[var(--color-satisfactory-text)]">
                    {result.actualCycleSecPerItem.toFixed(2)} sec/item
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-satisfactory-text-dim)]">
                    Delta
                  </span>
                  <p
                    className={`font-mono ${
                      result.deltaPerMin! >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {result.deltaPerMin! >= 0 ? "+" : ""}
                    {result.deltaPerMin!.toFixed(2)} items/min
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[var(--color-satisfactory-text-dim)]">
                    Compliance
                  </span>
                  <p
                    className={`text-lg font-bold ${
                      result.compliance ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result.compliance ? "PASS" : "FAIL"}
                  </p>
                </div>
              </>
            )}
          </div>

          {showWarnings && (
            <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div className="text-xs text-yellow-400 space-y-1">
                {result.taktSecPerItem < 1 && (
                  <p>Takt time is below 1 sec/item — extremely high demand.</p>
                )}
                {plan.uptimePct < 10 && (
                  <p>Uptime is very low ({plan.uptimePct}%).</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage Table */}
      {result && errors.length === 0 && (
        <TaktStageTable
          stages={planStages}
          taktSecPerItem={result.taktSecPerItem}
          flaggedStageIds={result.flaggedStages}
          onChange={handleStagesChange}
          planId={plan.id}
        />
      )}
    </div>
  );
}
