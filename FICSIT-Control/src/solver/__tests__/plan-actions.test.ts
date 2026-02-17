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
          id: "iron-plate",
          recipeId: "iron-plate",
          buildingId: "constructor",
          buildingCount: 1,
          clockSpeed: 1,
          inputs: [{ itemId: "iron-ingot", ratePerMinute: 30 }],
          outputs: [{ itemId: "iron-plate", ratePerMinute: 20 }],
          powerMW: 4,
        },
        {
          id: "iron-ingot",
          recipeId: "iron-ingot",
          buildingId: "smelter",
          buildingCount: 1,
          clockSpeed: 1,
          inputs: [{ itemId: "iron-ore", ratePerMinute: 30 }],
          outputs: [{ itemId: "iron-ingot", ratePerMinute: 30 }],
          powerMW: 4,
        },
      ],
    };

    const actions = generatePlanActions(output);
    expect(actions).toHaveLength(2);

    expect(actions[0].type).toBe("SET_RECIPE");
    expect(actions[0].payload.recipeId).toBe("iron-plate");
    expect(actions[0].building).toBe("constructor");
    expect(actions[0].enabled).toBe(true);

    expect(actions[1].type).toBe("SET_RECIPE");
    expect(actions[1].payload.recipeId).toBe("iron-ingot");
    expect(actions[1].building).toBe("smelter");
  });

  it("all actions have human-readable descriptions", () => {
    const output: SolverOutput = {
      ...emptySolverOutput,
      nodes: [
        {
          id: "iron-plate",
          recipeId: "iron-plate",
          buildingId: "constructor",
          buildingCount: 2.5,
          clockSpeed: 1,
          inputs: [{ itemId: "iron-ingot", ratePerMinute: 75 }],
          outputs: [{ itemId: "iron-plate", ratePerMinute: 50 }],
          powerMW: 12,
        },
      ],
    };

    const actions = generatePlanActions(output);
    expect(actions[0].description).toContain("constructor");
    expect(actions[0].description).toContain("iron-plate");
    expect(actions[0].description).toContain("3x"); // ceil(2.5) = 3
  });

  it("each action has a unique id", () => {
    const output: SolverOutput = {
      ...emptySolverOutput,
      nodes: [
        {
          id: "iron-plate",
          recipeId: "iron-plate",
          buildingId: "constructor",
          buildingCount: 1,
          clockSpeed: 1,
          inputs: [],
          outputs: [{ itemId: "iron-plate", ratePerMinute: 20 }],
          powerMW: 4,
        },
        {
          id: "copper-wire",
          recipeId: "copper-wire",
          buildingId: "constructor",
          buildingCount: 1,
          clockSpeed: 1,
          inputs: [],
          outputs: [{ itemId: "wire", ratePerMinute: 30 }],
          powerMW: 4,
        },
      ],
    };

    const actions = generatePlanActions(output);
    const ids = actions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
