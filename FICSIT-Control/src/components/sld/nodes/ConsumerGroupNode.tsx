import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowDown } from "lucide-react";
import type { ConsumerGroupNode as ConsumerGroupNodeType } from "./types";

export const ConsumerGroupNodeComponent = memo(function ConsumerGroupNodeComponent({
  data,
}: NodeProps<ConsumerGroupNodeType>) {
  return (
    <div className="w-[220px] rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] overflow-hidden"
      style={{ borderLeftColor: "var(--color-warning)", borderLeftWidth: 4 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />

      <div className="px-3 py-2 flex items-center gap-2">
        <ArrowDown className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--color-satisfactory-text)] truncate">
            {data.name}
          </div>
          <div className="text-[10px] text-[var(--color-satisfactory-text-dim)]">
            x{data.count} &middot;{" "}
            <span className="text-[var(--color-connected)]">{data.activeCount}</span>
            {data.pausedCount > 0 && (
              <span className="text-[var(--color-warning)]"> / {data.pausedCount} paused</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-mono font-semibold text-[var(--color-warning)]">
            {data.totalPowerDraw.toFixed(1)}
          </div>
          <div className="text-[10px] text-[var(--color-satisfactory-text-dim)]">MW</div>
        </div>
      </div>
    </div>
  );
});
