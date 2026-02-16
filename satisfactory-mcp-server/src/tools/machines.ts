import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAllMachines, getMachinesByType } from "../frm-api.js";

export function registerMachinesTool(server: McpServer) {
  server.tool(
    "get_machines",
    "Get machines with their status, recipe, and power consumption. Optionally filter by type (smelter, assembler, constructor, refinery, manufacturer, foundry, blender, packager).",
    {
      type: z
        .string()
        .optional()
        .describe(
          "Machine type to filter by: smelter, assembler, constructor, refinery, manufacturer, foundry, blender, packager"
        ),
    },
    async ({ type }) => {
      try {
        const machines = type
          ? await getMachinesByType(type)
          : await getAllMachines();

        const running = machines.filter((m) => m.IsProducing).length;
        const paused = machines.filter((m) => m.IsPaused).length;
        const idle = machines.length - running - paused;

        const summary = {
          total: machines.length,
          running,
          idle,
          paused,
          machines: machines.map((m) => ({
            name: m.Name,
            recipe: m.Recipe || "None",
            isProducing: m.IsProducing,
            isPaused: m.IsPaused,
            powerConsumedMW: Math.round((m.PowerInfo?.PowerConsumed ?? 0) * 10) / 10,
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
              text: `Error fetching machines: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
