import { useControlStore } from "../../stores/control-store";
import { CommandStatusBadge } from "./CommandStatusBadge";

export function RecentCommands() {
  const { commandLog, connectionStatus } = useControlStore();

  if (connectionStatus !== "connected" || commandLog.length === 0) return null;

  return (
    <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
      <h3 className="text-sm font-semibold mb-3 text-[var(--color-satisfactory-text)]">
        Recent Commands
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {commandLog
          .slice()
          .reverse()
          .map((entry) => (
            <div
              key={entry.commandId}
              className="flex items-center justify-between text-xs gap-2"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[var(--color-satisfactory-text)] truncate">
                  {entry.type.replace(/_/g, " ")}
                </span>
                <span className="text-[var(--color-satisfactory-text-dim)]">
                  {new Date(entry.submittedAt).toLocaleTimeString()}
                </span>
              </div>
              <CommandStatusBadge status={entry.status} />
            </div>
          ))}
      </div>
    </div>
  );
}
