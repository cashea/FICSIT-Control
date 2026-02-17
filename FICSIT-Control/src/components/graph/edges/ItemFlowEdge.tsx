import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { AppEdge } from "./types";

export const ItemFlowEdge = memo(function ItemFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<AppEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected
            ? "var(--color-satisfactory-orange)"
            : "var(--color-satisfactory-border)",
          strokeWidth: selected ? 2 : 1.5,
        }}
      />
      {data && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-satisfactory-dark)]/90 border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <span className="font-medium text-[var(--color-satisfactory-text)]">
              {data.itemName}
            </span>{" "}
            <span className="font-mono">
              {data.ratePerMinute.toFixed(1)}/m
              {data.perCycle != null && (
                <span className="opacity-60"> ({data.perCycle.toFixed(1)}/c)</span>
              )}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
