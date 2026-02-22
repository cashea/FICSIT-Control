import { memo, useState } from "react";
import {
  getSmoothStepPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import type { RecipeTreeEdge } from "./types";

export const RecipeFlowEdge = memo(function RecipeFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps<RecipeTreeEdge>) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  const showLabel = hovered || selected;

  return (
    <>
      {/* Invisible wider hit area for hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={
          selected
            ? "var(--color-satisfactory-orange)"
            : hovered
              ? "var(--color-satisfactory-text-dim)"
              : "var(--color-satisfactory-border)"
        }
        strokeWidth={selected ? 2 : hovered ? 1.5 : 0.75}
        strokeDasharray={selected || hovered ? undefined : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {showLabel && data && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan px-1.5 py-0.5 rounded text-xs pointer-events-none"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              backgroundColor: "var(--color-satisfactory-panel)",
              border: "1px solid var(--color-satisfactory-border)",
              color: "var(--color-satisfactory-text)",
              fontSize: "0.65rem",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            {data.itemName}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
