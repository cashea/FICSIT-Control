import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { TaktStage } from "../../types";

interface TaktStageTableProps {
  stages: TaktStage[];
  taktSecPerItem: number;
  flaggedStageIds: string[];
  onChange: (stages: TaktStage[]) => void;
  planId: string;
}

export function TaktStageTable({
  stages,
  taktSecPerItem,
  flaggedStageIds,
  onChange,
  planId,
}: TaktStageTableProps) {
  function addStage() {
    const newStage: TaktStage = {
      id: crypto.randomUUID(),
      planId,
      name: "",
      timeSec: 0,
      order: stages.length,
    };
    onChange([...stages, newStage]);
  }

  function removeStage(id: string) {
    onChange(
      stages
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i })),
    );
  }

  function updateStage(id: string, patch: Partial<TaktStage>) {
    onChange(stages.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function moveStage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((s, i) => ({ ...s, order: i })));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--color-satisfactory-text)]">
          Process Stages
        </h3>
        <button
          onClick={addStage}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] hover:bg-[var(--color-satisfactory-orange)]/30 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Stage
        </button>
      </div>

      {stages.length === 0 ? (
        <p className="text-xs text-[var(--color-satisfactory-text-dim)]">
          No stages defined. Add stages to check for bottlenecks.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-satisfactory-text-dim)]">
              <th className="pb-1 pr-2 font-medium">Order</th>
              <th className="pb-1 pr-2 font-medium">Name</th>
              <th className="pb-1 pr-2 font-medium">Time (sec)</th>
              <th className="pb-1 font-medium w-16">Status</th>
              <th className="pb-1 w-20" />
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, index) => {
              const isFlagged = flaggedStageIds.includes(stage.id);
              return (
                <tr
                  key={stage.id}
                  className={
                    isFlagged
                      ? "bg-red-500/10"
                      : ""
                  }
                >
                  <td className="py-1 pr-2">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => moveStage(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveStage(index, 1)}
                        disabled={index === stages.length - 1}
                        className="p-0.5 text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] disabled:opacity-30"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) =>
                        updateStage(stage.id, { name: e.target.value })
                      }
                      placeholder="Stage name"
                      className="w-full px-2 py-1 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      value={stage.timeSec}
                      onChange={(e) =>
                        updateStage(stage.id, {
                          timeSec: parseFloat(e.target.value) || 0,
                        })
                      }
                      min={0}
                      step={0.1}
                      className="w-24 px-2 py-1 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    {stage.timeSec > 0 && (
                      <span
                        className={`text-xs font-medium ${
                          isFlagged
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {isFlagged ? "Over takt" : "OK"}
                      </span>
                    )}
                  </td>
                  <td className="py-1 text-right">
                    <button
                      onClick={() => removeStage(stage.id)}
                      className="p-1 text-[var(--color-satisfactory-text-dim)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="text-xs text-[var(--color-satisfactory-text-dim)] border-t border-[var(--color-satisfactory-border)]">
              <td colSpan={5} className="pt-1">
                Takt time: {taktSecPerItem.toFixed(2)} sec/item — stages
                exceeding this are flagged
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
