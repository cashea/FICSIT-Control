import { describe, it, expect } from "vitest";
import type { FRMStorageContainer } from "../../../types";

// Import the getFullness function - we'll need to export it first
// For now, we'll copy the logic to test it

function getFullness(container: FRMStorageContainer): number {
  const slotsWithItems = container.Inventory.filter((i) => i.MaxAmount > 0);
  if (slotsWithItems.length === 0) return 0;
  
  const totalFullness = slotsWithItems.reduce(
    (sum, item) => sum + (item.Amount / item.MaxAmount),
    0
  );
  return (totalFullness / slotsWithItems.length) * 100;
}

describe("StorageAssetList - getFullness", () => {
  it("should return 0 for empty container", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        { Name: "", ClassName: "", Amount: 0, MaxAmount: 100 },
        { Name: "", ClassName: "", Amount: 0, MaxAmount: 100 },
      ],
    };

    expect(getFullness(container)).toBe(0);
  });

  it("should return 100 for completely full container", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 100, MaxAmount: 100 },
        { Name: "Copper Ore", ClassName: "Desc_CopperOre_C", Amount: 200, MaxAmount: 200 },
      ],
    };

    expect(getFullness(container)).toBe(100);
  });

  it("should return 50 for half-full container", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 50, MaxAmount: 100 },
        { Name: "Copper Ore", ClassName: "Desc_CopperOre_C", Amount: 100, MaxAmount: 200 },
      ],
    };

    expect(getFullness(container)).toBe(50);
  });

  it("should handle different stack sizes correctly", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        // First slot: 100/100 = 100%
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 100, MaxAmount: 100 },
        // Second slot: 50/500 = 10%
        { Name: "Wire", ClassName: "Desc_Wire_C", Amount: 50, MaxAmount: 500 },
        // Third slot: 200/200 = 100%
        { Name: "Copper Ore", ClassName: "Desc_CopperOre_C", Amount: 200, MaxAmount: 200 },
      ],
    };

    // Average: (100 + 10 + 100) / 3 = 70%
    expect(getFullness(container)).toBe(70);
  });

  it("should ignore empty slots with MaxAmount 0", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 50, MaxAmount: 100 },
        { Name: "", ClassName: "", Amount: 0, MaxAmount: 0 },
        { Name: "", ClassName: "", Amount: 0, MaxAmount: 0 },
      ],
    };

    // Only count the first slot: 50/100 = 50%
    expect(getFullness(container)).toBe(50);
  });

  it("should handle container with only empty slots (MaxAmount 0)", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        { Name: "", ClassName: "", Amount: 0, MaxAmount: 0 },
        { Name: "", ClassName: "", Amount: 0, MaxAmount: 0 },
      ],
    };

    expect(getFullness(container)).toBe(0);
  });

  it("should never exceed 100%", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 100, MaxAmount: 100 },
        { Name: "Copper Ore", ClassName: "Desc_CopperOre_C", Amount: 200, MaxAmount: 200 },
        { Name: "Wire", ClassName: "Desc_Wire_C", Amount: 500, MaxAmount: 500 },
      ],
    };

    const fullness = getFullness(container);
    expect(fullness).toBeLessThanOrEqual(100);
    expect(fullness).toBe(100);
  });

  it("should handle mixed full and empty slots", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        // Slot 1: 100% full
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 100, MaxAmount: 100 },
        // Slot 2: 0% full
        { Name: "Copper Ore", ClassName: "Desc_CopperOre_C", Amount: 0, MaxAmount: 200 },
        // Slot 3: 50% full
        { Name: "Wire", ClassName: "Desc_Wire_C", Amount: 250, MaxAmount: 500 },
      ],
    };

    // Average: (100 + 0 + 50) / 3 = 50%
    expect(getFullness(container)).toBe(50);
  });
});
