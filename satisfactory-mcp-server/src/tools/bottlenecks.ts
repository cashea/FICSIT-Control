import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProdStats, getAllMachines } from "../frm-api.js";

export function registerBottlenecksTool(server: McpServer) {
  server.tool(
    "analyze_bottlenecks",
    "Find production bottlenecks — items and machines running below capacity threshold. Default threshold is 50%.",
    {
      threshold: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Efficiency threshold percentage (0-100). Items/machines below this are flagged. Default: 50"),
    },
    async ({ threshold = 50 }) => {
      try {
        const [prodStats, machines] = await Promise.all([
          getProdStats(),
          getAllMachines(),
        ]);

        // Production bottlenecks
        const productionBottlenecks = prodStats
          .filter((s) => s.MaxProd > 0 && s.ProdPercent < threshold)
          .sort((a, b) => a.ProdPercent - b.ProdPercent)
          .map((s) => ({
            name: s.Name,
            currentRate: Math.round(s.CurrentProd * 10) / 10,
            maxRate: Math.round(s.MaxProd * 10) / 10,
            efficiency: Math.round(s.ProdPercent * 10) / 10,
          }));

        // Idle and paused machines
        const idleMachines = machines
          .filter((m) => !m.IsProducing && !m.IsPaused)
          .map((m) => ({
            name: m.Name,
            recipe: m.Recipe || "None",
            status: "idle" as const,
          }));

        const pausedMachines = machines
          .filter((m) => m.IsPaused)
          .map((m) => ({
            name: m.Name,
            recipe: m.Recipe || "None",
            status: "paused" as const,
          }));

        const result = {
          threshold,
          productionBottlenecks: {
            count: productionBottlenecks.length,
            items: productionBottlenecks,
          },
          stoppedMachines: {
            idle: idleMachines.length,
            paused: pausedMachines.length,
            machines: [...idleMachines, ...pausedMachines],
          },
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error analyzing bottlenecks: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
