import type { Node } from "@xyflow/react";
import type { ItemCategory, ItemForm } from "../../../types";

export interface ItemNodeData extends Record<string, unknown> {
  itemId: string;
  itemName: string;
  category: ItemCategory;
  form: ItemForm;
  isRawResource: boolean;
  inventoryCount: number;
  hasInventory: boolean;
}

export interface RecipeNodeData extends Record<string, unknown> {
  recipeId: string;
  recipeName: string;
  buildingName: string;
  buildingId: string;
  isAlternate: boolean;
  inputCount: number;
  outputCount: number;
}

export type ItemTreeNode = Node<ItemNodeData, "item">;
export type RecipeTreeNode = Node<RecipeNodeData, "recipe">;
export type RecipeTreeAppNode = ItemTreeNode | RecipeTreeNode;
