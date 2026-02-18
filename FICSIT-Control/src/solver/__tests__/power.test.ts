import { describe, it, expect } from "vitest";
import { calculatePower } from "../power";

describe("calculatePower", () => {
  it("calculates constant power correctly", () => {
    // Constructor: 4MW base
    expect(calculatePower("ConstructorMk1", 1)).toBe(4);
    expect(calculatePower("ConstructorMk1", 2.5)).toBe(10);
  });

  it("calculates variable power using averageMW", () => {
    // Particle Accelerator: averageMW = 875
    expect(calculatePower("HadronCollider", 1)).toBe(875);
    expect(calculatePower("HadronCollider", 2)).toBe(1750);
  });

  it("returns 0 for unknown building", () => {
    expect(calculatePower("nonexistent", 1)).toBe(0);
  });

  it("returns 0 for zero buildings", () => {
    expect(calculatePower("ConstructorMk1", 0)).toBe(0);
  });
});
