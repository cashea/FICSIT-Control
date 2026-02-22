import { Package, ArrowUpDown, Locate } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useFactoryStore } from "../../stores/factory-store";
import { useConnectionStore } from "../../stores/connection-store"; // status check
import { ITEMS } from "../../data/items";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../recipe-tree/recipe-tree-theme";
import { smartTeleport } from "../../utils/smart-teleport";
import type { ItemCategory } from "../../types";

interface AggregatedItem {
  name: string;
  className: string;
  totalAmount: number;
  totalCapacity: number;
  containerCount: number;
  category: ItemCategory | null;
}

type SortKey = "name" | "quantity" | "category" | "containers";

function frmClassToItemId(className: string): string {
  return className.replace(/^Desc_/, "").replace(/_C$/, "");
}

function InventoryView() {
  const { inventory } = useFactoryStore();
  const { status } = useConnectionStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("quantity");
  const [sortAsc, setSortAsc] = useState(false);
  const [teleportingItem, setTeleportingItem] = useState<string | null>(null);

  const handleSmartTeleport = useCallback(
    async (className: string) => {
      setTeleportingItem(className);
      try {
        await smartTeleport(className, inventory);
      } finally {
        setTimeout(() => setTeleportingItem(null), 1500);
      }
    },
    [inventory],
  );

  const aggregated = useMemo(() => {
    const map = new Map<string, AggregatedItem>();
    for (const container of inventory) {
      for (const item of container.Inventory) {
        if (item.Amount === 0) continue;
        const existing = map.get(item.ClassName);
        if (existing) {
          existing.totalAmount += item.Amount;
          existing.totalCapacity += item.MaxAmount;
          existing.containerCount++;
        } else {
          const itemId = frmClassToItemId(item.ClassName);
          const gameItem = ITEMS[itemId];
          map.set(item.ClassName, {
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
    return Array.from(map.values());
  }, [inventory]);

  // Unique categories present in current data
  const activeCategories = useMemo(() => {
    const cats = new Set<ItemCategory>();
    for (const item of aggregated) {
      if (item.category) cats.add(item.category);
    }
    return Array.from(cats).sort((a, b) =>
      (CATEGORY_LABELS[a] ?? a).localeCompare(CATEGORY_LABELS[b] ?? b),
    );
  }, [aggregated]);

  const filtered = useMemo(() => {
    let items = aggregated;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      items = items.filter((i) => i.category === categoryFilter);
    }
    const sorted = [...items].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "quantity":
          return a.totalAmount - b.totalAmount;
        case "category":
          return (a.category ?? "").localeCompare(b.category ?? "");
        case "containers":
          return a.containerCount - b.containerCount;
      }
    });
    return sortAsc ? sorted : sorted.reverse();
  }, [aggregated, search, categoryFilter, sortKey, sortAsc]);

  const totalQuantity = useMemo(
    () => aggregated.reduce((s, i) => s + i.totalAmount, 0),
    [aggregated],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  }

  if (status !== "connected") {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-satisfactory-text-dim)]">
        Connect to FRM to view inventory
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-400" />
          Inventory
          <span className="text-sm font-normal text-[var(--color-satisfactory-text-dim)]">
            {aggregated.length} items / {totalQuantity.toLocaleString()} total
          </span>
        </h1>
      </div>

      {/* Search + Category filters */}
      <div className="space-y-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full max-w-sm px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)]"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              categoryFilter === null
                ? "bg-[var(--color-satisfactory-orange)] border-[var(--color-satisfactory-orange)] text-white"
                : "border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
            }`}
          >
            All
          </button>
          {activeCategories.map((cat) => {
            const color = CATEGORY_COLORS[cat];
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(active ? null : cat)}
                className="px-2.5 py-1 text-xs rounded-full border transition-colors"
                style={
                  active
                    ? { backgroundColor: color, borderColor: color, color: "#fff" }
                    : { borderColor: color + "66", color }
                }
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
            {aggregated.length === 0 ? "No inventory data" : "No matching items"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--color-satisfactory-dark)] z-10">
              <tr className="text-left text-[var(--color-satisfactory-text-dim)] border-b border-[var(--color-satisfactory-border)]">
                <SortHeader label="Item" sortKey="name" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Category" sortKey="category" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Quantity" sortKey="quantity" current={sortKey} asc={sortAsc} onSort={toggleSort} className="text-right" />
                <SortHeader label="Containers" sortKey="containers" current={sortKey} asc={sortAsc} onSort={toggleSort} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const color = item.category
                  ? CATEGORY_COLORS[item.category]
                  : "var(--color-satisfactory-text-dim)";
                const isTeleporting = teleportingItem === item.className;
                return (
                  <tr
                    key={item.className}
                    onDoubleClick={() => handleSmartTeleport(item.className)}
                    className="border-b border-[var(--color-satisfactory-border)] hover:bg-[var(--color-satisfactory-panel)] cursor-pointer select-none"
                    title="Double-click to teleport to largest container"
                  >
                    <td className="py-2 pr-4" style={{ borderLeft: `3px solid ${color}`, paddingLeft: "0.75rem" }}>
                      <span className="font-medium inline-flex items-center gap-1.5">
                        {isTeleporting && <Locate className="w-3.5 h-3.5 text-[var(--color-satisfactory-orange)] animate-pulse" />}
                        {item.name}
                      </span>
                      {isTeleporting && (
                        <span className="ml-2 text-[10px] text-[var(--color-satisfactory-orange)]">
                          Copied — paste in chat to teleport
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {item.category && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: color + "22", color }}
                        >
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {item.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-[var(--color-satisfactory-text-dim)]">
                      {item.containerCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  asc,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = current === sortKey;
  return (
    <th className={`py-2 pr-4 font-medium ${className}`}>
      <button
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-[var(--color-satisfactory-text)] transition-colors"
      >
        {label}
        <ArrowUpDown className={`w-3 h-3 ${active ? "text-[var(--color-satisfactory-orange)]" : "opacity-40"}`} />
        {active && <span className="text-[10px]">{asc ? "\u25B2" : "\u25BC"}</span>}
      </button>
    </th>
  );
}

export default InventoryView;
