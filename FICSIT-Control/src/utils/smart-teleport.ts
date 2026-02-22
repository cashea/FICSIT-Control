import type { FRMStorageContainer } from "../types";
import { getPakUtilityCommand } from "./format";

const BRIDGE = "http://127.0.0.1:3001";

/**
 * Smart Teleport: finds the storage container holding the most of the given
 * item, copies its !tp command to the clipboard, and focuses the game window.
 */
export async function smartTeleport(
  itemClassName: string,
  inventory: FRMStorageContainer[],
): Promise<{ containerName: string } | null> {
  // 1. Find the container with the largest amount of this item
  let bestContainer: FRMStorageContainer | null = null;
  let bestAmount = 0;

  for (const container of inventory) {
    for (const slot of container.Inventory) {
      if (slot.ClassName === itemClassName && slot.Amount > bestAmount) {
        bestAmount = slot.Amount;
        bestContainer = container;
      }
    }
  }

  if (!bestContainer) return null;

  // 2. Copy the container's !tp command to clipboard
  const command = getPakUtilityCommand(bestContainer.location);
  await navigator.clipboard.writeText(command).catch(() => {});

  // 3. Focus the game window (best-effort via bridge server)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    await fetch(`${BRIDGE}/window/focus/satisfactory`, {
      method: "POST",
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch {
    // Bridge server not running — command is on clipboard
  }

  return { containerName: bestContainer.Name };
}
