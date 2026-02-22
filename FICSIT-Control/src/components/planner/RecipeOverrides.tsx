import { SlidersHorizontal } from "lucide-react";
import { ITEMS } from "../../data/items";
import { RECIPES_BY_OUTPUT } from "../../data/recipes";
import { usePlannerStore } from "../../stores/planner-store";

export function RecipeOverrides() {
  const { solverOutput, recipeOverrides, setRecipeOverride, clearRecipeOverride } =
    usePlannerStore();

  // Collect intermediate items from the solver output that have alternate recipes
  const overridableItems: Array<{
    itemId: string;
    name: string;
    recipes: Array<{ id: string; name: string; isAlternate: boolean }>;
  }> = [];

  if (solverOutput) {
    const seen = new Set<string>();
    for (const node of solverOutput.nodes) {
      for (const input of node.inputs) {
        if (seen.has(input.itemId)) continue;
        seen.add(input.itemId);

        const recipes = RECIPES_BY_OUTPUT[input.itemId];
        if (!recipes || recipes.length <= 1) continue;
        // Only show items where the recipe produces this as primaryOutput
        const primaryRecipes = recipes.filter(
          (r) => r.primaryOutputId === input.itemId,
        );
        if (primaryRecipes.length <= 1) continue;

        overridableItems.push({
          itemId: input.itemId,
          name: ITEMS[input.itemId]?.name ?? input.itemId,
          recipes: primaryRecipes.map((r) => ({
            id: r.id,
            name: r.name,
            isAlternate: r.isAlternate,
          })),
        });
      }
    }
    overridableItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (overridableItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-blue-400" />
        Recipe Overrides
      </h2>
      <p className="text-xs text-[var(--color-satisfactory-text-dim)]">
        Override default recipes with alternates for intermediate items.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {overridableItems.map(({ itemId, name, recipes }) => {
          const currentRecipeId = recipeOverrides[itemId];
          const defaultRecipe = recipes.find((r) => !r.isAlternate);

          return (
            <div
              key={itemId}
              className="flex items-center gap-3 p-3 bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)]"
            >
              <span className="flex-1 text-sm font-medium">{name}</span>
              <select
                value={currentRecipeId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val || val === defaultRecipe?.id) {
                    clearRecipeOverride(itemId);
                  } else {
                    setRecipeOverride(itemId, val);
                  }
                }}
                className="px-2 py-1 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.isAlternate ? " (Alt)" : " (Default)"}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
