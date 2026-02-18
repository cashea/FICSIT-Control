import type { Edge } from "@xyflow/react";

export interface PowerFlowEdgeData extends Record<string, unknown> {
  powerMW: number;
  utilization: number;
  direction: "generation" | "consumption" | "battery";
}

export type SLDEdge = Edge<PowerFlowEdgeData, "powerFlow">;
