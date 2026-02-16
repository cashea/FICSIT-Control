import { Package } from "lucide-react";
import { useState } from "react";
import { useFactoryStore } from "../../stores/factory-store";
import { useConnectionStore } from "../../stores/connection-store";

interface AggregatedItem {
  name: string;
  className: string;
  totalAmount: number;
  totalCapacity: number;
  containerCount: number;
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
        aggregated.set(item.ClassName, {
          name: item.Name,
          className: item.ClassName,
          totalAmount: item.Amount,
          totalCapacity: item.MaxAmount,
          containerCount: 1,
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
          {items.map((item) => (
            <div
              key={item.className}
              className="flex items-center justify-between p-3 bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)]"
            >
              <div>
                <span className="text-sm font-medium">{item.name}</span>
                <span className="ml-2 text-xs text-[var(--color-satisfactory-text-dim)]">
                  in {item.containerCount} container
                  {item.containerCount > 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-sm font-mono">
                {item.totalAmount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
