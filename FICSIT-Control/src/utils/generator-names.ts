import type { FRMGenerator } from "../types";
import { classifyGenerator } from "./power";

/**
 * Map of generator class names to readable type names for display
 */
const GENERATOR_TYPE_NAMES: Record<string, string> = {
  Build_GeneratorCoal_C: "Generator",
  Build_GeneratorFuel_C: "Generator",
  Build_GeneratorNuclear_C: "Generator",
  Build_GeneratorGeoThermal_C: "Geothermal",
  Build_GeneratorBiomass_Automated_C: "BiomassBurner",
  Build_GeneratorBiomass_C: "BiomassBurner",
  Build_GeneratorIntegratedBiomass_C: "BiomassBurner",
};

/**
 * Get the readable type name for a generator
 */
export function getGeneratorTypeName(className: string): string {
  return GENERATOR_TYPE_NAMES[className] ?? "Generator";
}

/**
 * Clean up resource names by removing common prefixes and suffixes
 */
function cleanResourceName(name: string): string {
  return name.replace(/^Desc_/, "").replace(/_C$/, "");
}

/**
 * Get the current fuel name from the generator's available fuels
 * Uses the first available fuel, or the category as fallback
 */
export function getCurrentFuelName(generator: FRMGenerator): string {
  // If there are available fuels, use the first one's name
  if (generator.AvailableFuel && generator.AvailableFuel.length > 0) {
    const fuelName = generator.AvailableFuel[0].Name;
    return cleanResourceName(fuelName);
  }
  
  // Fallback to generator category (Coal, Fuel, Nuclear, etc.)
  return classifyGenerator(generator.ClassName);
}

/**
 * Generate a formatted display name for a generator
 * Format: [Type] [Fuel] [CustomSuffix]
 * Example: "Generator Coal Main"
 */
export function getGeneratorDisplayName(
  generator: FRMGenerator,
  customSuffix: string
): string {
  const typeName = getGeneratorTypeName(generator.ClassName);

  // Build the name parts — geothermal has no fuel, so skip fuel portion
  const parts = [typeName];

  if (generator.GeoMaxPower === 0) {
    parts.push(getCurrentFuelName(generator));
  }

  // Add custom suffix if provided
  if (customSuffix && customSuffix.trim()) {
    parts.push(customSuffix.trim());
  }

  return parts.join(" ");
}
