import type { CommandStatus } from "../../types";

const statusStyles: Record<CommandStatus, string> = {
  QUEUED: "text-[var(--color-satisfactory-text-dim)] bg-[var(--color-satisfactory-text-dim)]/10",
  RUNNING: "text-blue-400 bg-blue-400/10 animate-pulse",
  SUCCEEDED: "text-[var(--color-connected)] bg-[var(--color-connected)]/10",
  FAILED: "text-[var(--color-disconnected)] bg-[var(--color-disconnected)]/10",
};

export function CommandStatusBadge({ status }: { status: CommandStatus }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
