import { useState, useMemo, useCallback } from "react";
import { ITEMS_LIST } from "../../../data/items";
import { RECIPES_LIST, RECIPES_BY_OUTPUT } from "../../../data/recipes";
import type { Item, ItemCategory, Recipe, FRMRecipe } from "../../../types";

const ALL_CATEGORIES: ItemCategory[] = [
  "ore", "fluid", "ingot", "component", "industrial", "communication",
  "space-elevator", "nuclear", "quantum", "biomass", "ficsit", "alien",
  "ammo", "packaged",
];

function allCategoriesSet(): Set<ItemCategory> {
  return new Set(ALL_CATEGORIES);
}

export interface RecipeTreeFilters {
  search: string;
  setSearch: (s: string) => void;
  expandedCategories: Set<ItemCategory>;
  toggleCategory: (cat: ItemCategory) => void;
  expandAll: () => void;
  collapseAll: () => void;
  showAlternates: boolean;
  setShowAlternates: (v: boolean) => void;
  craftableOrInventoryOnly: boolean;
  setCraftableOrInventoryOnly: (v: boolean) => void;
  playerRecipesOnly: boolean;
  setPlayerRecipesOnly: (v: boolean) => void;
  hasUnlockedData: boolean;
  visibleItems: Item[];
  visibleRecipes: Recipe[];
  allCategories: ItemCategory[];
}

/** Strip `Recipe_` prefix and `_C` suffix from FRM ClassName to match internal recipe IDs. */
function frmRecipeId(className: string): string {
  return className.replace(/^Recipe_/, "").replace(/_C$/, "");
}

export function useRecipeTreeFilters(
  inventoryMap: Map<string, number>,
  unlockedRecipes: FRMRecipe[],
): RecipeTreeFilters {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<ItemCategory>>(allCategoriesSet);
  const [showAlternates, setShowAlternates] = useState(true);
  const [craftableOrInventoryOnly, setCraftableOrInventoryOnly] = useState(false);
  const [playerRecipesOnly, setPlayerRecipesOnly] = useState(false);

  // Build set of unlocked recipe IDs (internal format)
  const unlockedRecipeIds = useMemo(() => {
    return new Set(unlockedRecipes.map((r) => frmRecipeId(r.ClassName)));
  }, [unlockedRecipes]);

  const toggleCategory = useCallback((cat: ItemCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedCategories(allCategoriesSet());
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  // Filter items by expanded categories, search, and craftable/inventory filter
  const visibleItems = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return ITEMS_LIST.filter((item) => {
      if (!expandedCategories.has(item.category)) return false;
      if (lowerSearch && !item.name.toLowerCase().includes(lowerSearch)) return false;
      if (craftableOrInventoryOnly) {
        const isCraftable = (RECIPES_BY_OUTPUT[item.id]?.length ?? 0) > 0;
        const hasInventory = (inventoryMap.get(item.id) ?? 0) > 0;
        if (!isCraftable && !hasInventory) return false;
      }
      return true;
    });
  }, [expandedCategories, search, craftableOrInventoryOnly, inventoryMap]);

  // Filter recipes: alternates toggle, player-unlocked filter, + at least one visible endpoint
  const visibleRecipes = useMemo(() => {
    const visibleItemIds = new Set(visibleItems.map((i) => i.id));

    return RECIPES_LIST.filter((recipe) => {
      if (!showAlternates && recipe.isAlternate) return false;
      if (playerRecipesOnly && unlockedRecipeIds.size > 0 && !unlockedRecipeIds.has(recipe.id)) return false;

      // Recipe must have at least one input or output in the visible set
      const hasVisibleInput = recipe.inputs.some((inp) => visibleItemIds.has(inp.itemId));
      const hasVisibleOutput = recipe.outputs.some((out) => visibleItemIds.has(out.itemId));
      return hasVisibleInput || hasVisibleOutput;
    });
  }, [visibleItems, showAlternates, playerRecipesOnly, unlockedRecipeIds]);

  return {
    search,
    setSearch,
    expandedCategories,
    toggleCategory,
    expandAll,
    collapseAll,
    showAlternates,
    setShowAlternates,
    craftableOrInventoryOnly,
    setCraftableOrInventoryOnly,
    playerRecipesOnly,
    setPlayerRecipesOnly,
    hasUnlockedData: unlockedRecipeIds.size > 0,
    visibleItems,
    visibleRecipes,
    allCategories: ALL_CATEGORIES,
  };
}
