import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Battery } from "lucide-react";
import type { BatteryNode as BatteryNodeType } from "./types";

export const BatteryNodeComponent = memo(function BatteryNodeComponent({
  data,
}: NodeProps<BatteryNodeType>) {
  const fillColor =
    data.batteryPercent > 50
      ? "var(--color-connected)"
      : data.batteryPercent > 20
        ? "var(--color-warning)"
        : "var(--color-disconnected)";

  const diffColor = data.batteryDifferential >= 0 ? "var(--color-connected)" : "var(--color-warning)";
  const diffSign = data.batteryDifferential >= 0 ? "+" : "";
  const timeLabel = data.batteryDifferential >= 0 ? data.batteryTimeFull : data.batteryTimeEmpty;

  return (
    <div
      className="w-[180px] rounded-lg border bg-[var(--color-satisfactory-panel)] overflow-hidden"
      style={{ borderColor: "var(--color-satisfactory-border)", borderTopColor: "#06b6d4", borderTopWidth: 3 }}
    >
      <Handle
        type="source"
        position={Position.Top}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />

      {/* Header */}
      <div className="px-3 pt-2 flex items-center gap-2">
        <Battery className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="text-xs font-semibold text-[var(--color-satisfactory-text)]">
          Battery
        </span>
        <span className="ml-auto text-xs font-mono" style={{ color: fillColor }}>
          {data.batteryPercent.toFixed(0)}%
        </span>
      </div>

      {/* Charge bar */}
      <div className="px-3 py-1.5">
        <div className="h-2 rounded-full bg-[var(--color-satisfactory-dark)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(data.batteryPercent, 100)}%`,
              backgroundColor: fillColor,
            }}
          />
        </div>
      </div>

      {/* Differential + time */}
      <div className="px-3 pb-2 flex items-center justify-between text-[10px]">
        <span className="font-mono font-semibold" style={{ color: diffColor }}>
          {diffSign}{data.batteryDifferential.toFixed(1)} MW
        </span>
        {timeLabel && (
          <span className="text-[var(--color-satisfactory-text-dim)]">
            {timeLabel}
          </span>
        )}
      </div>
    </div>
  );
});
