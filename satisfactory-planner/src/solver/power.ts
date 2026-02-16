import { BUILDINGS } from "../data/buildings";
import type { BuildingId } from "../types";

export function calculatePower(
  buildingId: BuildingId,
  buildingCount: number,
): number {
  const building = BUILDINGS[buildingId as keyof typeof BUILDINGS];
  if (!building) return 0;

  const { power } = building;
  const perBuildingMW =
    power.mode === "variable" && power.averageMW != null
      ? power.averageMW
      : power.baseMW;

  return perBuildingMW * buildingCount;
}
