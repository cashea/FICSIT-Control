import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatMW } from "../../utils/format";
import type { ConsumerGroup } from "../../utils/power";

function ConsumerGroupSection({ group }: { group: ConsumerGroup }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--color-satisfactory-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-satisfactory-dark)]/50 transition-colors cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
        )}
        <span className="text-sm font-medium text-[var(--color-satisfactory-text)]">
          {group.name}
        </span>
        <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
          x{group.count}
        </span>
        <span className="ml-auto text-sm font-medium text-[var(--color-warning)]">
          {formatMW(group.totalPowerDraw)}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-satisfactory-border)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-satisfactory-text-dim)]">
                <th className="text-left px-4 py-2 font-medium">Recipe</th>
                <th className="text-right px-4 py-2 font-medium">Power</th>
                <th className="text-right px-4 py-2 font-medium">Max</th>
                <th className="text-right px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {group.machines.map((m, i) => (
                <tr
                  key={i}
                  className="border-t border-[var(--color-satisfactory-border)]/50 hover:bg-[var(--color-satisfactory-dark)]/30"
                >
                  <td className="px-4 py-2 text-[var(--color-satisfactory-text)] truncate max-w-[200px]">
                    {m.Recipe || "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-warning)]">
                    {formatMW(m.PowerInfo.PowerConsumed)}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-satisfactory-text-dim)]">
                    {formatMW(m.PowerInfo.MaxPowerConsumed)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {m.IsPaused ? (
                      <span className="text-[var(--color-satisfactory-text-dim)]">Paused</span>
                    ) : m.IsProducing ? (
                      <span className="text-[var(--color-connected)]">Running</span>
                    ) : (
                      <span className="text-[var(--color-warning)]">Idle</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ConsumerBreakdown({
  consumers,
}: {
  consumers: ConsumerGroup[];
}) {
  if (consumers.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
        <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-2">
          Consumers
        </h4>
        <p className="text-xs text-[var(--color-satisfactory-text-dim)]">
          No consumers on this circuit
        </p>
      </div>
    );
  }

  const totalDraw = consumers.reduce((s, c) => s + c.totalPowerDraw, 0);
  const totalCount = consumers.reduce((s, c) => s + c.count, 0);

  return (
    <div>
      <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
        Consumers ({totalCount}) — {formatMW(totalDraw)}
      </h4>
      <div className="space-y-2">
        {consumers.map((group) => (
          <ConsumerGroupSection key={group.name} group={group} />
        ))}
      </div>
    </div>
  );
}
