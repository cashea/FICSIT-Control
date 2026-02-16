import { describe, it, expect } from "vitest";
import { solve } from "../solve";

describe("solve", () => {
  it("returns empty output for no targets", () => {
    const result = solve({ targets: [], recipeOverrides: {} });
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.rawResources).toHaveLength(0);
    expect(result.totalPowerMW).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("skips targets with zero or negative rate", () => {
    const result = solve({
      targets: [{ itemId: "iron-plate", ratePerMinute: 0 }],
      recipeOverrides: {},
    });
    expect(result.nodes).toHaveLength(0);
  });

  it("solves a single-target chain (iron-plate)", () => {
    // iron-plate: 20/min → 1x constructor (30 ingot/min → 20 plate/min)
    // iron-ingot: 30/min → 1x smelter (30 ore/min → 30 ingot/min)
    // iron-ore: 30/min raw
    const result = solve({
      targets: [{ itemId: "iron-plate", ratePerMinute: 20 }],
      recipeOverrides: {},
    });

    expect(result.nodes).toHaveLength(2); // constructor + smelter
    expect(result.rawResources).toHaveLength(1);
    expect(result.rawResources[0].itemId).toBe("iron-ore");
    expect(result.rawResources[0].ratePerMinute).toBeCloseTo(30);

    const plateNode = result.nodes.find((n) => n.recipeId === "iron-plate");
    expect(plateNode).toBeDefined();
    expect(plateNode!.buildingCount).toBeCloseTo(1.0);
    expect(plateNode!.buildingId).toBe("constructor");

    const ingotNode = result.nodes.find((n) => n.recipeId === "iron-ingot");
    expect(ingotNode).toBeDefined();
    expect(ingotNode!.buildingCount).toBeCloseTo(1.0);
    expect(ingotNode!.buildingId).toBe("smelter");

    // Power: 1x constructor (4MW) + 1x smelter (4MW) = 8MW
    expect(result.totalPowerMW).toBeCloseTo(8);
    expect(result.warnings).toHaveLength(0);
  });

  it("solves a multi-input recipe (reinforced-iron-plate)", () => {
    // reinforced-iron-plate: 5/min → 1x assembler
    //   needs 30 iron-plate/min → 1.5x constructor → 45 iron-ingot/min
    //   needs 60 screw/min → 1.5x constructor → 15 iron-rod/min → 1x constructor → 15 iron-ingot/min
    // iron-ingot: merged 45 + 15 = 60/min → 2x smelter → 60 iron-ore/min
    const result = solve({
      targets: [{ itemId: "reinforced-iron-plate", ratePerMinute: 5 }],
      recipeOverrides: {},
    });

    // Nodes: reinforced-iron-plate, iron-plate, screw, iron-rod, iron-ingot
    expect(result.nodes).toHaveLength(5);

    const ripNode = result.nodes.find(
      (n) => n.recipeId === "reinforced-iron-plate",
    );
    expect(ripNode!.buildingCount).toBeCloseTo(1.0);
    expect(ripNode!.buildingId).toBe("assembler");

    const plateNode = result.nodes.find((n) => n.recipeId === "iron-plate");
    expect(plateNode!.buildingCount).toBeCloseTo(1.5);

    const screwNode = result.nodes.find((n) => n.recipeId === "screw");
    expect(screwNode!.buildingCount).toBeCloseTo(1.5);

    const rodNode = result.nodes.find((n) => n.recipeId === "iron-rod");
    expect(rodNode!.buildingCount).toBeCloseTo(1.0);

    const ingotNode = result.nodes.find((n) => n.recipeId === "iron-ingot");
    expect(ingotNode!.buildingCount).toBeCloseTo(2.0);

    // Raw: 60 iron-ore/min
    expect(result.rawResources).toHaveLength(1);
    expect(result.rawResources[0].itemId).toBe("iron-ore");
    expect(result.rawResources[0].ratePerMinute).toBeCloseTo(60);

    expect(result.warnings).toHaveLength(0);
  });

  it("handles byproducts and warns about surplus", () => {
    // plastic: 20/min → 1x refinery (30 crude-oil/min → 20 plastic + 10 heavy-oil-residue)
    const result = solve({
      targets: [{ itemId: "plastic", ratePerMinute: 20 }],
      recipeOverrides: {},
    });

    expect(result.nodes).toHaveLength(1);
    expect(result.rawResources).toHaveLength(1);
    expect(result.rawResources[0].itemId).toBe("crude-oil");
    expect(result.rawResources[0].ratePerMinute).toBeCloseTo(30);

    // Should warn about heavy-oil-residue
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(
      result.warnings.some((w) => w.includes("Heavy Oil Residue")),
    ).toBe(true);
  });

  it("uses recipe overrides", () => {
    // Default screw: iron-rod → screw (10 rod/min → 40 screw/min)
    // alt-cast-screw: iron-ingot → screw (12.5 ingot/min → 50 screw/min)
    const result = solve({
      targets: [{ itemId: "screw", ratePerMinute: 50 }],
      recipeOverrides: { screw: "alt-cast-screw" },
    });

    const screwNode = result.nodes.find((n) => n.recipeId === "alt-cast-screw");
    expect(screwNode).toBeDefined();
    expect(screwNode!.buildingCount).toBeCloseTo(1.0);

    // Should need iron-ingot, not iron-rod
    expect(screwNode!.inputs[0].itemId).toBe("iron-ingot");

    // Should chain to smelter → iron-ore
    const ingotNode = result.nodes.find((n) => n.recipeId === "iron-ingot");
    expect(ingotNode).toBeDefined();
  });

  it("merges demand for same item from multiple consumers", () => {
    // iron-plate: 10/min and iron-rod: 15/min both need iron-ingot
    // iron-plate needs 15 iron-ingot/min, iron-rod needs 15 iron-ingot/min
    // Total: 30 iron-ingot/min → 1x smelter
    const result = solve({
      targets: [
        { itemId: "iron-plate", ratePerMinute: 10 },
        { itemId: "iron-rod", ratePerMinute: 15 },
      ],
      recipeOverrides: {},
    });

    // Should have a single merged iron-ingot node
    const ingotNodes = result.nodes.filter((n) => n.recipeId === "iron-ingot");
    expect(ingotNodes).toHaveLength(1);

    // iron-plate needs 15 ingot/min (10/20*30), iron-rod needs 15 ingot/min (15/15*15)
    // Total: 30 iron-ingot/min → 1x smelter
    expect(ingotNodes[0].buildingCount).toBeCloseTo(1.0);
  });

  it("merges duplicate targets for same item", () => {
    const result = solve({
      targets: [
        { itemId: "iron-plate", ratePerMinute: 10 },
        { itemId: "iron-plate", ratePerMinute: 10 },
      ],
      recipeOverrides: {},
    });

    // Should be equivalent to a single 20/min target
    const plateNode = result.nodes.find((n) => n.recipeId === "iron-plate");
    expect(plateNode!.buildingCount).toBeCloseTo(1.0);
  });

  it("calculates total power and power by building", () => {
    const result = solve({
      targets: [{ itemId: "reinforced-iron-plate", ratePerMinute: 5 }],
      recipeOverrides: {},
    });

    // 1x assembler (15MW) + 1.5x constructor (6MW) + 1.5x constructor (6MW)
    // + 1x constructor (4MW) + 2x smelter (8MW) = 39MW
    expect(result.totalPowerMW).toBeCloseTo(39);

    expect(result.powerByBuilding["assembler"]).toBeDefined();
    expect(result.powerByBuilding["assembler"].count).toBeCloseTo(1);
    expect(result.powerByBuilding["assembler"].totalMW).toBeCloseTo(15);

    // 1.5 (plate) + 1.5 (screw) + 1.0 (rod) = 4.0 constructors
    expect(result.powerByBuilding["constructor"].count).toBeCloseTo(4.0);
    expect(result.powerByBuilding["constructor"].totalMW).toBeCloseTo(16);

    expect(result.powerByBuilding["smelter"].count).toBeCloseTo(2.0);
    expect(result.powerByBuilding["smelter"].totalMW).toBeCloseTo(8);
  });

  it("creates edges between nodes", () => {
    const result = solve({
      targets: [{ itemId: "iron-plate", ratePerMinute: 20 }],
      recipeOverrides: {},
    });

    // ingot smelter → plate constructor
    expect(result.edges.length).toBeGreaterThan(0);
    const edge = result.edges.find((e) => e.itemId === "iron-ingot");
    expect(edge).toBeDefined();
    expect(edge!.ratePerMinute).toBeCloseTo(30);
  });

  it("warns about missing recipes", () => {
    // An item that has no recipe (raw resource flag is false but no recipe exists)
    // We'll test with an override pointing to a nonexistent recipe
    const result = solve({
      targets: [{ itemId: "iron-plate", ratePerMinute: 20 }],
      recipeOverrides: { "iron-ingot": "nonexistent-recipe" },
    });

    expect(result.warnings.some((w) => w.includes("Iron Ingot"))).toBe(true);
  });
});
