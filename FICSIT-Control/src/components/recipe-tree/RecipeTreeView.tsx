import { Search, Expand, Shrink } from "lucide-react";
import { useConnectionStore } from "../../stores/connection-store";
import { useFactoryStore } from "../../stores/factory-store";
import { RecipeTreeGraph } from "./RecipeTreeGraph";
import { useInventoryOverlay } from "./hooks/useInventoryOverlay";
import { useRecipeTreeFilters } from "./hooks/useRecipeTreeFilters";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./recipe-tree-theme";

export default function RecipeTreeView() {
  const { status } = useConnectionStore();
  const inventoryMap = useInventoryOverlay();
  const { unlockedRecipes } = useFactoryStore();

  const {
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
    hasUnlockedData,
    visibleItems,
    visibleRecipes,
    allCategories,
  } = useRecipeTreeFilters(inventoryMap, unlockedRecipes);

  const inventoryCount = inventoryMap.size;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-satisfactory-text-dim)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="pl-7 pr-3 py-1 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)] w-48"
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1">
          {allCategories.map((cat) => {
            const active = expandedCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
                style={{
                  borderColor: active ? CATEGORY_COLORS[cat] : "var(--color-satisfactory-border)",
                  backgroundColor: active ? `${CATEGORY_COLORS[cat]}20` : "transparent",
                  color: active ? CATEGORY_COLORS[cat] : "var(--color-satisfactory-text-dim)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat], opacity: active ? 1 : 0.4 }}
                />
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        {/* Expand/Collapse All */}
        <div className="flex gap-1 ml-1">
          <button
            onClick={expandAll}
            title="Expand all categories"
            className="p-1 rounded border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] hover:bg-[var(--color-satisfactory-panel)] transition-colors"
          >
            <Expand className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={collapseAll}
            title="Collapse all categories"
            className="p-1 rounded border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] hover:bg-[var(--color-satisfactory-panel)] transition-colors"
          >
            <Shrink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Show Alternates toggle */}
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-satisfactory-text-dim)] cursor-pointer ml-1">
          <input
            type="checkbox"
            checked={showAlternates}
            onChange={(e) => setShowAlternates(e.target.checked)}
            className="accent-[var(--color-satisfactory-orange)]"
          />
          Alternates
        </label>

        {/* Craftable / Inventory filter */}
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-satisfactory-text-dim)] cursor-pointer">
          <input
            type="checkbox"
            checked={craftableOrInventoryOnly}
            onChange={(e) => setCraftableOrInventoryOnly(e.target.checked)}
            className="accent-[#22c55e]"
          />
          Craftable + Inventory
        </label>

        {/* Player Recipes Only filter */}
        <label
          className="flex items-center gap-1.5 text-xs cursor-pointer"
          style={{
            color: hasUnlockedData
              ? "var(--color-satisfactory-text-dim)"
              : "var(--color-satisfactory-text-dim)",
            opacity: hasUnlockedData ? 1 : 0.5,
          }}
          title={hasUnlockedData ? "Show only recipes unlocked in your save" : "Connect to FRM to load unlocked recipes"}
        >
          <input
            type="checkbox"
            checked={playerRecipesOnly}
            onChange={(e) => setPlayerRecipesOnly(e.target.checked)}
            disabled={!hasUnlockedData}
            className="accent-[#f97316]"
          />
          Player Recipes
        </label>

        {/* Inventory status */}
        <span className="text-xs text-[var(--color-satisfactory-text-dim)] ml-auto">
          {status === "connected"
            ? `${inventoryCount} item${inventoryCount !== 1 ? "s" : ""} in storage`
            : "Inventory: offline"}
        </span>

        {/* Counts */}
        <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
          {visibleItems.length} items &middot; {visibleRecipes.length} recipes
        </span>
      </div>

      {/* Graph */}
      <div className="flex-1 min-h-0">
        {visibleItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--color-satisfactory-text-dim)]">
            No items match the current filters.
          </div>
        ) : (
          <RecipeTreeGraph
            visibleItems={visibleItems}
            visibleRecipes={visibleRecipes}
            inventoryMap={inventoryMap}
          />
        )}
      </div>
    </div>
  );
}
