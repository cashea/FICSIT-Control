import { Wifi, WifiOff, Activity } from "lucide-react";
import { useConnectionStore } from "../../stores/connection-store";

export function Header() {
  const { status, lastUpdate } = useConnectionStore();

  const statusColor =
    status === "connected"
      ? "text-[var(--color-connected)]"
      : status === "error"
        ? "text-[var(--color-disconnected)]"
        : "text-[var(--color-satisfactory-text-dim)]";

  const StatusIcon = status === "connected" ? Wifi : WifiOff;

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[var(--color-satisfactory-panel)] border-b border-[var(--color-satisfactory-border)]">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-[var(--color-satisfactory-orange)]" />
        <h1 className="text-lg font-semibold text-[var(--color-satisfactory-text)]">
          Satisfactory Planner
        </h1>
      </div>

      <div className={`flex items-center gap-2 text-sm ${statusColor}`}>
        <StatusIcon className="w-4 h-4" />
        <span className="capitalize">{status}</span>
        {lastUpdate && (
          <span className="text-[var(--color-satisfactory-text-dim)] text-xs">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>
    </header>
  );
}
