import { describe, it, expect } from "vitest";
import {
  computeTakt,
  validateTaktPlan,
  resolveActualFromProdStats,
  resolveActualFromMachines,
  computeBeltConstraint,
  getMinBeltCapacity,
} from "../takt";
import type { TaktPlan, TaktStage, FRMProdStat, FRMMachine, FRMBelt } from "../../types";

function makePlan(overrides: Partial<TaktPlan> = {}): TaktPlan {
  return {
    id: "plan-1",
    name: "Test Plan",
    itemId: "IronPlate",
    demandPerMin: 60,
    uptimePct: 100,
    liveSource: { type: "manual" },
    tags: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeProdStat(overrides: Partial<FRMProdStat> = {}): FRMProdStat {
  return {
    Name: "Iron Plate",
    ClassName: "Desc_IronPlate_C",
    ProdPerMin: "0",
    ProdPercent: 0,
    ConsPercent: 0,
    CurrentProd: 0,
    MaxProd: 0,
    CurrentConsumed: 0,
    MaxConsumed: 0,
    Type: "Solid",
    ...overrides,
  };
}

function makeMachine(overrides: Partial<FRMMachine> = {}): FRMMachine {
  return {
    Name: "Constructor",
    ClassName: "Build_ConstructorMk1_C",
    location: { x: 100, y: 200, z: 300 },
    Recipe: "Iron Plate",
    RecipeClassName: "Recipe_IronPlate_C",
    Production: [],
    Ingredients: [],
    IsProducing: true,
    IsPaused: false,
    CircuitGroupID: 0,
    PowerInfo: { CircuitGroupID: 0, PowerConsumed: 4, MaxPowerConsumed: 4 },
    ...overrides,
  };
}

function makeBelt(overrides: Partial<FRMBelt> = {}): FRMBelt {
  return {
    ID: "Build_ConveyorBeltMk1_C_1",
    Name: "Conveyor Belt Mk.1",
    ClassName: "Build_ConveyorBeltMk1_C",
    location0: { x: 0, y: 0, z: 0 },
    Connected0: true,
    location1: { x: 100, y: 0, z: 0 },
    Connected1: true,
    Length: 100,
    ItemsPerMinute: 60,
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

  // Belt constraint integration
  it("includes beltConstraint when beltCapacity param is provided", () => {
    const result = computeTakt(makePlan({ demandPerMin: 60 }), undefined, 120);

    expect(result.beltConstraint).toBeDefined();
    expect(result.beltConstraint!.beltCapacity).toBe(120);
    expect(result.beltConstraint!.exceeded).toBe(false);
    expect(result.beltConstraint!.headroom).toBe(60); // 120 - 60
  });

  it("uses beltCapacity param over plan.beltCapacity", () => {
    const result = computeTakt(
      makePlan({ demandPerMin: 60, beltCapacity: 120 }),
      undefined,
      270,
    );

    expect(result.beltConstraint!.beltCapacity).toBe(270);
  });

  it("falls back to plan.beltCapacity when param is omitted", () => {
    const result = computeTakt(
      makePlan({ demandPerMin: 60, beltCapacity: 120 }),
    );

    expect(result.beltConstraint).toBeDefined();
    expect(result.beltConstraint!.beltCapacity).toBe(120);
  });

  it("returns no beltConstraint when no capacity is known", () => {
    const result = computeTakt(makePlan());
    expect(result.beltConstraint).toBeUndefined();
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

describe("resolveActualFromProdStats", () => {
  it("resolves CurrentProd for a matching item", () => {
    const stats = [makeProdStat({ Name: "Iron Plate", CurrentProd: 42.5 })];
    expect(resolveActualFromProdStats("IronPlate", stats)).toBe(42.5);
  });

  it("returns undefined when no matching item exists", () => {
    const stats = [makeProdStat({ Name: "Copper Ingot", CurrentProd: 30 })];
    expect(resolveActualFromProdStats("IronPlate", stats)).toBeUndefined();
  });

  it("sums CurrentProd across multiple matching entries", () => {
    const stats = [
      makeProdStat({ Name: "Iron Plate", CurrentProd: 20 }),
      makeProdStat({ Name: "Iron Plate", CurrentProd: 40 }),
    ];
    expect(resolveActualFromProdStats("IronPlate", stats)).toBe(60);
  });

  it("handles empty prodStats array", () => {
    expect(resolveActualFromProdStats("IronPlate", [])).toBeUndefined();
  });

  it("ignores non-matching items in mixed list", () => {
    const stats = [
      makeProdStat({ Name: "Iron Plate", CurrentProd: 30 }),
      makeProdStat({ Name: "Iron Rod", CurrentProd: 60 }),
    ];
    expect(resolveActualFromProdStats("IronPlate", stats)).toBe(30);
  });
});

describe("resolveActualFromMachines", () => {
  it("sums CurrentProd from selected machines matching itemId", () => {
    const m1 = makeMachine({
      location: { x: 1, y: 2, z: 3 },
      Production: [{ Name: "Iron Plate", ClassName: "Desc_IronPlate_C", Amount: 1, CurrentProd: 20, MaxProd: 20, ProdPercent: 100 }],
    });
    const m2 = makeMachine({
      location: { x: 4, y: 5, z: 6 },
      Production: [{ Name: "Iron Plate", ClassName: "Desc_IronPlate_C", Amount: 1, CurrentProd: 15, MaxProd: 20, ProdPercent: 75 }],
    });

    const machines = { getConstructor: [m1, m2] };
    const keys = [
      `${m1.ClassName}@${m1.location.x},${m1.location.y},${m1.location.z}`,
      `${m2.ClassName}@${m2.location.x},${m2.location.y},${m2.location.z}`,
    ];

    expect(resolveActualFromMachines("IronPlate", machines, keys)).toBe(35);
  });

  it("ignores machines not in the selected keys", () => {
    const m1 = makeMachine({
      location: { x: 1, y: 2, z: 3 },
      Production: [{ Name: "Iron Plate", ClassName: "Desc_IronPlate_C", Amount: 1, CurrentProd: 20, MaxProd: 20, ProdPercent: 100 }],
    });
    const m2 = makeMachine({
      location: { x: 4, y: 5, z: 6 },
      Production: [{ Name: "Iron Plate", ClassName: "Desc_IronPlate_C", Amount: 1, CurrentProd: 15, MaxProd: 20, ProdPercent: 75 }],
    });

    const machines = { getConstructor: [m1, m2] };
    const keys = [`${m1.ClassName}@${m1.location.x},${m1.location.y},${m1.location.z}`];

    expect(resolveActualFromMachines("IronPlate", machines, keys)).toBe(20);
  });

  it("returns undefined when no machines match the keys", () => {
    const m1 = makeMachine({
      location: { x: 1, y: 2, z: 3 },
      Production: [{ Name: "Iron Plate", ClassName: "Desc_IronPlate_C", Amount: 1, CurrentProd: 20, MaxProd: 20, ProdPercent: 100 }],
    });

    const machines = { getConstructor: [m1] };
    expect(resolveActualFromMachines("IronPlate", machines, ["nonexistent@0,0,0"])).toBeUndefined();
  });

  it("returns undefined when machines match keys but not itemId", () => {
    const m1 = makeMachine({
      location: { x: 1, y: 2, z: 3 },
      Production: [{ Name: "Iron Rod", ClassName: "Desc_IronRod_C", Amount: 1, CurrentProd: 20, MaxProd: 20, ProdPercent: 100 }],
    });

    const machines = { getConstructor: [m1] };
    const keys = [`${m1.ClassName}@${m1.location.x},${m1.location.y},${m1.location.z}`];

    expect(resolveActualFromMachines("IronPlate", machines, keys)).toBeUndefined();
  });

  it("handles empty machines record", () => {
    expect(resolveActualFromMachines("IronPlate", {}, ["key@0,0,0"])).toBeUndefined();
  });
});

describe("computeBeltConstraint", () => {
  it("returns not exceeded when capacity exceeds demand", () => {
    const result = computeBeltConstraint(60, 120);
    expect(result).toEqual({
      beltCapacity: 120,
      exceeded: false,
      headroom: 60,
    });
  });

  it("returns exceeded when demand exceeds capacity", () => {
    const result = computeBeltConstraint(120, 60);
    expect(result).toEqual({
      beltCapacity: 60,
      exceeded: true,
      headroom: -60,
    });
  });

  it("returns not exceeded when demand exactly equals capacity", () => {
    const result = computeBeltConstraint(60, 60);
    expect(result).toEqual({
      beltCapacity: 60,
      exceeded: false,
      headroom: 0,
    });
  });

  it("returns undefined when beltCapacity is undefined", () => {
    expect(computeBeltConstraint(60, undefined)).toBeUndefined();
  });

  it("returns undefined when beltCapacity is 0", () => {
    expect(computeBeltConstraint(60, 0)).toBeUndefined();
  });
});

describe("getMinBeltCapacity", () => {
  it("returns the minimum capacity from connected belts", () => {
    const belts = [
      makeBelt({ ItemsPerMinute: 120 }),
      makeBelt({ ItemsPerMinute: 60 }),
      makeBelt({ ItemsPerMinute: 270 }),
    ];
    expect(getMinBeltCapacity(belts)).toBe(60);
  });

  it("skips disconnected belts", () => {
    const belts = [
      makeBelt({ ItemsPerMinute: 30, Connected0: false }),
      makeBelt({ ItemsPerMinute: 120 }),
      makeBelt({ ItemsPerMinute: 60, Connected1: false }),
    ];
    expect(getMinBeltCapacity(belts)).toBe(120);
  });

  it("returns undefined for empty array", () => {
    expect(getMinBeltCapacity([])).toBeUndefined();
  });

  it("returns undefined when all belts are disconnected", () => {
    const belts = [
      makeBelt({ Connected0: false }),
      makeBelt({ Connected1: false }),
    ];
    expect(getMinBeltCapacity(belts)).toBeUndefined();
  });

  it("returns single belt capacity when only one connected belt", () => {
    const belts = [makeBelt({ ItemsPerMinute: 480 })];
    expect(getMinBeltCapacity(belts)).toBe(480);
  });
});
