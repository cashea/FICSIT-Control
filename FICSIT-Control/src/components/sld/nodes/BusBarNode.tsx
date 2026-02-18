import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { BusBarNode as BusBarNodeType } from "./types";
import { utilizationColor } from "../sld-theme";

export const BusBarNodeComponent = memo(function BusBarNodeComponent({
  data,
}: NodeProps<BusBarNodeType>) {
  const color = utilizationColor(data.utilization, data.fuseTripped);
  const pct = (data.utilization * 100).toFixed(0);

  return (
    <div className="flex flex-col items-center w-[60px] h-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />

      {/* Bus bar line */}
      <div
        className="w-2 flex-1 rounded-full transition-colors"
        style={{ backgroundColor: color }}
      />

      {/* Label below */}
      <div className="mt-1 text-center whitespace-nowrap">
        <div className="text-[10px] font-semibold text-[var(--color-satisfactory-text)]">
          #{data.circuitId}
        </div>
        <div className="text-[9px] font-mono" style={{ color }}>
          {pct}%
        </div>
        <div className="text-[9px] text-[var(--color-satisfactory-text-dim)] font-mono">
          {data.powerConsumed.toFixed(0)}/{data.powerCapacity.toFixed(0)}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />
      <Handle
        type="target"
        id="battery"
        position={Position.Bottom}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />
    </div>
  );
});
