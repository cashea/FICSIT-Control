import { describe, it, expect } from "vitest";
import { resolveItemName, resolveRecipeName } from "../frm-name-map";

describe("resolveItemName", () => {
  it("resolves exact item names", () => {
    expect(resolveItemName("Iron Plate")).toBe("IronPlate");
    expect(resolveItemName("Iron Ingot")).toBe("IronIngot");
    expect(resolveItemName("Heavy Modular Frame")).toBe("ModularFrameHeavy");
  });

  it("resolves case-insensitive", () => {
    expect(resolveItemName("iron plate")).toBe("IronPlate");
    expect(resolveItemName("COPPER ORE")).toBe("OreCopper");
  });

  it("returns undefined for unknown items", () => {
    expect(resolveItemName("Alien DNA")).toBeUndefined();
    expect(resolveItemName("")).toBeUndefined();
  });
});

describe("resolveRecipeName", () => {
  it("resolves default recipe names", () => {
    expect(resolveRecipeName("Iron Plate")).toBe("IronPlate");
    expect(resolveRecipeName("Screws")).toBe("Screw");
  });

  it("resolves alternate recipe names", () => {
    expect(resolveRecipeName("Alternate: Cast Screws")).toBe("Alternate_Screw");
    expect(resolveRecipeName("Alternate: Iron Wire")).toBe("Alternate_Wire_1");
    expect(resolveRecipeName("Alternate: Bolted Iron Plate")).toBe("Alternate_ReinforcedIronPlate_1");
  });

  it("returns undefined for unknown recipes", () => {
    expect(resolveRecipeName("Nonexistent Recipe")).toBeUndefined();
  });
});
