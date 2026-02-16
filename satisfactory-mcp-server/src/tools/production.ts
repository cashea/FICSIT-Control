import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProdStats } from "../frm-api.js";

export function registerProductionTool(server: McpServer) {
  server.tool(
    "get_production_stats",
    "Get per-item production and consumption rates. Shows current vs max rates and efficiency percentage.",
    { search: z.string().optional().describe("Filter items by name (case-insensitive)") },
    async ({ search }) => {
      try {
        let stats = await getProdStats();

        if (search) {
          const term = search.toLowerCase();
          stats = stats.filter((s) => s.Name.toLowerCase().includes(term));
        }

        const items = stats.map((s) => ({
          name: s.Name,
          currentProduction: Math.round(s.CurrentProd * 10) / 10,
          maxProduction: Math.round(s.MaxProd * 10) / 10,
          productionEfficiency: Math.round(s.ProdPercent * 10) / 10,
          currentConsumption: Math.round(s.CurrentConsumed * 10) / 10,
          maxConsumption: Math.round(s.MaxConsumed * 10) / 10,
          consumptionEfficiency: Math.round(s.ConsPercent * 10) / 10,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ count: items.length, items }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error fetching production stats: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
