import { describe, it, expect } from "vitest";
import type { FRMStorageContainer } from "../../../types";

// Mirror the getFullness logic from StorageAssetList.tsx
function getFullness(container: FRMStorageContainer): number {
  const slotsWithItems = container.Inventory.filter((i) => i.MaxAmount > 0);
  if (slotsWithItems.length === 0) return 0;

  const totalAmount = slotsWithItems.reduce((sum, item) => sum + item.Amount, 0);
  const totalCapacity = slotsWithItems.reduce((sum, item) => sum + item.MaxAmount, 0);
  return Math.min((totalAmount / totalCapacity) * 100, 100);
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
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 100, MaxAmount: 100 },
        { Name: "Wire", ClassName: "Desc_Wire_C", Amount: 50, MaxAmount: 500 },
        { Name: "Copper Ore", ClassName: "Desc_CopperOre_C", Amount: 200, MaxAmount: 200 },
      ],
    };

    // Total: (100 + 50 + 200) / (100 + 500 + 200) = 350/800 = 43.75%
    expect(getFullness(container)).toBeCloseTo(43.75);
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

  it("should cap at 100% when Amount exceeds MaxAmount", () => {
    const container: FRMStorageContainer = {
      Name: "Storage Container",
      ClassName: "Build_StorageContainerMk1_C",
      location: { x: 0, y: 0, z: 0 },
      Inventory: [
        // FRM reports total amount across stacks, MaxAmount is per-stack size
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 500, MaxAmount: 100 },
      ],
    };

    expect(getFullness(container)).toBe(100);
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
        { Name: "Iron Ore", ClassName: "Desc_IronOre_C", Amount: 100, MaxAmount: 100 },
        { Name: "Copper Ore", ClassName: "Desc_CopperOre_C", Amount: 0, MaxAmount: 200 },
        { Name: "Wire", ClassName: "Desc_Wire_C", Amount: 250, MaxAmount: 500 },
      ],
    };

    // Total: (100 + 0 + 250) / (100 + 200 + 500) = 350/800 = 43.75%
    expect(getFullness(container)).toBeCloseTo(43.75);
  });
});
