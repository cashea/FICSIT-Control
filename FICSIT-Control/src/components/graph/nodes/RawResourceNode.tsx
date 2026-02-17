import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Pickaxe } from "lucide-react";
import type { RawResourceGraphNode } from "./types";

export const RawResourceNodeComponent = memo(
  function RawResourceNodeComponent({
    data,
    selected,
  }: NodeProps<RawResourceGraphNode>) {
    return (
      <div
        className={`w-[200px] rounded-lg border px-3 py-2 bg-amber-900/20 ${
          selected
            ? "border-amber-400 shadow-lg shadow-amber-400/20"
            : "border-amber-700/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Pickaxe className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-200 truncate">
            {data.itemName}
          </span>
          <span className="ml-auto font-mono text-xs text-amber-400 shrink-0">
            {data.ratePerMinute.toFixed(1)}/min
          </span>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-amber-400 !w-2 !h-2"
        />
      </div>
    );
  },
);
