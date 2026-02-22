import { useMemo } from "react";
import { useFactoryStore } from "../../../stores/factory-store";
import { useConnectionStore } from "../../../stores/connection-store";

/**
 * Aggregates inventory counts across all storage containers,
 * mapping FRM ClassName (e.g. "Desc_IronPlate_C") to internal
 * item IDs (e.g. "IronPlate").
 *
 * Returns an empty map when not connected to FRM.
 */
export function useInventoryOverlay(): Map<string, number> {
  const { inventory } = useFactoryStore();
  const { status } = useConnectionStore();

  return useMemo(() => {
    const map = new Map<string, number>();
    if (status !== "connected") return map;

    for (const container of inventory) {
      for (const item of container.Inventory) {
        if (item.Amount === 0) continue;
        // Strip Desc_ prefix and _C suffix to match internal item IDs
        const itemId = item.ClassName
          .replace(/^Desc_/, "")
          .replace(/_C$/, "");
        map.set(itemId, (map.get(itemId) ?? 0) + item.Amount);
      }
    }
    return map;
  }, [inventory, status]);
}
