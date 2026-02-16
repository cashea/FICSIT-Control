import { getPower, getStorageInv, getAllMachines } from "../frm-api.js";

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "30000", 10);

function alert(level: "warn" | "error", message: string) {
  const timestamp = new Date().toISOString();
  const prefix = level === "error" ? "[ALERT]" : "[WARN]";
  // Log to stderr so it shows in Claude's MCP server logs
  console.error(`${timestamp} ${prefix} ${message}`);
}

async function checkAlerts() {
  try {
    const [circuits, containers, machines] = await Promise.all([
      getPower().catch(() => []),
      getStorageInv().catch(() => []),
      getAllMachines().catch(() => []),
    ]);

    // Check power
    for (const circuit of circuits) {
      if (circuit.FuseTriggered) {
        alert("error", `Power fuse triggered on circuit ${circuit.CircuitGroupID}!`);
      }
      const util =
        circuit.PowerCapacity > 0
          ? (circuit.PowerConsumed / circuit.PowerCapacity) * 100
          : 0;
      if (util > 90 && !circuit.FuseTriggered) {
        alert(
          "warn",
          `Circuit ${circuit.CircuitGroupID} at ${util.toFixed(0)}% power utilization`
        );
      }
    }

    // Check stopped machines
    const paused = machines.filter((m) => m.IsPaused).length;
    const idle = machines.filter((m) => !m.IsProducing && !m.IsPaused).length;
    if (paused > 0) {
      alert("warn", `${paused} machine${paused > 1 ? "s" : ""} paused`);
    }
    if (idle > 0) {
      alert("warn", `${idle} machine${idle > 1 ? "s" : ""} idle (not producing)`);
    }

    // Check storage fill levels
    for (const container of containers) {
      for (const item of container.Inventory) {
        if (item.MaxAmount > 0 && item.Amount / item.MaxAmount > 0.9) {
          alert(
            "warn",
            `Storage nearly full: ${item.Name} at ${Math.round((item.Amount / item.MaxAmount) * 100)}% in ${container.Name}`
          );
        }
      }
    }
  } catch {
    // FRM not available, skip silently
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startMonitor() {
  if (intervalId) return;
  console.error(
    `[Monitor] Starting autonomous monitoring (polling every ${POLL_INTERVAL / 1000}s)`
  );
  // Run immediately, then on interval
  checkAlerts();
  intervalId = setInterval(checkAlerts, POLL_INTERVAL);
}

export function stopMonitor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.error("[Monitor] Stopped");
  }
}
