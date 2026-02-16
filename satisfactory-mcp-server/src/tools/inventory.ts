import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStorageInv } from "../frm-api.js";

export function registerInventoryTool(server: McpServer) {
  server.tool(
    "get_inventory",
    "Get storage container contents aggregated by item. Shows total amounts across all containers.",
    { search: z.string().optional().describe("Filter items by name (case-insensitive)") },
    async ({ search }) => {
      try {
        const containers = await getStorageInv();

        // Aggregate items across all containers
        const aggregated = new Map<
          string,
          { name: string; totalAmount: number; containerCount: number }
        >();

        for (const container of containers) {
          for (const item of container.Inventory) {
            if (item.Amount === 0) continue;
            const existing = aggregated.get(item.ClassName);
            if (existing) {
              existing.totalAmount += item.Amount;
              existing.containerCount++;
            } else {
              aggregated.set(item.ClassName, {
                name: item.Name,
                totalAmount: item.Amount,
                containerCount: 1,
              });
            }
          }
        }

        let items = Array.from(aggregated.values()).sort(
          (a, b) => b.totalAmount - a.totalAmount
        );

        if (search) {
          const term = search.toLowerCase();
          items = items.filter((i) => i.name.toLowerCase().includes(term));
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  totalContainers: containers.length,
                  uniqueItems: items.length,
                  items,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error fetching inventory: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
