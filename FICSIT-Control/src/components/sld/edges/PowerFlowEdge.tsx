import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { SLDEdge } from "./types";
import { utilizationColor } from "../sld-theme";

export const PowerFlowEdge = memo(function PowerFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<SLDEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });

  const color = data
    ? utilizationColor(data.utilization, false)
    : "var(--color-satisfactory-border)";

  const animClass =
    data?.direction === "battery" && data.powerMW > 0
      ? "sld-edge-reverse"
      : "sld-edge-animated";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 3,
          strokeDasharray: "8 4",
        }}
        className={animClass}
      />
      {data && data.powerMW > 0 && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none px-1 py-0.5 rounded text-[9px] font-mono bg-[var(--color-satisfactory-dark)]/90 border border-[var(--color-satisfactory-border)]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color,
            }}
          >
            {data.powerMW.toFixed(1)} MW
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
