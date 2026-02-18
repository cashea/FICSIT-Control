import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FuseNode as FuseNodeType } from "./types";
import { ControlActionButton } from "../../control/ControlActionButton";

export const FuseNodeComponent = memo(function FuseNodeComponent({
  data,
}: NodeProps<FuseNodeType>) {
  const color = data.fuseTripped
    ? "var(--color-disconnected)"
    : "var(--color-connected)";

  return (
    <div className="flex flex-col items-center w-[80px] h-[80px]">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />

      {/* Breaker symbol SVG */}
      <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
        {data.fuseTripped ? (
          <>
            {/* Open breaker — gap in the middle */}
            <line x1="0" y1="20" x2="12" y2="20" stroke={color} strokeWidth="3" />
            <line x1="12" y1="20" x2="24" y2="8" stroke={color} strokeWidth="3" />
            <line x1="28" y1="20" x2="40" y2="20" stroke={color} strokeWidth="3" />
            <circle cx="12" cy="20" r="3" fill={color}>
              <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="20" r="3" fill={color} />
          </>
        ) : (
          <>
            {/* Closed breaker — connected */}
            <line x1="0" y1="20" x2="12" y2="20" stroke={color} strokeWidth="3" />
            <line x1="12" y1="20" x2="28" y2="20" stroke={color} strokeWidth="3" />
            <line x1="28" y1="20" x2="40" y2="20" stroke={color} strokeWidth="3" />
            <rect x="14" y="14" width="12" height="12" fill="none" stroke={color} strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Status label */}
      <div
        className="text-[10px] font-semibold mt-0.5"
        style={{ color }}
      >
        {data.fuseTripped ? "TRIPPED" : "CLOSED"}
      </div>

      {/* Reset button (only when tripped + control connected) */}
      {data.fuseTripped && (
        <ControlActionButton
          commandType="RESET_FUSE"
          payload={{ circuitId: data.circuitId }}
          label="Reset"
          feature="resetFuse"
          className="mt-1 nodrag"
        />
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />
    </div>
  );
});
