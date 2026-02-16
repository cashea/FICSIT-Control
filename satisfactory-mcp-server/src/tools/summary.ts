import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPower, getProdStats, getStorageInv, getAllMachines } from "../frm-api.js";

export function registerSummaryTool(server: McpServer) {
  server.tool(
    "get_factory_summary",
    "Get a high-level overview of the entire factory — machine counts, power status, top produced items, and storage summary.",
    {},
    async () => {
      try {
        const [circuits, prodStats, containers, machines] = await Promise.all([
          getPower(),
          getProdStats(),
          getStorageInv(),
          getAllMachines(),
        ]);

        const totalProd = circuits.reduce((s, c) => s + c.PowerProduction, 0);
        const totalCons = circuits.reduce((s, c) => s + c.PowerConsumed, 0);
        const totalCap = circuits.reduce((s, c) => s + c.PowerCapacity, 0);
        const anyFuse = circuits.some((c) => c.FuseTriggered);

        const running = machines.filter((m) => m.IsProducing).length;
        const paused = machines.filter((m) => m.IsPaused).length;
        const idle = machines.length - running - paused;

        // Top 10 produced items by rate
        const topProduced = [...prodStats]
          .sort((a, b) => b.CurrentProd - a.CurrentProd)
          .slice(0, 10)
          .map((s) => ({
            name: s.Name,
            rate: Math.round(s.CurrentProd * 10) / 10,
            efficiency: Math.round(s.ProdPercent * 10) / 10,
          }));

        const summary = {
          machines: {
            total: machines.length,
            running,
            idle,
            paused,
            efficiency:
              machines.length > 0
                ? Math.round((running / machines.length) * 1000) / 10
                : 0,
          },
          power: {
            productionMW: Math.round(totalProd * 10) / 10,
            consumptionMW: Math.round(totalCons * 10) / 10,
            capacityMW: Math.round(totalCap * 10) / 10,
            utilizationPercent:
              totalCap > 0
                ? Math.round((totalCons / totalCap) * 1000) / 10
                : 0,
            fuseTriggered: anyFuse,
            circuits: circuits.length,
          },
          production: {
            uniqueItems: prodStats.length,
            topProduced,
          },
          storage: {
            containers: containers.length,
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error generating factory summary: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
