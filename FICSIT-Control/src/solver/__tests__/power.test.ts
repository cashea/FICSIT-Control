import { describe, it, expect } from "vitest";
import { calculatePower } from "../power";

describe("calculatePower", () => {
  it("calculates constant power correctly", () => {
    // Constructor: 4MW base
    expect(calculatePower("constructor", 1)).toBe(4);
    expect(calculatePower("constructor", 2.5)).toBe(10);
  });

  it("calculates variable power using averageMW", () => {
    // Particle Accelerator: averageMW = 1000
    expect(calculatePower("particle-accelerator", 1)).toBe(1000);
    expect(calculatePower("particle-accelerator", 2)).toBe(2000);
  });

  it("returns 0 for unknown building", () => {
    expect(calculatePower("nonexistent", 1)).toBe(0);
  });

  it("returns 0 for zero buildings", () => {
    expect(calculatePower("constructor", 0)).toBe(0);
  });
});
