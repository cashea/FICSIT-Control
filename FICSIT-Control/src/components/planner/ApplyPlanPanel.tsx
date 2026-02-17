import { useState, useMemo } from "react";
import { Play, Loader2 } from "lucide-react";
import { usePlannerStore } from "../../stores/planner-store";
import { useControlStore } from "../../stores/control-store";
import { generatePlanActions, type ProposedAction } from "../../solver/plan-actions";
import { CommandStatusBadge } from "../control/CommandStatusBadge";
import type { CommandStatus } from "../../types";

export function ApplyPlanPanel() {
  const { solverOutput } = usePlannerStore();
  const { connectionStatus, isFeatureAvailable, submitCommand, commandLog } =
    useControlStore();

  const [actions, setActions] = useState<ProposedAction[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executedIds, setExecutedIds] = useState<Map<string, string>>(new Map()); // actionId -> commandId

  const canApply =
    connectionStatus === "connected" && isFeatureAvailable("setRecipe");

  const proposedActions = useMemo(() => {
    if (!solverOutput) return [];
    return generatePlanActions(solverOutput);
  }, [solverOutput]);

  // Initialize actions when proposed actions change
  if (proposedActions.length > 0 && actions.length === 0) {
    setActions(proposedActions);
  }

  if (!solverOutput || !canApply || proposedActions.length === 0) {
    return null;
  }

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleApply = async () => {
    setExecuting(true);
    const enabled = actions.filter((a) => a.enabled);
    const newExecutedIds = new Map(executedIds);

    for (const action of enabled) {
      const commandId = await submitCommand(action.type, action.payload);
      if (commandId) {
        newExecutedIds.set(action.id, commandId);
      }
    }

    setExecutedIds(newExecutedIds);
    setExecuting(false);
  };

  const getActionStatus = (actionId: string): CommandStatus | null => {
    const commandId = executedIds.get(actionId);
    if (!commandId) return null;
    const entry = commandLog.find((e) => e.commandId === commandId);
    return entry?.status ?? null;
  };

  const enabledCount = actions.filter((a) => a.enabled).length;

  return (
    <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-satisfactory-text)]">
          Apply Plan ({enabledCount}/{actions.length} actions)
        </h3>
        <button
          onClick={handleApply}
          disabled={executing || enabledCount === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] border border-[var(--color-satisfactory-orange)]/30 hover:bg-[var(--color-satisfactory-orange)]/30 transition-colors disabled:opacity-50"
        >
          {executing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          {executing ? "Applying..." : "Apply Selected"}
        </button>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {actions.map((action) => {
          const status = getActionStatus(action.id);
          return (
            <div
              key={action.id}
              className="flex items-center gap-3 px-3 py-2 rounded bg-[var(--color-satisfactory-dark)]/50 text-xs"
            >
              <input
                type="checkbox"
                checked={action.enabled}
                onChange={() => toggleAction(action.id)}
                disabled={executing}
                className="shrink-0 accent-[var(--color-satisfactory-orange)]"
              />
              <span className="flex-1 text-[var(--color-satisfactory-text)]">
                {action.description}
              </span>
              {status && <CommandStatusBadge status={status} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
