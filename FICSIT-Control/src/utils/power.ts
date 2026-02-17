import type { FRMGenerator, FRMMachine } from "../types";

export type GeneratorCategory = "Coal" | "Fuel" | "Nuclear" | "Geothermal" | "Biomass";

const GENERATOR_CATEGORY_MAP: Record<string, GeneratorCategory> = {
  Build_GeneratorCoal_C: "Coal",
  Build_GeneratorFuel_C: "Fuel",
  Build_GeneratorNuclear_C: "Nuclear",
  Build_GeneratorGeoThermal_C: "Geothermal",
  Build_GeneratorBiomass_Automated_C: "Biomass",
  Build_GeneratorBiomass_C: "Biomass",
};

export const GENERATOR_COLORS: Record<GeneratorCategory, string> = {
  Coal: "#6b7280",
  Fuel: "#d97706",
  Nuclear: "#06b6d4",
  Geothermal: "#ea580c",
  Biomass: "#22c55e",
};

export function classifyGenerator(className: string): GeneratorCategory {
  return GENERATOR_CATEGORY_MAP[className] ?? "Biomass";
}

export interface GeneratorGroup {
  category: GeneratorCategory;
  generators: FRMGenerator[];
  totalMW: number;
  count: number;
}

export function groupGeneratorsByCategory(generators: FRMGenerator[]): GeneratorGroup[] {
  const map = new Map<GeneratorCategory, FRMGenerator[]>();
  for (const gen of generators) {
    const cat = classifyGenerator(gen.ClassName);
    const list = map.get(cat);
    if (list) list.push(gen);
    else map.set(cat, [gen]);
  }
  return Array.from(map.entries()).map(([category, gens]) => ({
    category,
    generators: gens,
    totalMW: gens.reduce((sum, g) => sum + g.RegulatedDemandProd, 0),
    count: gens.length,
  }));
}

export interface ConsumerGroup {
  name: string;
  machines: FRMMachine[];
  totalPowerDraw: number;
  count: number;
}

export function getConsumersForCircuit(
  machines: Record<string, FRMMachine[]>,
  circuitId: number,
): ConsumerGroup[] {
  const grouped = new Map<string, FRMMachine[]>();
  for (const machineList of Object.values(machines)) {
    for (const m of machineList) {
      if (m.PowerInfo.CircuitGroupID === circuitId) {
        const list = grouped.get(m.Name);
        if (list) list.push(m);
        else grouped.set(m.Name, [m]);
      }
    }
  }
  return Array.from(grouped.entries())
    .map(([name, ms]) => ({
      name,
      machines: ms,
      totalPowerDraw: ms.reduce((sum, m) => sum + m.PowerInfo.PowerConsumed, 0),
      count: ms.length,
    }))
    .sort((a, b) => b.totalPowerDraw - a.totalPowerDraw);
}

export function generatorSummaryText(generators: FRMGenerator[]): string {
  const groups = groupGeneratorsByCategory(generators);
  if (groups.length === 0) return "No generators";
  return groups.map((g) => `${g.category} x${g.count}`).join(", ");
}
