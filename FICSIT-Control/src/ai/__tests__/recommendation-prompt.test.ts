import { describe, it, expect } from "vitest";
import { buildRecommendationPrompt } from "../recommendation-prompt";
import type { FactorySnapshot } from "../system-prompt";

describe("recommendation-prompt", () => {
  const mockFactorySnapshot: FactorySnapshot = {
    isConnected: true,
    powerCircuits: [
      {
        CircuitGroupID: 1,
        PowerProduction: 100,
        PowerConsumed: 50,
        PowerCapacity: 150,
        FuseTriggered: false,
      } as any,
    ],
    productionStats: [],
    inventory: [],
    machines: {},
  };

  describe("buildRecommendationPrompt", () => {
    it("should build prompt without previous recommendation", () => {
      const result = buildRecommendationPrompt(mockFactorySnapshot, null);

      expect(result.systemPrompt).toContain("expert Satisfactory factory advisor");
      expect(result.systemPrompt).toContain("verify whether the issue still exists");
      expect(result.userMessage).toContain("current factory state");
      expect(result.userMessage).toContain("single most impactful action");
      expect(result.userMessage).not.toContain("previous-recommendation");
    });

    it("should include previous recommendation in prompt", () => {
      const previousRecommendation = {
        text: "3 of your Smelters are idle",
        timestamp: Date.now() - 60000,
        factorySnapshot: mockFactorySnapshot,
      };

      const result = buildRecommendationPrompt(
        mockFactorySnapshot,
        previousRecommendation,
      );

      expect(result.userMessage).toContain("previous-recommendation");
      expect(result.userMessage).toContain("3 of your Smelters are idle");
      expect(result.userMessage).toContain(
        "check if the issue I mentioned previously still exists",
      );
    });

    it("should include both previous and current factory state when previous recommendation exists", () => {
      const oldSnapshot: FactorySnapshot = {
        isConnected: true,
        powerCircuits: [
          {
            CircuitGroupID: 1,
            PowerProduction: 50,
            PowerConsumed: 45,
            PowerCapacity: 100,
            FuseTriggered: false,
          } as any,
        ],
        productionStats: [],
        inventory: [],
        machines: {
          Smelter: [
            { IsProducing: false, IsPaused: false, Recipe: null } as any,
            { IsProducing: false, IsPaused: false, Recipe: null } as any,
            { IsProducing: false, IsPaused: false, Recipe: null } as any,
          ],
        },
      };

      const newSnapshot: FactorySnapshot = {
        isConnected: true,
        powerCircuits: [
          {
            CircuitGroupID: 1,
            PowerProduction: 100,
            PowerConsumed: 80,
            PowerCapacity: 150,
            FuseTriggered: false,
          } as any,
        ],
        productionStats: [],
        inventory: [],
        machines: {
          Smelter: [
            { IsProducing: true, IsPaused: false, Recipe: "Iron Ingot" } as any,
            { IsProducing: true, IsPaused: false, Recipe: "Iron Ingot" } as any,
            { IsProducing: true, IsPaused: false, Recipe: "Iron Ingot" } as any,
          ],
        },
      };

      const previousRecommendation = {
        text: "3 of your Smelters are idle",
        timestamp: Date.now() - 60000,
        factorySnapshot: oldSnapshot,
      };

      const result = buildRecommendationPrompt(
        newSnapshot,
        previousRecommendation,
      );

      // Should contain the old state
      expect(result.userMessage).toContain("Factory state when that recommendation was made");
      expect(result.userMessage).toMatch(/Smelter.*3.*running.*0.*paused.*0.*idle/);
      
      // Should contain the current state
      expect(result.userMessage).toContain("current factory state");
    });

    it("should instruct AI to acknowledge resolution if issue is fixed", () => {
      const previousRecommendation = {
        text: "Power circuit is overloaded",
        timestamp: Date.now() - 60000,
        factorySnapshot: mockFactorySnapshot,
      };

      const result = buildRecommendationPrompt(
        mockFactorySnapshot,
        previousRecommendation,
      );

      expect(result.userMessage).toContain(
        "If the problem has been resolved or significantly improved, acknowledge this",
      );
    });
  });
});
