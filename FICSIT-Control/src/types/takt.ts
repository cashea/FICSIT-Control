import type { ItemId } from "./item";

export type TaktPlanId = string;

export interface TaktPlan {
  id: TaktPlanId;
  name: string;
  itemId: ItemId;
  demandPerMin: number;
  uptimePct: number; // 1–100, default 100
  actualPerMin?: number;
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

export interface TaktResult {
  uptimeFraction: number;
  effectiveDemandPerMin: number;
  taktSecPerItem: number;
  actualCycleSecPerItem?: number;
  deltaPerMin?: number;
  compliance?: boolean;
  flaggedStages: string[]; // stage IDs where timeSec > taktSecPerItem
}
