import type { Edge } from "@xyflow/react";

export interface RecipeFlowEdgeData extends Record<string, unknown> {
  itemName: string;
  itemId: string;
}

export type RecipeTreeEdge = Edge<RecipeFlowEdgeData, "recipeFlow">;
