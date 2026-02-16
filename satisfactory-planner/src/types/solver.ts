import type { ItemId } from "./item";
import type { BuildingId } from "./building";

export interface ProductionTarget {
  itemId: ItemId;
  ratePerMinute: number;
}

export interface RecipeSelection {
  [itemId: ItemId]: string;
}

export interface SolverInput {
  targets: ProductionTarget[];
  recipeOverrides: RecipeSelection;
}

export interface ProductionNode {
  id: string;
  recipeId: string;
  buildingId: BuildingId;
  buildingCount: number;
  clockSpeed: number;
  inputs: Array<{ itemId: ItemId; ratePerMinute: number }>;
  outputs: Array<{ itemId: ItemId; ratePerMinute: number }>;
  powerMW: number;
}

export interface SolverEdge {
  fromNodeId: string;
  toNodeId: string;
  itemId: ItemId;
  ratePerMinute: number;
}

export interface SolverOutput {
  nodes: ProductionNode[];
  edges: SolverEdge[];
  rawResources: Array<{ itemId: ItemId; ratePerMinute: number }>;
  totalPowerMW: number;
  powerByBuilding: Record<BuildingId, { count: number; totalMW: number }>;
  warnings: string[];
}
