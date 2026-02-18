export type ItemId = string;

export type ItemForm = "solid" | "liquid" | "gas";

export type ItemCategory =
  | "ore"
  | "fluid"
  | "ingot"
  | "component"
  | "industrial"
  | "communication"
  | "space-elevator"
  | "nuclear"
  | "quantum"
  | "biomass"
  | "ficsit"
  | "alien"
  | "ammo"
  | "packaged";

export interface Item {
  id: ItemId;
  name: string;
  category: ItemCategory;
  form: ItemForm;
  stackSize: number;
  sinkPoints: number;
  isRawResource: boolean;
}
