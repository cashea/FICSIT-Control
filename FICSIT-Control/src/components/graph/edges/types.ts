import type { Edge } from "@xyflow/react";

export interface ItemFlowEdgeData extends Record<string, unknown> {
  itemName: string;
  ratePerMinute: number;
  perCycle: number | null;
}

export type AppEdge = Edge<ItemFlowEdgeData, "itemFlow">;
