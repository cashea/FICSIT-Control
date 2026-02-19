import type { TaktPlan, TaktStage, TaktResult, BeltConstraint, FRMProdStat, FRMMachine, FRMBelt } from "../types";
import { machineKey } from "../utils/machine-id";
import { resolveItemName } from "../utils/frm-name-map";

/**
 * Compute takt time results from a plan and optional stages.
 * Pure function — all formulas per SPEC section 4.
 */
export function computeTakt(
  plan: TaktPlan,
  stages?: TaktStage[],
  beltCapacity?: number,
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

  result.beltConstraint = computeBeltConstraint(
    effectiveDemandPerMin,
    beltCapacity ?? plan.beltCapacity,
  );

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

/**
 * Resolve actualPerMin from factory-wide production stats.
 * Matches the plan's itemId against FRMProdStat entries via resolveItemName.
 * Returns the sum of CurrentProd for all matching entries, or undefined if no match.
 */
export function resolveActualFromProdStats(
  itemId: string,
  prodStats: FRMProdStat[],
): number | undefined {
  let total = 0;
  let found = false;
  for (const stat of prodStats) {
    const resolved = resolveItemName(stat.Name);
    if (resolved === itemId) {
      total += stat.CurrentProd;
      found = true;
    }
  }
  return found ? total : undefined;
}

/**
 * Resolve actualPerMin from a specific set of machines (machine-group source).
 * Sums CurrentProd from each machine's Production array for outputs matching itemId.
 */
export function resolveActualFromMachines(
  itemId: string,
  allMachines: Record<string, FRMMachine[]>,
  machineKeys: string[],
): number | undefined {
  const keySet = new Set(machineKeys);
  let total = 0;
  let found = false;

  for (const machines of Object.values(allMachines)) {
    for (const m of machines) {
      const key = machineKey(m);
      if (!keySet.has(key)) continue;

      for (const prod of m.Production) {
        const resolved = resolveItemName(prod.Name);
        if (resolved === itemId) {
          total += prod.CurrentProd;
          found = true;
        }
      }
    }
  }
  return found ? total : undefined;
}

/**
 * Compute belt constraint info.
 * Compares effectiveDemandPerMin against a belt capacity ceiling.
 * Returns undefined if no belt capacity is known.
 */
export function computeBeltConstraint(
  effectiveDemandPerMin: number,
  beltCapacity: number | undefined,
): BeltConstraint | undefined {
  if (beltCapacity == null || beltCapacity <= 0) return undefined;
  const headroom = beltCapacity - effectiveDemandPerMin;
  return {
    beltCapacity,
    exceeded: headroom < 0,
    headroom,
  };
}

/**
 * Find the minimum belt capacity from a list of belts.
 * Represents the bottleneck — the slowest belt constrains throughput.
 * Only considers belts that are connected on both ends.
 */
export function getMinBeltCapacity(belts: FRMBelt[]): number | undefined {
  let min: number | undefined;
  for (const belt of belts) {
    if (!belt.Connected0 || !belt.Connected1) continue;
    if (min === undefined || belt.ItemsPerMinute < min) {
      min = belt.ItemsPerMinute;
    }
  }
  return min;
}
