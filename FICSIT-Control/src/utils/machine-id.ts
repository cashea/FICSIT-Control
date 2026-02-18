import type { FRMMachine } from "../types";

export type MachineKey = string;

/** Stable composite key for a machine: ClassName@x,y,z */
export function machineKey(m: FRMMachine): MachineKey {
  return `${m.ClassName}@${m.location.x},${m.location.y},${m.location.z}`;
}

/** Find a machine across all endpoint types by its key */
export function findMachineByKey(
  machines: Record<string, FRMMachine[]>,
  key: MachineKey,
): { machine: FRMMachine; endpointType: string } | null {
  for (const [type, list] of Object.entries(machines)) {
    for (const m of list) {
      if (machineKey(m) === key) return { machine: m, endpointType: type };
    }
  }
  return null;
}

/** Map FRM endpoint names to game building IDs for recipe filtering */
export const ENDPOINT_TO_BUILDING_ID: Record<string, string> = {
  getAssembler: "AssemblerMk1",
  getSmelter: "SmelterMk1",
  getConstructor: "ConstructorMk1",
  getRefinery: "OilRefinery",
  getManufacturer: "ManufacturerMk1",
  getFoundry: "FoundryMk1",
  getBlender: "Blender",
  getPackager: "Packager",
  getParticleAccelerator: "HadronCollider",
};
