import { describe, it, expect } from "vitest";
import { resolveItemName, resolveRecipeName } from "../frm-name-map";

describe("resolveItemName", () => {
  it("resolves exact item names", () => {
    expect(resolveItemName("Iron Plate")).toBe("iron-plate");
    expect(resolveItemName("Iron Ingot")).toBe("iron-ingot");
    expect(resolveItemName("Heavy Modular Frame")).toBe("heavy-modular-frame");
  });

  it("resolves case-insensitive", () => {
    expect(resolveItemName("iron plate")).toBe("iron-plate");
    expect(resolveItemName("COPPER ORE")).toBe("copper-ore");
  });

  it("returns undefined for unknown items", () => {
    expect(resolveItemName("Alien DNA")).toBeUndefined();
    expect(resolveItemName("")).toBeUndefined();
  });
});

describe("resolveRecipeName", () => {
  it("resolves default recipe names", () => {
    expect(resolveRecipeName("Iron Plate")).toBe("iron-plate");
    expect(resolveRecipeName("Screw")).toBe("screw");
  });

  it("resolves alternate recipe names", () => {
    expect(resolveRecipeName("Cast Screw")).toBe("alt-cast-screw");
    expect(resolveRecipeName("Iron Wire")).toBe("alt-iron-wire");
    expect(resolveRecipeName("Bolted Iron Plate")).toBe("alt-bolted-iron-plate");
  });

  it("returns undefined for unknown recipes", () => {
    expect(resolveRecipeName("Nonexistent Recipe")).toBeUndefined();
  });
});
