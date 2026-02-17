export type BuildingId = string;

export type PowerMode = "constant" | "variable";

export interface PowerSpec {
  mode: PowerMode;
  baseMW: number;
  minMW?: number;
  maxMW?: number;
  averageMW?: number;
}

export interface Building {
  id: BuildingId;
  name: string;
  power: PowerSpec;
  inputSlots: number;
  outputSlots: number;
  canOverclock: boolean;
}
