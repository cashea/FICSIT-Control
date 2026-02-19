import type { TaktPlan, TaktStage, TaktResult } from "../types";

/**
 * Compute takt time results from a plan and optional stages.
 * Pure function — all formulas per SPEC section 4.
 */
export function computeTakt(
  plan: TaktPlan,
  stages?: TaktStage[],
): TaktResult {
  const uptimeFraction = plan.uptimePct / 100;
  const effectiveDemandPerMin = plan.demandPerMin / uptimeFraction;
  const taktSecPerItem = 60 / effectiveDemandPerMin;

  const result: TaktResult = {
    uptimeFraction,
    effectiveDemandPerMin,
    taktSecPerItem,
    flaggedStages: [],
  };

  if (plan.actualPerMin != null && plan.actualPerMin > 0) {
    result.actualCycleSecPerItem = 60 / plan.actualPerMin;
    result.deltaPerMin = plan.actualPerMin - plan.demandPerMin;
    result.compliance = result.actualCycleSecPerItem <= taktSecPerItem;
  }

  if (stages && stages.length > 0) {
    result.flaggedStages = stages
      .filter((s) => s.timeSec > taktSecPerItem)
      .map((s) => s.id);
  }

  return result;
}

/** Validate a partial plan, returning an array of error messages. */
export function validateTaktPlan(
  plan: Partial<TaktPlan>,
): string[] {
  const errors: string[] = [];

  if (plan.demandPerMin == null || plan.demandPerMin <= 0) {
    errors.push("Demand must be greater than 0");
  }

  if (plan.uptimePct == null || plan.uptimePct < 1 || plan.uptimePct > 100) {
    errors.push("Uptime must be between 1% and 100%");
  }

  if (plan.actualPerMin != null && plan.actualPerMin <= 0) {
    errors.push("Actual throughput must be greater than 0");
  }

  if (!plan.name || plan.name.trim().length === 0) {
    errors.push("Plan name is required");
  }

  if (!plan.itemId || plan.itemId.trim().length === 0) {
    errors.push("Item is required");
  }

  return errors;
}
