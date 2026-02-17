import { ITEMS_LIST } from "../data/items";
import { RECIPES_LIST } from "../data/recipes";
import type { ItemId } from "../types";

/** Map from item display name (e.g., "Iron Plate") to item ID (e.g., "iron-plate") */
const ITEM_NAME_TO_ID = new Map<string, ItemId>(
  ITEMS_LIST.map((item) => [item.name, item.id]),
);

/** Map from recipe display name (e.g., "Cast Screw") to recipe ID (e.g., "alt-cast-screw") */
const RECIPE_NAME_TO_ID = new Map<string, string>(
  RECIPES_LIST.map((recipe) => [recipe.name, recipe.id]),
);

/**
 * Resolve an FRM item name to an internal item ID.
 * Exact match first, then case-insensitive fallback.
 */
export function resolveItemName(frmName: string): ItemId | undefined {
  const exact = ITEM_NAME_TO_ID.get(frmName);
  if (exact) return exact;

  const lower = frmName.toLowerCase();
  for (const [name, id] of ITEM_NAME_TO_ID) {
    if (name.toLowerCase() === lower) return id;
  }
  return undefined;
}

/**
 * Resolve an FRM recipe name to an internal recipe ID.
 * Exact match first, then case-insensitive fallback.
 */
export function resolveRecipeName(frmName: string): string | undefined {
  const exact = RECIPE_NAME_TO_ID.get(frmName);
  if (exact) return exact;

  const lower = frmName.toLowerCase();
  for (const [name, id] of RECIPE_NAME_TO_ID) {
    if (name.toLowerCase() === lower) return id;
  }
  return undefined;
}
