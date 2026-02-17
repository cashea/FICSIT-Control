import type { ItemId } from "./item";
import type { BuildingId } from "./building";

export interface RecipeIO {
  itemId: ItemId;
  amount: number;
  ratePerMinute: number;
}

export interface Recipe {
  id: string;
  name: string;
  buildingId: BuildingId;
  cycleDuration: number;
  inputs: RecipeIO[];
  outputs: RecipeIO[];
  primaryOutputId: ItemId;
  isAlternate: boolean;
  defaultRecipeId: string | null;
}
