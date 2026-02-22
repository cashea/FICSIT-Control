import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ItemTreeNode } from "./types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../recipe-tree-theme";

export const ItemNodeComponent = memo(function ItemNodeComponent({
  data,
  selected,
}: NodeProps<ItemTreeNode>) {
  const borderColor = CATEGORY_COLORS[data.category];
  const hasInventory = data.hasInventory;
  const isRaw = data.isRawResource;

  return (
    <div
      className="rounded-lg border text-xs"
      style={{
        width: 160,
        height: 70,
        borderColor: hasInventory ? "#22c55e" : "var(--color-satisfactory-border)",
        borderWidth: hasInventory ? 2 : 1,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        backgroundColor: isRaw
          ? "rgba(217, 119, 6, 0.12)"
          : "var(--color-satisfactory-panel)",
        boxShadow: selected
          ? `0 0 12px ${borderColor}80`
          : hasInventory
            ? "0 0 8px rgba(34, 197, 94, 0.35)"
            : "none",
      }}
    >
      {/* Item name */}
      <div
        className="px-2 pt-2 font-medium truncate"
        style={{ color: "var(--color-satisfactory-text)" }}
        title={data.itemName}
      >
        {data.itemName}
      </div>

      {/* Category label */}
      <div
        className="px-2 pt-0.5 truncate"
        style={{ color: borderColor, fontSize: "0.65rem" }}
      >
        {CATEGORY_LABELS[data.category]}
        {data.form !== "solid" && ` (${data.form})`}
      </div>

      {/* Inventory badge */}
      {hasInventory && (
        <div
          className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-white font-bold"
          style={{ fontSize: "0.6rem", backgroundColor: "#22c55e" }}
        >
          {data.inventoryCount.toLocaleString()}
        </div>
      )}

      {/* Handles */}
      {!isRaw && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-[var(--color-satisfactory-border)]"
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[var(--color-satisfactory-border)]"
      />
    </div>
  );
});
