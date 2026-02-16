import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPower } from "../frm-api.js";

export function registerPowerTool(server: McpServer) {
  server.tool(
    "get_power_status",
    "Get power grid status — production, consumption, capacity, battery level, and fuse state for all circuits",
    {},
    async () => {
      try {
        const circuits = await getPower();

        const totalProd = circuits.reduce((s, c) => s + c.PowerProduction, 0);
        const totalCons = circuits.reduce((s, c) => s + c.PowerConsumed, 0);
        const totalCap = circuits.reduce((s, c) => s + c.PowerCapacity, 0);
        const utilization = totalCap > 0 ? (totalCons / totalCap) * 100 : 0;
        const anyFuse = circuits.some((c) => c.FuseTriggered);

        const summary = {
          totalCircuits: circuits.length,
          totalProductionMW: Math.round(totalProd * 10) / 10,
          totalConsumptionMW: Math.round(totalCons * 10) / 10,
          totalCapacityMW: Math.round(totalCap * 10) / 10,
          utilizationPercent: Math.round(utilization * 10) / 10,
          fuseTriggered: anyFuse,
          circuits: circuits.map((c) => ({
            id: c.CircuitGroupID,
            productionMW: Math.round(c.PowerProduction * 10) / 10,
            consumptionMW: Math.round(c.PowerConsumed * 10) / 10,
            capacityMW: Math.round(c.PowerCapacity * 10) / 10,
            batteryPercent: Math.round(c.BatteryPercent * 10) / 10,
            fuseTriggered: c.FuseTriggered,
          })),
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error fetching power status: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
