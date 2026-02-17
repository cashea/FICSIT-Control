import type {
  FRMPowerCircuit,
  FRMProdStat,
  FRMStorageContainer,
  FRMMachine,
} from "../types";
import { ITEMS } from "../data/items";
import { RECIPES } from "../data/recipes";
import { BUILDINGS } from "../data/buildings";

export interface FactorySnapshot {
  isConnected: boolean;
  powerCircuits: FRMPowerCircuit[];
  productionStats: FRMProdStat[];
  inventory: FRMStorageContainer[];
  machines: Record<string, FRMMachine[]>;
}

function summarizePower(circuits: FRMPowerCircuit[]): string {
  if (circuits.length === 0) return "No power data available.";

  const totalProd = circuits.reduce((s, c) => s + c.PowerProduction, 0);
  const totalCons = circuits.reduce((s, c) => s + c.PowerConsumed, 0);
  const totalCap = circuits.reduce((s, c) => s + c.PowerCapacity, 0);
  const fuseTripped = circuits.filter((c) => c.FuseTriggered);

  let summary = `Total: ${totalProd.toFixed(1)} MW produced, ${totalCons.toFixed(1)} MW consumed, ${totalCap.toFixed(1)} MW capacity (${circuits.length} circuit(s)).`;
  if (fuseTripped.length > 0) {
    summary += ` WARNING: Fuse triggered on circuit(s) ${fuseTripped.map((c) => c.CircuitGroupID).join(", ")}!`;
  }

  if (circuits.length > 1) {
    summary +=
      "\nPer circuit:\n" +
      circuits
        .map(
          (c) =>
            `  #${c.CircuitGroupID}: ${c.PowerProduction.toFixed(0)}/${c.PowerConsumed.toFixed(0)}/${c.PowerCapacity.toFixed(0)} MW (prod/cons/cap)${c.FuseTriggered ? " FUSE!" : ""}`,
        )
        .join("\n");
  }

  return summary;
}

function summarizeProduction(stats: FRMProdStat[]): string {
  if (stats.length === 0) return "No production data available.";

  const active = stats.filter(
    (s) => s.CurrentProd > 0 || s.CurrentConsumed > 0,
  );
  if (active.length === 0) return "No active production/consumption.";

  return active
    .map(
      (s) =>
        `${s.Name}: producing ${s.CurrentProd.toFixed(1)}/${s.MaxProd.toFixed(1)}/min (${s.ProdPercent.toFixed(0)}%), consuming ${s.CurrentConsumed.toFixed(1)}/${s.MaxConsumed.toFixed(1)}/min (${s.ConsPercent.toFixed(0)}%)`,
    )
    .join("\n");
}

function summarizeInventory(containers: FRMStorageContainer[]): string {
  if (containers.length === 0) return "No storage data available.";

  const totals = new Map<string, { amount: number; maxAmount: number }>();
  for (const container of containers) {
    for (const item of container.Inventory) {
      const existing = totals.get(item.Name) ?? { amount: 0, maxAmount: 0 };
      existing.amount += item.Amount;
      existing.maxAmount += item.MaxAmount;
      totals.set(item.Name, existing);
    }
  }

  const sorted = Array.from(totals.entries()).sort(
    (a, b) => b[1].amount - a[1].amount,
  );
  return (
    `${containers.length} storage containers. Top items:\n` +
    sorted
      .slice(0, 20)
      .map(([name, { amount, maxAmount }]) => `  ${name}: ${amount}/${maxAmount}`)
      .join("\n")
  );
}

function summarizeMachines(machines: Record<string, FRMMachine[]>): string {
  const entries = Object.entries(machines).filter(([, list]) => list.length > 0);
  if (entries.length === 0) return "No machine data available.";

  return entries
    .map(([type, list]) => {
      const producing = list.filter((m) => m.IsProducing).length;
      const paused = list.filter((m) => m.IsPaused).length;
      const idle = list.filter((m) => !m.IsProducing && !m.IsPaused).length;

      let line = `${type} (${list.length}): ${producing} running, ${paused} paused, ${idle} idle`;

      const recipeGroups = new Map<string, number>();
      for (const m of list) {
        if (m.Recipe) recipeGroups.set(m.Recipe, (recipeGroups.get(m.Recipe) ?? 0) + 1);
      }
      if (recipeGroups.size > 0) {
        line +=
          ". Recipes: " +
          Array.from(recipeGroups.entries())
            .map(([recipe, count]) => `${recipe} x${count}`)
            .join(", ");
      }

      return line;
    })
    .join("\n");
}

function formatGameData(): string {
  const items = Object.values(ITEMS)
    .map(
      (i) =>
        `${i.name} (${i.id}): ${i.category}, ${i.form}${i.isRawResource ? ", raw resource" : ""}`,
    )
    .join("\n");

  const recipes = Object.values(RECIPES)
    .map((r) => {
      const ins = r.inputs
        .map((i) => `${ITEMS[i.itemId]?.name ?? i.itemId} @${i.ratePerMinute}/min`)
        .join(" + ");
      const outs = r.outputs
        .map((o) => `${ITEMS[o.itemId]?.name ?? o.itemId} @${o.ratePerMinute}/min`)
        .join(" + ");
      const building =
        (BUILDINGS as Record<string, { name: string }>)[r.buildingId]?.name ??
        r.buildingId;
      return `${r.name}${r.isAlternate ? " (ALT)" : ""} [${building}]: ${ins} -> ${outs}`;
    })
    .join("\n");

  const buildings = Object.values(BUILDINGS)
    .map(
      (b) =>
        `${b.name}: ${b.power.baseMW}MW${b.power.mode === "variable" ? ` (${b.power.minMW}-${b.power.maxMW}MW)` : ""}, ${b.inputSlots}in/${b.outputSlots}out`,
    )
    .join("\n");

  return `<game-data>
<items>
${items}
</items>

<recipes>
${recipes}
</recipes>

<buildings>
${buildings}
</buildings>
</game-data>`;
}

const GAME_DATA_SECTION = formatGameData();

export function buildSystemPrompt(factory: FactorySnapshot): string {
  const liveSection = factory.isConnected
    ? `<live-factory-data>
<power>
${summarizePower(factory.powerCircuits)}
</power>

<production>
${summarizeProduction(factory.productionStats)}
</production>

<inventory>
${summarizeInventory(factory.inventory)}
</inventory>

<machines>
${summarizeMachines(factory.machines)}
</machines>
</live-factory-data>`
    : "<live-factory-data>\nNot connected to game. No live data available.\n</live-factory-data>";

  return `You are a Satisfactory game assistant integrated into a factory planner application. You help players with:
- Analyzing their live factory data (power, production, inventory, machines)
- Optimization advice (bottleneck detection, efficiency improvements, power management)
- Production planning (recipe chains, building counts, resource requirements)
- Recipe guidance (default vs alternate recipes, trade-offs)
- General Satisfactory game knowledge

When the user's factory is connected, you have access to real-time data shown below. Reference specific numbers when answering. If data shows issues (fuse tripped, idle machines, low efficiency), proactively mention them.

For production calculations, use the exact recipe rates from the game data. Show your math when calculating building counts or resource needs.

Keep responses concise but thorough. Use bullet points and numbers for clarity. When suggesting improvements, prioritize by impact.

${GAME_DATA_SECTION}

${liveSection}`;
}
