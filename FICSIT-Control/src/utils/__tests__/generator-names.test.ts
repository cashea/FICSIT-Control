import { describe, it, expect } from "vitest";
import { getGeneratorTypeName, getCurrentFuelName, getGeneratorDisplayName } from "../generator-names";
import type { FRMGenerator } from "../../types";

// Helper to create a mock generator
const createMockGenerator = (
  className: string,
  availableFuel: Array<{ Name: string; ClassName: string; EnergyValue: number }> = []
): FRMGenerator => ({
  ID: "test-gen-1",
  Name: "Original Name",
  ClassName: className,
  location: { x: 0, y: 0, z: 0, rotation: 0 },
  CircuitID: 1,
  BaseProd: 75,
  DynamicProdCapacity: 75,
  RegulatedDemandProd: 75,
  IsFullBlast: true,
  CanStart: true,
  CurrentPotential: 1,
  PowerProductionPotential: 75,
  FuelAmount: 0.5,
  FuelResource: 1,
  NuclearWarning: "",
  GeoMinPower: 0,
  GeoMaxPower: 0,
  AvailableFuel: availableFuel,
  Supplement: {
    Name: "",
    ClassName: "",
    CurrentConsumed: 0,
    MaxConsumed: 0,
    PercentFull: 0,
  },
});

describe("generator-names", () => {
  describe("getGeneratorTypeName", () => {
    it("should return 'Generator' for coal generators", () => {
      expect(getGeneratorTypeName("Build_GeneratorCoal_C")).toBe("Generator");
    });

    it("should return 'Generator' for fuel generators", () => {
      expect(getGeneratorTypeName("Build_GeneratorFuel_C")).toBe("Generator");
    });

    it("should return 'Generator' for nuclear generators", () => {
      expect(getGeneratorTypeName("Build_GeneratorNuclear_C")).toBe("Generator");
    });

    it("should return 'Geothermal' for geothermal generators", () => {
      expect(getGeneratorTypeName("Build_GeneratorGeoThermal_C")).toBe("Geothermal");
    });

    it("should return 'BiomassBurner' for automated biomass burners", () => {
      expect(getGeneratorTypeName("Build_GeneratorBiomass_Automated_C")).toBe("BiomassBurner");
    });

    it("should return 'BiomassBurner' for manual biomass burners", () => {
      expect(getGeneratorTypeName("Build_GeneratorBiomass_C")).toBe("BiomassBurner");
    });

    it("should return 'Generator' for unknown types", () => {
      expect(getGeneratorTypeName("Build_GeneratorUnknown_C")).toBe("Generator");
    });
  });

  describe("getCurrentFuelName", () => {
    it("should return fuel name from AvailableFuel when present", () => {
      const gen = createMockGenerator("Build_GeneratorCoal_C", [
        { Name: "Coal", ClassName: "Desc_Coal_C", EnergyValue: 300 },
      ]);
      expect(getCurrentFuelName(gen)).toBe("Coal");
    });

    it("should clean up fuel name by removing Desc_ prefix", () => {
      const gen = createMockGenerator("Build_GeneratorFuel_C", [
        { Name: "Desc_LiquidFuel_C", ClassName: "Desc_LiquidFuel_C", EnergyValue: 750 },
      ]);
      expect(getCurrentFuelName(gen)).toBe("LiquidFuel");
    });

    it("should clean up fuel name by removing _C suffix", () => {
      const gen = createMockGenerator("Build_GeneratorNuclear_C", [
        { Name: "UraniumCell_C", ClassName: "Desc_UraniumCell_C", EnergyValue: 500000 },
      ]);
      expect(getCurrentFuelName(gen)).toBe("UraniumCell");
    });

    it("should fallback to category when no fuel available", () => {
      const gen = createMockGenerator("Build_GeneratorCoal_C", []);
      expect(getCurrentFuelName(gen)).toBe("Coal");
    });

    it("should use first fuel when multiple are available", () => {
      const gen = createMockGenerator("Build_GeneratorFuel_C", [
        { Name: "Fuel", ClassName: "Desc_Fuel_C", EnergyValue: 750 },
        { Name: "Turbofuel", ClassName: "Desc_TurboFuel_C", EnergyValue: 2000 },
      ]);
      expect(getCurrentFuelName(gen)).toBe("Fuel");
    });
  });

  describe("getGeneratorDisplayName", () => {
    it("should format name as 'Type Fuel' without custom suffix", () => {
      const gen = createMockGenerator("Build_GeneratorCoal_C", [
        { Name: "Coal", ClassName: "Desc_Coal_C", EnergyValue: 300 },
      ]);
      expect(getGeneratorDisplayName(gen, "")).toBe("Generator Coal");
    });

    it("should format name as 'Type Fuel CustomSuffix' with custom suffix", () => {
      const gen = createMockGenerator("Build_GeneratorCoal_C", [
        { Name: "Coal", ClassName: "Desc_Coal_C", EnergyValue: 300 },
      ]);
      expect(getGeneratorDisplayName(gen, "Main")).toBe("Generator Coal Main");
    });

    it("should handle biomass burner with leaves", () => {
      const gen = createMockGenerator("Build_GeneratorBiomass_Automated_C", [
        { Name: "Leaves", ClassName: "Desc_Leaves_C", EnergyValue: 15 },
      ]);
      expect(getGeneratorDisplayName(gen, "Auxiliary")).toBe("BiomassBurner Leaves Auxiliary");
    });

    it("should handle fuel station with uranium", () => {
      const gen = createMockGenerator("Build_GeneratorNuclear_C", [
        { Name: "UraniumCell", ClassName: "Desc_NuclearFuelRod_C", EnergyValue: 500000 },
      ]);
      expect(getGeneratorDisplayName(gen, "Backup")).toBe("Generator UraniumCell Backup");
    });

    it("should trim whitespace from custom suffix", () => {
      const gen = createMockGenerator("Build_GeneratorCoal_C", [
        { Name: "Coal", ClassName: "Desc_Coal_C", EnergyValue: 300 },
      ]);
      expect(getGeneratorDisplayName(gen, "  Main  ")).toBe("Generator Coal Main");
    });

    it("should work with geothermal generators", () => {
      const gen = createMockGenerator("Build_GeneratorGeoThermal_C", []);
      expect(getGeneratorDisplayName(gen, "Node1")).toBe("Geothermal Geothermal Node1");
    });
  });
});
