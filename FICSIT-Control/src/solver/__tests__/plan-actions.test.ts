import { describe, it, expect } from "vitest";
import { generatePlanActions } from "../plan-actions";
import type { SolverOutput } from "../../types/solver";

const emptySolverOutput: SolverOutput = {
  nodes: [],
  edges: [],
  rawResources: [],
  totalPowerMW: 0,
  powerByBuilding: Object.create(null),
  warnings: [],
};

describe("generatePlanActions", () => {
  it("returns empty for no solver output nodes", () => {
    const actions = generatePlanActions(emptySolverOutput);
    expect(actions).toHaveLength(0);
  });

  it("generates SET_RECIPE actions for each production node", () => {
    const output: SolverOutput = {
      ...emptySolverOutput,
      nodes: [
        {
          id: "IronPlate",
          recipeId: "IronPlate",
          buildingId: "ConstructorMk1",
          buildingCount: 1,
          clockSpeed: 1,
          inputs: [{ itemId: "IronIngot", ratePerMinute: 30 }],
          outputs: [{ itemId: "IronPlate", ratePerMinute: 20 }],
          powerMW: 4,
        },
        {
          id: "IngotIron",
          recipeId: "IngotIron",
          buildingId: "SmelterMk1",
          buildingCount: 1,
          clockSpeed: 1,
          inputs: [{ itemId: "OreIron", ratePerMinute: 30 }],
          outputs: [{ itemId: "IronIngot", ratePerMinute: 30 }],
          powerMW: 4,
        },
      ],
    };

    const actions = generatePlanActions(output);
    expect(actions).toHaveLength(2);

    expect(actions[0].type).toBe("SET_RECIPE");
    expect(actions[0].payload.recipeId).toBe("IronPlate");
    expect(actions[0].building).toBe("ConstructorMk1");
    expect(actions[0].enabled).toBe(true);

    expect(actions[1].type).toBe("SET_RECIPE");
    expect(actions[1].payload.recipeId).toBe("IngotIron");
    expect(actions[1].building).toBe("SmelterMk1");
  });

  it("all actions have human-readable descriptions", () => {
    const output: SolverOutput = {
      ...emptySolverOutput,
      nodes: [
        {
          id: "IronPlate",
          recipeId: "IronPlate",
          buildingId: "ConstructorMk1",
          buildingCount: 2.5,
          clockSpeed: 1,
          inputs: [{ itemId: "IronIngot", ratePerMinute: 75 }],
          outputs: [{ itemId: "IronPlate", ratePerMinute: 50 }],
          powerMW: 12,
        },
      ],
    };

    const actions = generatePlanActions(output);
    expect(actions[0].description).toContain("ConstructorMk1");
    expect(actions[0].description).toContain("IronPlate");
    expect(actions[0].description).toContain("3x"); // ceil(2.5) = 3
  });

  it("each action has a unique id", () => {
    const output: SolverOutput = {
      ...emptySolverOutput,
      nodes: [
        {
          id: "IronPlate",
          recipeId: "IronPlate",
          buildingId: "ConstructorMk1",
          buildingCount: 1,
          clockSpeed: 1,
          inputs: [],
          outputs: [{ itemId: "IronPlate", ratePerMinute: 20 }],
          powerMW: 4,
        },
        {
          id: "Wire",
          recipeId: "Wire",
          buildingId: "ConstructorMk1",
          buildingCount: 1,
          clockSpeed: 1,
          inputs: [],
          outputs: [{ itemId: "Wire", ratePerMinute: 30 }],
          powerMW: 4,
        },
      ],
    };

    const actions = generatePlanActions(output);
    const ids = actions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
