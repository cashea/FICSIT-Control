import type { FRMProdStat, FRMMachine } from "../types";
import type { ProductionTarget, RecipeSelection } from "../types";
import { ITEMS } from "../data/items";
import { RECIPES, DEFAULT_RECIPE_FOR_ITEM } from "../data/recipes";
import { resolveItemName, resolveRecipeName } from "../utils/frm-name-map";

export interface ImportResult {
  input: { targets: ProductionTarget[]; recipeOverrides: RecipeSelection };
  warnings: string[];
  unmappedItems: string[];
  detectedOutputs: Array<{ name: string; itemId: string; netRate: number }>;
}

/**
 * Detect net outputs from FRM production stats.
 * A "net output" is a non-raw item where MaxProd exceeds MaxConsumed.
 */
export function detectNetOutputs(prodStats: FRMProdStat[]): {
  targets: ProductionTarget[];
  unmapped: string[];
  warnings: string[];
} {
  const targets: ProductionTarget[] = [];
  const unmapped: string[] = [];
  const warnings: string[] = [];

  for (const stat of prodStats) {
    const netRate = stat.MaxProd - stat.MaxConsumed;
    if (netRate <= 0.01) continue;

    const itemId = resolveItemName(stat.Name);
    if (!itemId) {
      unmapped.push(stat.Name);
      continue;
    }

    const item = ITEMS[itemId];
    if (!item || item.isRawResource) continue;

    targets.push({
      itemId,
      ratePerMinute: netRate,
      inputMode: "rate",
      inputValue: netRate,
    });
  }

  if (unmapped.length > 0) {
    warnings.push(
      `Could not map ${unmapped.length} item(s): ${unmapped.join(", ")}`,
    );
  }

  return { targets, unmapped, warnings };
}

/**
 * Detect alternate recipe overrides from live machines.
 * For each item with a non-default recipe, the majority recipe wins.
 */
export function detectRecipeOverrides(allMachines: FRMMachine[]): {
  overrides: RecipeSelection;
  warnings: string[];
} {
  const overrides: RecipeSelection = {};
  const warnings: string[] = [];

  // Group by primary output item → recipe → count
  const recipeUsage = new Map<string, Map<string, number>>();

  for (const machine of allMachines) {
    if (!machine.Recipe || machine.Recipe === "None") continue;

    const recipeId = resolveRecipeName(machine.Recipe);
    if (!recipeId) continue;

    const recipe = RECIPES[recipeId];
    if (!recipe) continue;

    const itemId = recipe.primaryOutputId;
    if (!recipeUsage.has(itemId)) {
      recipeUsage.set(itemId, new Map());
    }
    const usage = recipeUsage.get(itemId)!;
    usage.set(recipeId, (usage.get(recipeId) ?? 0) + 1);
  }

  for (const [itemId, usage] of recipeUsage) {
    let bestRecipeId = "";
    let bestCount = 0;
    for (const [recipeId, count] of usage) {
      if (count > bestCount) {
        bestRecipeId = recipeId;
        bestCount = count;
      }
    }

    if (!bestRecipeId) continue;

    const defaultRecipe = DEFAULT_RECIPE_FOR_ITEM[itemId];
    if (defaultRecipe && bestRecipeId !== defaultRecipe.id) {
      overrides[itemId] = bestRecipeId;
    }
  }

  return { overrides, warnings };
}

/**
 * Build a SolverInput from live FRM factory data.
 */
export function importFactory(
  prodStats: FRMProdStat[],
  allMachines: FRMMachine[],
): ImportResult {
  const warnings: string[] = [];

  const {
    targets,
    unmapped,
    warnings: targetWarnings,
  } = detectNetOutputs(prodStats);
  warnings.push(...targetWarnings);

  const { overrides, warnings: recipeWarnings } =
    detectRecipeOverrides(allMachines);
  warnings.push(...recipeWarnings);

  return {
    input: { targets, recipeOverrides: overrides },
    warnings,
    unmappedItems: unmapped,
    detectedOutputs: targets.map((t) => ({
      name: ITEMS[t.itemId]?.name ?? t.itemId,
      itemId: t.itemId,
      netRate: t.ratePerMinute,
    })),
  };
}
