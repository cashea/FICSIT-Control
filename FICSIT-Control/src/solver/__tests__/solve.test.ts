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
      targets: [{ itemId: "IronPlate", ratePerMinute: 0 }],
      recipeOverrides: {},
    });
    expect(result.nodes).toHaveLength(0);
  });

  it("solves a single-target chain (IronPlate)", () => {
    // IronPlate: 20/min → 1x ConstructorMk1 (30 ingot/min → 20 plate/min)
    // IronIngot: 30/min → 1x SmelterMk1 (30 ore/min → 30 ingot/min)
    // OreIron: 30/min raw
    const result = solve({
      targets: [{ itemId: "IronPlate", ratePerMinute: 20 }],
      recipeOverrides: {},
    });

    expect(result.nodes).toHaveLength(2); // constructor + smelter
    expect(result.rawResources).toHaveLength(1);
    expect(result.rawResources[0].itemId).toBe("OreIron");
    expect(result.rawResources[0].ratePerMinute).toBeCloseTo(30);

    const plateNode = result.nodes.find((n) => n.recipeId === "IronPlate");
    expect(plateNode).toBeDefined();
    expect(plateNode!.buildingCount).toBeCloseTo(1.0);
    expect(plateNode!.buildingId).toBe("ConstructorMk1");

    const ingotNode = result.nodes.find((n) => n.recipeId === "IngotIron");
    expect(ingotNode).toBeDefined();
    expect(ingotNode!.buildingCount).toBeCloseTo(1.0);
    expect(ingotNode!.buildingId).toBe("SmelterMk1");

    // Power: 1x ConstructorMk1 (4MW) + 1x SmelterMk1 (4MW) = 8MW
    expect(result.totalPowerMW).toBeCloseTo(8);
    expect(result.warnings).toHaveLength(0);
  });

  it("solves a multi-input recipe (IronPlateReinforced)", () => {
    // IronPlateReinforced: 5/min → 1x AssemblerMk1
    //   needs 30 IronPlate/min → 1.5x ConstructorMk1 → 45 IronIngot/min
    //   needs 60 IronScrew/min → 1.5x ConstructorMk1 → 15 IronRod/min → 1x ConstructorMk1 → 15 IronIngot/min
    // IronIngot: merged 45 + 15 = 60/min → 2x SmelterMk1 → 60 OreIron/min
    const result = solve({
      targets: [{ itemId: "IronPlateReinforced", ratePerMinute: 5 }],
      recipeOverrides: {},
    });

    // Nodes: IronPlateReinforced, IronPlate, Screw, IronRod, IngotIron
    expect(result.nodes).toHaveLength(5);

    const ripNode = result.nodes.find(
      (n) => n.recipeId === "IronPlateReinforced",
    );
    expect(ripNode!.buildingCount).toBeCloseTo(1.0);
    expect(ripNode!.buildingId).toBe("AssemblerMk1");

    const plateNode = result.nodes.find((n) => n.recipeId === "IronPlate");
    expect(plateNode!.buildingCount).toBeCloseTo(1.5);

    const screwNode = result.nodes.find((n) => n.recipeId === "Screw");
    expect(screwNode!.buildingCount).toBeCloseTo(1.5);

    const rodNode = result.nodes.find((n) => n.recipeId === "IronRod");
    expect(rodNode!.buildingCount).toBeCloseTo(1.0);

    const ingotNode = result.nodes.find((n) => n.recipeId === "IngotIron");
    expect(ingotNode!.buildingCount).toBeCloseTo(2.0);

    // Raw: 60 OreIron/min
    expect(result.rawResources).toHaveLength(1);
    expect(result.rawResources[0].itemId).toBe("OreIron");
    expect(result.rawResources[0].ratePerMinute).toBeCloseTo(60);

    expect(result.warnings).toHaveLength(0);
  });

  it("handles byproducts and warns about surplus", () => {
    // Plastic: 20/min → 1x OilRefinery (30 LiquidOil/min → 20 Plastic + 10 HeavyOilResidue)
    const result = solve({
      targets: [{ itemId: "Plastic", ratePerMinute: 20 }],
      recipeOverrides: {},
    });

    expect(result.nodes).toHaveLength(1);
    expect(result.rawResources).toHaveLength(1);
    expect(result.rawResources[0].itemId).toBe("LiquidOil");
    expect(result.rawResources[0].ratePerMinute).toBeCloseTo(30);

    // Should warn about HeavyOilResidue
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(
      result.warnings.some((w) => w.includes("Heavy Oil Residue")),
    ).toBe(true);
  });

  it("uses recipe overrides", () => {
    // Default Screw: IronRod → IronScrew (10 rod/min → 40 screw/min)
    // Alternate_Screw (Cast Screws): IronIngot → IronScrew (12.5 ingot/min → 50 screw/min)
    const result = solve({
      targets: [{ itemId: "IronScrew", ratePerMinute: 50 }],
      recipeOverrides: { IronScrew: "Alternate_Screw" },
    });

    const screwNode = result.nodes.find(
      (n) => n.recipeId === "Alternate_Screw",
    );
    expect(screwNode).toBeDefined();
    expect(screwNode!.buildingCount).toBeCloseTo(1.0);

    // Should need IronIngot, not IronRod
    expect(screwNode!.inputs[0].itemId).toBe("IronIngot");

    // Should chain to SmelterMk1 → OreIron
    const ingotNode = result.nodes.find((n) => n.recipeId === "IngotIron");
    expect(ingotNode).toBeDefined();
  });

  it("merges demand for same item from multiple consumers", () => {
    // IronPlate: 10/min and IronRod: 15/min both need IronIngot
    // IronPlate needs 15 IronIngot/min, IronRod needs 15 IronIngot/min
    // Total: 30 IronIngot/min → 1x SmelterMk1
    const result = solve({
      targets: [
        { itemId: "IronPlate", ratePerMinute: 10 },
        { itemId: "IronRod", ratePerMinute: 15 },
      ],
      recipeOverrides: {},
    });

    // Should have a single merged IronIngot node
    const ingotNodes = result.nodes.filter((n) => n.recipeId === "IngotIron");
    expect(ingotNodes).toHaveLength(1);

    // IronPlate needs 15 ingot/min (10/20*30), IronRod needs 15 ingot/min (15/15*15)
    // Total: 30 IronIngot/min → 1x SmelterMk1
    expect(ingotNodes[0].buildingCount).toBeCloseTo(1.0);
  });

  it("merges duplicate targets for same item", () => {
    const result = solve({
      targets: [
        { itemId: "IronPlate", ratePerMinute: 10 },
        { itemId: "IronPlate", ratePerMinute: 10 },
      ],
      recipeOverrides: {},
    });

    // Should be equivalent to a single 20/min target
    const plateNode = result.nodes.find((n) => n.recipeId === "IronPlate");
    expect(plateNode!.buildingCount).toBeCloseTo(1.0);
  });

  it("calculates total power and power by building", () => {
    const result = solve({
      targets: [{ itemId: "IronPlateReinforced", ratePerMinute: 5 }],
      recipeOverrides: {},
    });

    // 1x AssemblerMk1 (15MW) + 1.5x ConstructorMk1 (6MW) + 1.5x ConstructorMk1 (6MW)
    // + 1x ConstructorMk1 (4MW) + 2x SmelterMk1 (8MW) = 39MW
    expect(result.totalPowerMW).toBeCloseTo(39);

    expect(result.powerByBuilding["AssemblerMk1"]).toBeDefined();
    expect(result.powerByBuilding["AssemblerMk1"].count).toBeCloseTo(1);
    expect(result.powerByBuilding["AssemblerMk1"].totalMW).toBeCloseTo(15);

    // 1.5 (plate) + 1.5 (screw) + 1.0 (rod) = 4.0 constructors
    expect(result.powerByBuilding["ConstructorMk1"].count).toBeCloseTo(4.0);
    expect(result.powerByBuilding["ConstructorMk1"].totalMW).toBeCloseTo(16);

    expect(result.powerByBuilding["SmelterMk1"].count).toBeCloseTo(2.0);
    expect(result.powerByBuilding["SmelterMk1"].totalMW).toBeCloseTo(8);
  });

  it("creates edges between nodes", () => {
    const result = solve({
      targets: [{ itemId: "IronPlate", ratePerMinute: 20 }],
      recipeOverrides: {},
    });

    // IngotIron SmelterMk1 → IronPlate ConstructorMk1
    expect(result.edges.length).toBeGreaterThan(0);
    const edge = result.edges.find((e) => e.itemId === "IronIngot");
    expect(edge).toBeDefined();
    expect(edge!.ratePerMinute).toBeCloseTo(30);
  });

  it("warns about missing recipes", () => {
    // An item that has no recipe (raw resource flag is false but no recipe exists)
    // We'll test with an override pointing to a nonexistent recipe
    const result = solve({
      targets: [{ itemId: "IronPlate", ratePerMinute: 20 }],
      recipeOverrides: { IronIngot: "nonexistent-recipe" },
    });

    expect(result.warnings.some((w) => w.includes("Iron Ingot"))).toBe(true);
  });
});
