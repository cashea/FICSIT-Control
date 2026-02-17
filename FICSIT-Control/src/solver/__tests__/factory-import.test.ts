import { describe, it, expect } from "vitest";
import {
  detectNetOutputs,
  detectRecipeOverrides,
  importFactory,
} from "../factory-import";
import type { FRMProdStat, FRMMachine } from "../../types";

function makeProdStat(overrides: Partial<FRMProdStat>): FRMProdStat {
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
    Type: "solid",
    ...overrides,
  };
}

function makeMachine(overrides: Partial<FRMMachine>): FRMMachine {
  return {
    Name: "Constructor",
    ClassName: "Build_ConstructorMk1_C",
    location: { x: 0, y: 0, z: 0 },
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

describe("detectNetOutputs", () => {
  it("detects items with net positive production", () => {
    const stats = [
      makeProdStat({ Name: "Iron Plate", MaxProd: 60, MaxConsumed: 0 }),
      makeProdStat({ Name: "Iron Ingot", MaxProd: 90, MaxConsumed: 90 }),
    ];
    const { targets } = detectNetOutputs(stats);
    expect(targets).toHaveLength(1);
    expect(targets[0].itemId).toBe("iron-plate");
    expect(targets[0].ratePerMinute).toBe(60);
  });

  it("detects partial net output (production minus consumption)", () => {
    const stats = [
      makeProdStat({ Name: "Screw", MaxProd: 200, MaxConsumed: 160 }),
    ];
    const { targets } = detectNetOutputs(stats);
    expect(targets).toHaveLength(1);
    expect(targets[0].ratePerMinute).toBeCloseTo(40);
  });

  it("skips raw resources", () => {
    const stats = [
      makeProdStat({ Name: "Iron Ore", MaxProd: 120, MaxConsumed: 90 }),
    ];
    const { targets } = detectNetOutputs(stats);
    expect(targets).toHaveLength(0);
  });

  it("skips items with no net production", () => {
    const stats = [
      makeProdStat({ Name: "Wire", MaxProd: 30, MaxConsumed: 30 }),
      makeProdStat({ Name: "Cable", MaxProd: 0, MaxConsumed: 0 }),
    ];
    const { targets } = detectNetOutputs(stats);
    expect(targets).toHaveLength(0);
  });

  it("reports unmapped items in warnings", () => {
    const stats = [
      makeProdStat({ Name: "Alien DNA", MaxProd: 10, MaxConsumed: 0 }),
    ];
    const { targets, unmapped, warnings } = detectNetOutputs(stats);
    expect(targets).toHaveLength(0);
    expect(unmapped).toContain("Alien DNA");
    expect(warnings[0]).toContain("Alien DNA");
  });

  it("sets rate input mode on imported targets", () => {
    const stats = [
      makeProdStat({ Name: "Iron Plate", MaxProd: 20, MaxConsumed: 0 }),
    ];
    const { targets } = detectNetOutputs(stats);
    expect(targets[0].inputMode).toBe("rate");
    expect(targets[0].inputValue).toBe(20);
  });
});

describe("detectRecipeOverrides", () => {
  it("detects alternate recipes in use", () => {
    const machines = [
      makeMachine({ Recipe: "Cast Screw" }),
      makeMachine({ Recipe: "Cast Screw" }),
    ];
    const { overrides } = detectRecipeOverrides(machines);
    expect(overrides["screw"]).toBe("alt-cast-screw");
  });

  it("does not override when default recipe is used", () => {
    const machines = [makeMachine({ Recipe: "Iron Plate" })];
    const { overrides } = detectRecipeOverrides(machines);
    expect(overrides["iron-plate"]).toBeUndefined();
  });

  it("uses majority recipe when mixed", () => {
    const machines = [
      makeMachine({ Recipe: "Screw" }),
      makeMachine({ Recipe: "Cast Screw" }),
      makeMachine({ Recipe: "Cast Screw" }),
    ];
    const { overrides } = detectRecipeOverrides(machines);
    expect(overrides["screw"]).toBe("alt-cast-screw");
  });

  it("skips machines with no recipe", () => {
    const machines = [
      makeMachine({ Recipe: "" }),
      makeMachine({ Recipe: "None" }),
    ];
    const { overrides } = detectRecipeOverrides(machines);
    expect(Object.keys(overrides)).toHaveLength(0);
  });
});

describe("importFactory", () => {
  it("produces a complete import result", () => {
    const stats = [
      makeProdStat({ Name: "Iron Plate", MaxProd: 60, MaxConsumed: 0 }),
      makeProdStat({ Name: "Iron Ingot", MaxProd: 90, MaxConsumed: 90 }),
    ];
    const machines = [makeMachine({ Recipe: "Iron Plate" })];
    const result = importFactory(stats, machines);

    expect(result.input.targets).toHaveLength(1);
    expect(result.input.targets[0].itemId).toBe("iron-plate");
    expect(result.detectedOutputs).toHaveLength(1);
    expect(result.detectedOutputs[0].name).toBe("Iron Plate");
  });

  it("combines targets and recipe overrides", () => {
    const stats = [
      makeProdStat({ Name: "Screw", MaxProd: 200, MaxConsumed: 0 }),
    ];
    const machines = [
      makeMachine({ Recipe: "Cast Screw" }),
      makeMachine({ Recipe: "Cast Screw" }),
    ];
    const result = importFactory(stats, machines);

    expect(result.input.targets[0].itemId).toBe("screw");
    expect(result.input.recipeOverrides["screw"]).toBe("alt-cast-screw");
  });

  it("handles empty factory data", () => {
    const result = importFactory([], []);
    expect(result.input.targets).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
