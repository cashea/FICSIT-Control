import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import type { ProductionGraphNode } from "./types";

export const ProductionNodeComponent = memo(function ProductionNodeComponent({
  data,
  selected,
}: NodeProps<ProductionGraphNode>) {
  return (
    <div
      className={`w-[280px] rounded-lg border bg-[var(--color-satisfactory-panel)] ${
        selected
          ? "border-[var(--color-satisfactory-orange)] shadow-lg shadow-[var(--color-satisfactory-orange)]/20"
          : "border-[var(--color-satisfactory-border)]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />

      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-satisfactory-border)]">
        <div className="text-sm font-semibold text-[var(--color-satisfactory-text)]">
          {data.recipeName}
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--color-satisfactory-text-dim)]">
          <span>
            {data.buildingCount.toFixed(1)}x {data.buildingName}
          </span>
          <span className="flex items-center gap-1 text-[var(--color-satisfactory-orange)]">
            <Zap className="w-3 h-3" />
            {data.powerMW.toFixed(1)} MW
          </span>
        </div>
      </div>

      {/* Inputs / Outputs */}
      <div className="flex gap-2 px-3 py-2 text-xs">
        <div className="flex-1 min-w-0">
          <div className="text-[var(--color-satisfactory-text-dim)] mb-1 font-medium">
            IN <span className="font-normal opacity-60">/min (/cyc)</span>
          </div>
          {data.inputs.length === 0 ? (
            <div className="text-[var(--color-satisfactory-text-dim)]">--</div>
          ) : (
            data.inputs.map((inp) => (
              <div
                key={inp.itemName}
                className="flex justify-between gap-1 truncate"
              >
                <span className="truncate text-[var(--color-satisfactory-text)]">
                  {inp.itemName}
                </span>
                <span className="shrink-0 font-mono text-[var(--color-satisfactory-text-dim)]">
                  {inp.ratePerMinute.toFixed(1)}
                  <span className="opacity-60"> ({inp.perCycle.toFixed(1)})</span>
                </span>
              </div>
            ))
          )}
        </div>

        <div className="w-px bg-[var(--color-satisfactory-border)] self-stretch" />

        <div className="flex-1 min-w-0">
          <div className="text-[var(--color-satisfactory-text-dim)] mb-1 font-medium">
            OUT <span className="font-normal opacity-60">/min (/cyc)</span>
          </div>
          {data.outputs.map((out) => (
            <div
              key={out.itemName}
              className="flex justify-between gap-1 truncate"
            >
              <span className="truncate text-[var(--color-satisfactory-text)]">
                {out.itemName}
              </span>
              <span className="shrink-0 font-mono text-[var(--color-satisfactory-text-dim)]">
                {out.ratePerMinute.toFixed(1)}
                <span className="opacity-60"> ({out.perCycle.toFixed(1)})</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-satisfactory-orange)] !w-2 !h-2"
      />
    </div>
  );
});
