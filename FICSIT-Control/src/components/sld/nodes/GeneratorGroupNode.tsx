import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GeneratorGroupNode as GeneratorGroupNodeType } from "./types";

export const GeneratorGroupNodeComponent = memo(function GeneratorGroupNodeComponent({
  data,
}: NodeProps<GeneratorGroupNodeType>) {
  const fuelColor =
    data.avgFuelPercent > 0.3
      ? "var(--color-connected)"
      : data.avgFuelPercent > 0.1
        ? "var(--color-warning)"
        : "var(--color-disconnected)";

  return (
    <div
      className="w-[220px] rounded-lg border bg-[var(--color-satisfactory-panel)] overflow-hidden"
      style={{ borderColor: "var(--color-satisfactory-border)", borderLeftColor: data.categoryColor, borderLeftWidth: 4 }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2">
        {/* Generator symbol */}
        <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke={data.categoryColor}
            strokeWidth="2"
          />
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fill={data.categoryColor}
            fontSize="14"
            fontFamily="serif"
          >
            ~
          </text>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--color-satisfactory-text)]">
            {data.category}
          </div>
          <div className="text-xs text-[var(--color-satisfactory-text-dim)]">
            x{data.count}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-mono font-semibold" style={{ color: "var(--color-connected)" }}>
            {data.totalMW.toFixed(1)}
          </div>
          <div className="text-[10px] text-[var(--color-satisfactory-text-dim)]">MW</div>
        </div>
      </div>

      {/* Fuel bar */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between text-[10px] text-[var(--color-satisfactory-text-dim)] mb-0.5">
          <span>Fuel</span>
          <span>{(data.avgFuelPercent * 100).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-satisfactory-dark)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(data.avgFuelPercent * 100, 100)}%`,
              backgroundColor: fuelColor,
            }}
          />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />
    </div>
  );
});
