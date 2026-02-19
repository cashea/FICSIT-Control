import type { ItemId } from "./item";

export type TaktPlanId = string;

/** How actualPerMin is sourced */
export type TaktLiveSource =
  | { type: "manual" }
  | { type: "production-stats" }
  | { type: "machine-group"; machineKeys: string[] };

export interface TaktPlan {
  id: TaktPlanId;
  name: string;
  itemId: ItemId;
  demandPerMin: number;
  uptimePct: number; // 1–100, default 100
  actualPerMin?: number;
  liveSource: TaktLiveSource; // default { type: "manual" }
  beltCapacity?: number; // optional belt ceiling override (items/min)
  notes?: string;
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface TaktStage {
  id: string;
  planId: TaktPlanId;
  name: string;
  timeSec: number;
  order: number;
  notes?: string;
}

export interface BeltConstraint {
  beltCapacity: number; // items/min ceiling
  exceeded: boolean; // effectiveDemandPerMin > beltCapacity
  headroom: number; // beltCapacity - effectiveDemandPerMin (negative if exceeded)
}

export interface TaktResult {
  uptimeFraction: number;
  effectiveDemandPerMin: number;
  taktSecPerItem: number;
  actualCycleSecPerItem?: number;
  deltaPerMin?: number;
  compliance?: boolean;
  flaggedStages: string[]; // stage IDs where timeSec > taktSecPerItem
  beltConstraint?: BeltConstraint;
}
