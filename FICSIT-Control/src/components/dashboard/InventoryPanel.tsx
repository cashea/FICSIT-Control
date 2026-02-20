import { Package } from "lucide-react";
import { useState } from "react";
import { useFactoryStore } from "../../stores/factory-store";
import { useConnectionStore } from "../../stores/connection-store";
import { ITEMS } from "../../data/items";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../recipe-tree/recipe-tree-theme";
import type { ItemCategory } from "../../types";

interface AggregatedItem {
  name: string;
  className: string;
  totalAmount: number;
  totalCapacity: number;
  containerCount: number;
  category: ItemCategory | null;
}

function frmClassToItemId(className: string): string {
  return className.replace(/^Desc_/, "").replace(/_C$/, "");
}

export function InventoryPanel() {
  const { inventory } = useFactoryStore();
  const { status } = useConnectionStore();
  const [search, setSearch] = useState("");

  if (status !== "connected") {
    return (
      <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
        Connect to FRM to view inventory
      </div>
    );
  }

  // Aggregate items across all containers
  const aggregated = new Map<string, AggregatedItem>();
  for (const container of inventory) {
    for (const item of container.Inventory) {
      if (item.Amount === 0) continue;
      const existing = aggregated.get(item.ClassName);
      if (existing) {
        existing.totalAmount += item.Amount;
        existing.totalCapacity += item.MaxAmount;
        existing.containerCount++;
      } else {
        const itemId = frmClassToItemId(item.ClassName);
        const gameItem = ITEMS[itemId];
        aggregated.set(item.ClassName, {
          name: item.Name,
          className: item.ClassName,
          totalAmount: item.Amount,
          totalCapacity: item.MaxAmount,
          containerCount: 1,
          category: gameItem?.category ?? null,
        });
      }
    }
  }

  const items = Array.from(aggregated.values())
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Package className="w-5 h-5 text-blue-400" />
        Inventory
        <span className="text-sm font-normal text-[var(--color-satisfactory-text-dim)]">
          ({inventory.length} containers)
        </span>
      </h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search items..."
        className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)]"
      />

      {items.length === 0 ? (
        <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
          {aggregated.size === 0 ? "No inventory data" : "No matching items"}
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const color = item.category
              ? CATEGORY_COLORS[item.category]
              : "var(--color-satisfactory-text-dim)";
            return (
              <div
                key={item.className}
                className="flex items-center justify-between p-3 bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)]"
                style={{ borderLeftWidth: 3, borderLeftColor: color }}
              >
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="ml-2 text-xs text-[var(--color-satisfactory-text-dim)]">
                      in {item.containerCount} container
                      {item.containerCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  {item.category && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: color + "22", color }}
                    >
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono">
                  {item.totalAmount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
