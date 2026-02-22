import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { RecipeTreeNode } from "./types";

export const RecipeNodeComponent = memo(function RecipeNodeComponent({
  data,
  selected,
}: NodeProps<RecipeTreeNode>) {
  const isAlt = data.isAlternate;

  return (
    <div
      className="rounded-full text-xs flex flex-col items-center justify-center"
      style={{
        width: 200,
        height: 50,
        border: isAlt
          ? "1px dashed var(--color-satisfactory-border)"
          : "1px solid var(--color-satisfactory-border)",
        backgroundColor: isAlt
          ? "rgba(99, 102, 241, 0.08)"
          : "var(--color-satisfactory-panel)",
        boxShadow: selected
          ? "0 0 12px rgba(249, 115, 22, 0.5)"
          : "none",
      }}
    >
      {/* ALT badge */}
      {isAlt && (
        <div
          className="absolute -top-2 -left-1 px-1.5 py-0.5 rounded text-white font-bold"
          style={{ fontSize: "0.55rem", backgroundColor: "#6366f1" }}
        >
          ALT
        </div>
      )}

      {/* Recipe name */}
      <div
        className="font-medium truncate px-3 max-w-full"
        style={{ color: "var(--color-satisfactory-text)" }}
        title={data.recipeName}
      >
        {data.recipeName}
      </div>

      {/* Building */}
      <div
        className="truncate px-3 max-w-full"
        style={{ color: "var(--color-satisfactory-text-dim)", fontSize: "0.6rem" }}
      >
        {data.buildingName}
      </div>

      {/* Input handles (left side, spaced evenly) */}
      {Array.from({ length: data.inputCount }, (_, i) => (
        <Handle
          key={`in-${i}`}
          type="target"
          position={Position.Left}
          id={`in-${i}`}
          className="!w-1.5 !h-1.5 !bg-[var(--color-satisfactory-border)]"
          style={{
            top: `${((i + 1) / (data.inputCount + 1)) * 100}%`,
          }}
        />
      ))}

      {/* Output handles (right side, spaced evenly) */}
      {Array.from({ length: data.outputCount }, (_, i) => (
        <Handle
          key={`out-${i}`}
          type="source"
          position={Position.Right}
          id={`out-${i}`}
          className="!w-1.5 !h-1.5 !bg-[var(--color-satisfactory-border)]"
          style={{
            top: `${((i + 1) / (data.outputCount + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  );
});
