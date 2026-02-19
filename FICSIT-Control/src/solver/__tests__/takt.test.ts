import { describe, it, expect } from "vitest";
import { computeTakt, validateTaktPlan } from "../takt";
import type { TaktPlan, TaktStage } from "../../types";

function makePlan(overrides: Partial<TaktPlan> = {}): TaktPlan {
  return {
    id: "plan-1",
    name: "Test Plan",
    itemId: "IronPlate",
    demandPerMin: 60,
    uptimePct: 100,
    tags: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeTakt", () => {
  // AC-1: Valid demand computes takt time
  it("computes basic takt time at 100% uptime", () => {
    const result = computeTakt(makePlan({ demandPerMin: 60 }));

    expect(result.uptimeFraction).toBe(1);
    expect(result.effectiveDemandPerMin).toBe(60);
    expect(result.taktSecPerItem).toBe(1); // 60 / 60
    expect(result.actualCycleSecPerItem).toBeUndefined();
    expect(result.deltaPerMin).toBeUndefined();
    expect(result.compliance).toBeUndefined();
    expect(result.flaggedStages).toHaveLength(0);
  });

  // AC-2: Changing uptime updates takt
  it("adjusts takt for uptime < 100%", () => {
    const result = computeTakt(makePlan({ demandPerMin: 60, uptimePct: 80 }));

    expect(result.uptimeFraction).toBe(0.8);
    expect(result.effectiveDemandPerMin).toBe(75); // 60 / 0.8
    expect(result.taktSecPerItem).toBeCloseTo(0.8); // 60 / 75
  });

  // AC-3: Providing actual throughput computes compliance and delta
  it("computes compliance pass when actual exceeds demand", () => {
    const result = computeTakt(
      makePlan({ demandPerMin: 60, actualPerMin: 80 }),
    );

    expect(result.actualCycleSecPerItem).toBe(0.75); // 60 / 80
    expect(result.deltaPerMin).toBe(20); // 80 - 60
    expect(result.compliance).toBe(true);
  });

  it("computes compliance fail when actual is below demand", () => {
    const result = computeTakt(
      makePlan({ demandPerMin: 60, actualPerMin: 40 }),
    );

    expect(result.actualCycleSecPerItem).toBe(1.5); // 60 / 40
    expect(result.deltaPerMin).toBe(-20); // 40 - 60
    expect(result.compliance).toBe(false);
  });

  it("computes compliance considering uptime-adjusted takt", () => {
    // demand=60, uptime=50% → effective=120, takt=0.5 sec/item
    // actual=100 → cycle=0.6 sec/item → FAIL (0.6 > 0.5)
    const result = computeTakt(
      makePlan({ demandPerMin: 60, uptimePct: 50, actualPerMin: 100 }),
    );

    expect(result.taktSecPerItem).toBeCloseTo(0.5);
    expect(result.actualCycleSecPerItem).toBeCloseTo(0.6);
    expect(result.compliance).toBe(false);
    // Delta is vs raw demand, not effective
    expect(result.deltaPerMin).toBe(40); // 100 - 60
  });

  // AC-4: Over-takt stages are flagged
  it("flags stages that exceed takt time", () => {
    const plan = makePlan({ demandPerMin: 60 }); // takt = 1 sec/item
    const stages: TaktStage[] = [
      { id: "s1", planId: "plan-1", name: "Smelting", timeSec: 0.5, order: 0 },
      { id: "s2", planId: "plan-1", name: "Assembly", timeSec: 1.5, order: 1 },
      { id: "s3", planId: "plan-1", name: "Packing", timeSec: 1.0, order: 2 },
    ];

    const result = computeTakt(plan, stages);

    expect(result.flaggedStages).toEqual(["s2"]); // only Assembly exceeds 1 sec
  });

  it("returns empty flaggedStages when no stages provided", () => {
    const result = computeTakt(makePlan());
    expect(result.flaggedStages).toHaveLength(0);
  });

  it("returns empty flaggedStages when all stages are within takt", () => {
    const plan = makePlan({ demandPerMin: 30 }); // takt = 2 sec/item
    const stages: TaktStage[] = [
      { id: "s1", planId: "plan-1", name: "Step 1", timeSec: 1.5, order: 0 },
      { id: "s2", planId: "plan-1", name: "Step 2", timeSec: 2.0, order: 1 },
    ];

    const result = computeTakt(plan, stages);
    expect(result.flaggedStages).toHaveLength(0);
  });

  // Edge cases (spec section 9)
  it("handles uptimePct = 100 (effective demand equals demand)", () => {
    const result = computeTakt(makePlan({ demandPerMin: 30, uptimePct: 100 }));
    expect(result.effectiveDemandPerMin).toBe(30);
  });

  it("handles very low uptime", () => {
    const result = computeTakt(makePlan({ demandPerMin: 60, uptimePct: 1 }));
    expect(result.effectiveDemandPerMin).toBe(6000); // 60 / 0.01
    expect(result.taktSecPerItem).toBeCloseTo(0.01);
  });

  it("handles takt < 1 sec/item", () => {
    const result = computeTakt(makePlan({ demandPerMin: 120 }));
    expect(result.taktSecPerItem).toBe(0.5); // 60 / 120
  });

  it("hides compliance and delta when actual is omitted", () => {
    const result = computeTakt(makePlan());
    expect(result.actualCycleSecPerItem).toBeUndefined();
    expect(result.deltaPerMin).toBeUndefined();
    expect(result.compliance).toBeUndefined();
  });
});

describe("validateTaktPlan", () => {
  it("returns no errors for a valid plan", () => {
    const errors = validateTaktPlan(makePlan());
    expect(errors).toHaveLength(0);
  });

  it("rejects demandPerMin <= 0", () => {
    expect(validateTaktPlan(makePlan({ demandPerMin: 0 }))).toContain(
      "Demand must be greater than 0",
    );
    expect(validateTaktPlan(makePlan({ demandPerMin: -5 }))).toContain(
      "Demand must be greater than 0",
    );
  });

  it("rejects uptimePct outside 1–100", () => {
    expect(validateTaktPlan(makePlan({ uptimePct: 0 }))).toContain(
      "Uptime must be between 1% and 100%",
    );
    expect(validateTaktPlan(makePlan({ uptimePct: 101 }))).toContain(
      "Uptime must be between 1% and 100%",
    );
  });

  it("rejects actualPerMin <= 0 when provided", () => {
    expect(validateTaktPlan(makePlan({ actualPerMin: 0 }))).toContain(
      "Actual throughput must be greater than 0",
    );
    expect(validateTaktPlan(makePlan({ actualPerMin: -1 }))).toContain(
      "Actual throughput must be greater than 0",
    );
  });

  it("allows actualPerMin to be omitted", () => {
    const errors = validateTaktPlan(makePlan());
    expect(errors).toHaveLength(0);
  });

  it("requires plan name", () => {
    expect(validateTaktPlan(makePlan({ name: "" }))).toContain(
      "Plan name is required",
    );
    expect(validateTaktPlan({ demandPerMin: 60, uptimePct: 100 })).toContain(
      "Plan name is required",
    );
  });

  it("requires itemId", () => {
    expect(validateTaktPlan(makePlan({ itemId: "" }))).toContain(
      "Item is required",
    );
  });

  it("returns multiple errors at once", () => {
    const errors = validateTaktPlan({
      demandPerMin: -1,
      uptimePct: 0,
      actualPerMin: -1,
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
