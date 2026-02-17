import { useState } from "react";
import { Package, ArrowUpDown } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import type { FRMStorageContainer } from "../../types";

type SortKey = "name" | "fullness" | "items";

function getFullness(container: FRMStorageContainer): number {
  const totalAmount = container.Inventory.reduce((s, i) => s + i.Amount, 0);
  const totalMax = container.Inventory.reduce((s, i) => s + i.MaxAmount, 0);
  return totalMax > 0 ? (totalAmount / totalMax) * 100 : 0;
}

function sortContainers(
  containers: FRMStorageContainer[],
  key: SortKey,
  asc: boolean
): FRMStorageContainer[] {
  const sorted = [...containers].sort((a, b) => {
    switch (key) {
      case "name":
        return a.Name.localeCompare(b.Name);
      case "fullness":
        return getFullness(a) - getFullness(b);
      case "items":
        return a.Inventory.filter((i) => i.Amount > 0).length -
          b.Inventory.filter((i) => i.Amount > 0).length;
    }
  });
  return asc ? sorted : sorted.reverse();
}

function fullnessColor(percent: number): string {
  if (percent > 90) return "text-[var(--color-disconnected)]";
  if (percent > 70) return "text-[var(--color-warning)]";
  return "text-[var(--color-satisfactory-text-dim)]";
}

function fullnessBarColor(percent: number): string {
  if (percent > 90) return "bg-[var(--color-disconnected)]";
  if (percent > 70) return "bg-[var(--color-warning)]";
  return "bg-[var(--color-satisfactory-orange)]";
}

export function StorageAssetList({ search }: { search: string }) {
  const { inventory } = useFactoryStore();
  const [sortKey, setSortKey] = useState<SortKey>("fullness");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = search
    ? inventory.filter((c) => c.Name.toLowerCase().includes(search))
    : inventory;

  if (inventory.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
        No storage container data available
      </div>
    );
  }

  const sorted = sortContainers(filtered, sortKey, sortAsc);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Package className="w-5 h-5 text-[var(--color-satisfactory-orange)]" />
        Storage Containers
        <span className="text-sm font-normal text-[var(--color-satisfactory-text-dim)]">
          ({filtered.length})
        </span>
      </h2>

      {filtered.length === 0 ? (
        <div className="p-4 text-center text-sm text-[var(--color-satisfactory-text-dim)]">
          No containers match your search
        </div>
      ) : (
        <div className="border border-[var(--color-satisfactory-border)] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs text-[var(--color-satisfactory-text-dim)] bg-[var(--color-satisfactory-dark)] border-b border-[var(--color-satisfactory-border)]">
            <button
              onClick={() => toggleSort("name")}
              className="flex items-center gap-1 hover:text-[var(--color-satisfactory-text)] flex-1"
            >
              Name
              {sortKey === "name" && <ArrowUpDown className="w-3 h-3" />}
            </button>
            <button
              onClick={() => toggleSort("items")}
              className="flex items-center gap-1 hover:text-[var(--color-satisfactory-text)] w-20 justify-end"
            >
              Items
              {sortKey === "items" && <ArrowUpDown className="w-3 h-3" />}
            </button>
            <button
              onClick={() => toggleSort("fullness")}
              className="flex items-center gap-1 hover:text-[var(--color-satisfactory-text)] w-32 justify-end"
            >
              Fullness
              {sortKey === "fullness" && <ArrowUpDown className="w-3 h-3" />}
            </button>
            <span className="w-36 text-right">Location</span>
          </div>

          {/* Rows */}
          {sorted.map((container, i) => {
            const fullness = getFullness(container);
            const itemCount = container.Inventory.filter((item) => item.Amount > 0).length;
            const slotCount = container.Inventory.length;

            return (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-2 text-xs border-b border-[var(--color-satisfactory-border)] last:border-b-0"
              >
                <span className="flex-1 text-[var(--color-satisfactory-text)] truncate">
                  {container.Name}
                </span>
                <span className="w-20 text-right text-[var(--color-satisfactory-text-dim)]">
                  {itemCount}/{slotCount} slots
                </span>
                <div className="w-32 flex items-center gap-2 justify-end">
                  <div className="w-16 h-1.5 bg-[var(--color-satisfactory-dark)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${fullnessBarColor(fullness)}`}
                      style={{ width: `${Math.min(fullness, 100)}%` }}
                    />
                  </div>
                  <span className={`${fullnessColor(fullness)} w-10 text-right`}>
                    {fullness.toFixed(0)}%
                  </span>
                </div>
                <span className="w-36 text-right text-[var(--color-satisfactory-text-dim)]">
                  {container.location.x.toFixed(0)}, {container.location.y.toFixed(0)}, {container.location.z.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
