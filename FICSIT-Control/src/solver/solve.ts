import { ITEMS } from "../data/items";
import { RECIPES, DEFAULT_RECIPE_FOR_ITEM } from "../data/recipes";
import type {
  SolverInput,
  SolverOutput,
  ProductionNode,
  SolverEdge,
  BuildingId,
} from "../types";
import { calculatePower } from "./power";

interface DemandEntry {
  itemId: string;
  ratePerMinute: number;
  requestedBy: string | null; // nodeId of downstream consumer, null for user targets
}

export function solve(input: SolverInput): SolverOutput {
  const nodes = new Map<string, ProductionNode>();
  const edges: SolverEdge[] = [];
  const warnings: string[] = [];
  const byproducts = new Map<string, number>();
  const rawResources = new Map<string, number>();
  const resolving = new Set<string>();

  // Preprocess: merge duplicate targets for the same item
  const mergedTargets = new Map<string, number>();
  for (const target of input.targets) {
    if (target.ratePerMinute <= 0) continue;
    mergedTargets.set(
      target.itemId,
      (mergedTargets.get(target.itemId) ?? 0) + target.ratePerMinute,
    );
  }

  // Seed demand queue
  const demandQueue: DemandEntry[] = [];
  for (const [itemId, ratePerMinute] of mergedTargets) {
    demandQueue.push({ itemId, ratePerMinute, requestedBy: null });
  }

  // BFS backward propagation
  while (demandQueue.length > 0) {
    const demand = demandQueue.shift()!;

    // Credit byproducts against demand
    const available = byproducts.get(demand.itemId) ?? 0;
    if (available > 0) {
      if (available >= demand.ratePerMinute - 1e-6) {
        byproducts.set(demand.itemId, available - demand.ratePerMinute);
        continue;
      }
      demand.ratePerMinute -= available;
      byproducts.set(demand.itemId, 0);
    }

    // Raw resource — accumulate
    const item = ITEMS[demand.itemId];
    if (!item) {
      warnings.push(`Unknown item: ${demand.itemId}`);
      continue;
    }
    if (item.isRawResource) {
      rawResources.set(
        demand.itemId,
        (rawResources.get(demand.itemId) ?? 0) + demand.ratePerMinute,
      );
      continue;
    }

    // Circular dependency check
    if (resolving.has(demand.itemId)) {
      warnings.push(
        `Circular dependency detected for ${item.name}. Chain terminated.`,
      );
      continue;
    }
    resolving.add(demand.itemId);

    // Select recipe
    const recipe = input.recipeOverrides[demand.itemId]
      ? RECIPES[input.recipeOverrides[demand.itemId]]
      : DEFAULT_RECIPE_FOR_ITEM[demand.itemId];

    if (!recipe) {
      warnings.push(`No recipe found for ${item.name}`);
      resolving.delete(demand.itemId);
      continue;
    }

    // Find the output rate for the demanded item
    const outputEntry = recipe.outputs.find((o) => o.itemId === demand.itemId);
    if (!outputEntry) {
      warnings.push(
        `Recipe "${recipe.name}" does not output ${item.name}`,
      );
      resolving.delete(demand.itemId);
      continue;
    }

    const buildingCount = demand.ratePerMinute / outputEntry.ratePerMinute;
    const nodeId = `${recipe.id}::${demand.itemId}`;

    const existing = nodes.get(nodeId);
    if (existing) {
      // Merge into existing node
      const additionalCount = buildingCount;
      const oldCount = existing.buildingCount;
      const newCount = oldCount + additionalCount;
      const scaleFactor = newCount / oldCount;

      existing.buildingCount = newCount;
      for (const inp of existing.inputs) {
        inp.ratePerMinute *= scaleFactor;
      }
      for (const out of existing.outputs) {
        out.ratePerMinute *= scaleFactor;
      }
      existing.powerMW = calculatePower(recipe.buildingId, newCount);

      // Enqueue additional input demands
      for (const inp of recipe.inputs) {
        demandQueue.push({
          itemId: inp.itemId,
          ratePerMinute: inp.ratePerMinute * additionalCount,
          requestedBy: nodeId,
        });
      }

      // Track additional byproducts
      for (const out of recipe.outputs) {
        if (out.itemId !== demand.itemId) {
          byproducts.set(
            out.itemId,
            (byproducts.get(out.itemId) ?? 0) +
              out.ratePerMinute * additionalCount,
          );
        }
      }

      // Add edge from this node to downstream consumer
      if (demand.requestedBy) {
        edges.push({
          fromNodeId: nodeId,
          toNodeId: demand.requestedBy,
          itemId: demand.itemId,
          ratePerMinute: demand.ratePerMinute,
        });
      }
    } else {
      // Create new node
      const scaledInputs = recipe.inputs.map((i) => ({
        itemId: i.itemId,
        ratePerMinute: i.ratePerMinute * buildingCount,
      }));
      const scaledOutputs = recipe.outputs.map((o) => ({
        itemId: o.itemId,
        ratePerMinute: o.ratePerMinute * buildingCount,
      }));

      const node: ProductionNode = {
        id: nodeId,
        recipeId: recipe.id,
        buildingId: recipe.buildingId,
        buildingCount,
        clockSpeed: 100,
        inputs: scaledInputs,
        outputs: scaledOutputs,
        powerMW: calculatePower(recipe.buildingId, buildingCount),
      };
      nodes.set(nodeId, node);

      // Add edge to downstream consumer
      if (demand.requestedBy) {
        edges.push({
          fromNodeId: nodeId,
          toNodeId: demand.requestedBy,
          itemId: demand.itemId,
          ratePerMinute: demand.ratePerMinute,
        });
      }

      // Enqueue input demands
      for (const inp of recipe.inputs) {
        demandQueue.push({
          itemId: inp.itemId,
          ratePerMinute: inp.ratePerMinute * buildingCount,
          requestedBy: nodeId,
        });
      }

      // Track byproducts
      for (const out of recipe.outputs) {
        if (out.itemId !== demand.itemId) {
          byproducts.set(
            out.itemId,
            (byproducts.get(out.itemId) ?? 0) +
              out.ratePerMinute * buildingCount,
          );
        }
      }
    }

    resolving.delete(demand.itemId);
  }

  // Warn about unhandled byproducts
  for (const [itemId, rate] of byproducts) {
    if (rate > 0.01) {
      const name = ITEMS[itemId]?.name ?? itemId;
      warnings.push(
        `Byproduct: ${rate.toFixed(1)}/min of ${name} produced but not consumed`,
      );
    }
  }

  // Aggregate power by building
  // Use Object.create(null) to avoid prototype collisions (e.g. "constructor" key)
  const powerByBuilding: Record<BuildingId, { count: number; totalMW: number }> =
    Object.create(null);
  let totalPowerMW = 0;
  for (const node of nodes.values()) {
    totalPowerMW += node.powerMW;
    if (!powerByBuilding[node.buildingId]) {
      powerByBuilding[node.buildingId] = { count: 0, totalMW: 0 };
    }
    powerByBuilding[node.buildingId].count += node.buildingCount;
    powerByBuilding[node.buildingId].totalMW += node.powerMW;
  }

  // Collect raw resources
  const rawResourcesList = Array.from(rawResources.entries()).map(
    ([itemId, ratePerMinute]) => ({ itemId, ratePerMinute }),
  );

  return {
    nodes: Array.from(nodes.values()),
    edges,
    rawResources: rawResourcesList,
    totalPowerMW,
    powerByBuilding,
    warnings,
  };
}
