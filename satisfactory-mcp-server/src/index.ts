import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPowerTool } from "./tools/power.js";
import { registerProductionTool } from "./tools/production.js";
import { registerInventoryTool } from "./tools/inventory.js";
import { registerMachinesTool } from "./tools/machines.js";
import { registerSummaryTool } from "./tools/summary.js";
import { registerBottlenecksTool } from "./tools/bottlenecks.js";
import { startMonitor } from "./monitor/alerts.js";

const server = new McpServer({
  name: "satisfactory-factory",
  version: "1.0.0",
});

// Register all tools
registerPowerTool(server);
registerProductionTool(server);
registerInventoryTool(server);
registerMachinesTool(server);
registerSummaryTool(server);
registerBottlenecksTool(server);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Start autonomous monitoring after connection
  startMonitor();

  console.error("[MCP] Satisfactory Factory server started");
  console.error(`[MCP] FRM URL: ${process.env.FRM_URL || "http://localhost:8080"}`);
}

main().catch((err) => {
  console.error("[MCP] Fatal error:", err);
  process.exit(1);
});
