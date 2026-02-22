import { useState } from "react";
import { Package, ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { ITEMS } from "../../data/items";
import { CATEGORY_COLORS } from "../recipe-tree/recipe-tree-theme";
import { LocationBadge } from "./LocationBadge";
import type { FRMStorageContainer, FRMInventoryItem } from "../../types";

type SortKey = "name" | "fullness" | "items";

function getFullness(container: FRMStorageContainer): number {
  const slotsWithItems = container.Inventory.filter((i) => i.MaxAmount > 0);
  if (slotsWithItems.length === 0) return 0;

  const totalAmount = slotsWithItems.reduce((sum, item) => sum + item.Amount, 0);
  const totalCapacity = slotsWithItems.reduce((sum, item) => sum + item.MaxAmount, 0);
  return Math.min((totalAmount / totalCapacity) * 100, 100);
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
        return a.Inventory.reduce((s, i) => s + i.Amount, 0) -
          b.Inventory.reduce((s, i) => s + i.Amount, 0);
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

function itemColor(item: FRMInventoryItem): string | undefined {
  const itemId = item.ClassName.replace(/^Desc_/, "").replace(/_C$/, "");
  const gameItem = ITEMS[itemId];
  return gameItem ? CATEGORY_COLORS[gameItem.category] : undefined;
}

interface RollupItem {
  name: string;
  className: string;
  totalAmount: number;
  containerCount: number;
}

function buildRollup(containers: FRMStorageContainer[]): RollupItem[] {
  const totals = new Map<string, RollupItem>();
  for (const c of containers) {
    for (const item of c.Inventory) {
      if (item.Amount === 0) continue;
      const existing = totals.get(item.ClassName);
      if (existing) {
        existing.totalAmount += item.Amount;
        existing.containerCount++;
      } else {
        totals.set(item.ClassName, {
          name: item.Name,
          className: item.ClassName,
          totalAmount: item.Amount,
          containerCount: 1,
        });
      }
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

function StorageRollup({ containers }: { containers: FRMStorageContainer[] }) {
  const [expanded, setExpanded] = useState(false);
  const items = buildRollup(containers);
  if (items.length === 0) return null;

  const totalItems = items.reduce((s, i) => s + i.totalAmount, 0);
  const avgFullness =
    containers.reduce((s, c) => s + getFullness(c), 0) / containers.length;

  const preview = items.slice(0, 6);
  const rest = items.slice(6);

  return (
    <div className="p-3 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-xs text-[var(--color-satisfactory-text-dim)]">
          <span>
            <span className="text-[var(--color-satisfactory-text)] font-medium">{totalItems.toLocaleString()}</span> items across{" "}
            <span className="text-[var(--color-satisfactory-text)] font-medium">{containers.length}</span> containers
          </span>
          <span>
            Avg fullness:{" "}
            <span className={`font-medium ${fullnessColor(avgFullness)}`}>
              {avgFullness.toFixed(0)}%
            </span>
          </span>
        </div>
        {rest.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] transition-colors"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? "Less" : `+${rest.length} more`}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {(expanded ? items : preview).map((item) => {
          const itemId = item.className.replace(/^Desc_/, "").replace(/_C$/, "");
          const gameItem = ITEMS[itemId];
          const color = gameItem ? CATEGORY_COLORS[gameItem.category] : undefined;
          return (
            <span key={item.className} className="flex items-center gap-1">
              <span style={{ color: color ?? "var(--color-satisfactory-text-dim)" }}>
                {item.name}
              </span>
              <span className="text-[var(--color-satisfactory-text-dim)]">
                {item.totalAmount.toLocaleString()}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
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

      <StorageRollup containers={filtered} />

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
              Qty
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
            const stocked = container.Inventory.filter((item) => item.Amount > 0);
            const totalQty = stocked.reduce((s, item) => s + item.Amount, 0);

            return (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-2 text-xs border-b border-[var(--color-satisfactory-border)] last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[var(--color-satisfactory-text)] truncate block">
                    {container.Name}
                  </span>
                  {stocked.length > 0 && (
                    <span className="text-[10px] truncate block">
                      {stocked.map((item, j) => (
                        <span key={j}>
                          {j > 0 && <span className="text-[var(--color-satisfactory-text-dim)]">, </span>}
                          <span style={{ color: itemColor(item) ?? "var(--color-satisfactory-text-dim)" }}>
                            {item.Name}
                          </span>
                          <span className="text-[var(--color-satisfactory-text-dim)]"> ×{item.Amount}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <span className="w-20 text-right text-[var(--color-satisfactory-text-dim)]">
                  {totalQty.toLocaleString()}
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
                <span className="w-36 text-right text-xs">
                  <LocationBadge location={container.location} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
