import type { Node } from "@xyflow/react";

export interface ProductionNodeData extends Record<string, unknown> {
  recipeName: string;
  buildingName: string;
  buildingCount: number;
  clockSpeed: number;
  powerMW: number;
  cycleDuration: number;
  inputs: Array<{ itemName: string; ratePerMinute: number; perCycle: number }>;
  outputs: Array<{ itemName: string; ratePerMinute: number; perCycle: number }>;
}

export interface RawResourceNodeData extends Record<string, unknown> {
  itemName: string;
  ratePerMinute: number;
}

export type ProductionGraphNode = Node<ProductionNodeData, "production">;
export type RawResourceGraphNode = Node<RawResourceNodeData, "rawResource">;
export type AppNode = ProductionGraphNode | RawResourceGraphNode;
