import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";

import { ITEMS } from "../../../data/items";
import { RECIPES } from "../../../data/recipes";
import { BUILDINGS } from "../../../data/buildings";
import type { SolverOutput } from "../../../types";
import type {
  AppNode,
  ProductionGraphNode,
  RawResourceGraphNode,
} from "../nodes/types";
import type { AppEdge } from "../edges/types";

const PRODUCTION_NODE_WIDTH = 280;
const PRODUCTION_NODE_HEIGHT = 180;
const RAW_RESOURCE_NODE_WIDTH = 200;
const RAW_RESOURCE_NODE_HEIGHT = 60;

export interface LayoutResult {
  nodes: AppNode[];
  edges: AppEdge[];
}

export function layoutSolverOutput(output: SolverOutput): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB",
    nodesep: 50,
    ranksep: 80,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 1. Raw resource source nodes
  const rawNodeIds = new Map<string, string>();
  for (const raw of output.rawResources) {
    const nodeId = `raw::${raw.itemId}`;
    rawNodeIds.set(raw.itemId, nodeId);
    g.setNode(nodeId, {
      width: RAW_RESOURCE_NODE_WIDTH,
      height: RAW_RESOURCE_NODE_HEIGHT,
    });
  }

  // 2. Production nodes
  for (const node of output.nodes) {
    g.setNode(node.id, {
      width: PRODUCTION_NODE_WIDTH,
      height: PRODUCTION_NODE_HEIGHT,
    });
  }

  // 3. Solver edges (production -> production)
  for (const edge of output.edges) {
    g.setEdge(edge.fromNodeId, edge.toNodeId);
  }

  // 4. Synthesize raw -> production edges
  const suppliedByEdge = new Set<string>();
  for (const edge of output.edges) {
    suppliedByEdge.add(`${edge.toNodeId}::${edge.itemId}`);
  }

  const rawEdges: Array<{
    rawNodeId: string;
    prodNodeId: string;
    itemId: string;
    rate: number;
  }> = [];

  for (const node of output.nodes) {
    for (const inp of node.inputs) {
      const rawNodeId = rawNodeIds.get(inp.itemId);
      if (rawNodeId && !suppliedByEdge.has(`${node.id}::${inp.itemId}`)) {
        rawEdges.push({
          rawNodeId,
          prodNodeId: node.id,
          itemId: inp.itemId,
          rate: inp.ratePerMinute,
        });
        g.setEdge(rawNodeId, node.id);
      }
    }
  }

  // 5. Run dagre layout
  dagre.layout(g);

  // 6. Build ReactFlow nodes
  const rfNodes: AppNode[] = [];

  for (const raw of output.rawResources) {
    const nodeId = rawNodeIds.get(raw.itemId)!;
    const pos = g.node(nodeId);

    const rfNode: RawResourceGraphNode = {
      id: nodeId,
      type: "rawResource",
      position: {
        x: pos.x - RAW_RESOURCE_NODE_WIDTH / 2,
        y: pos.y - RAW_RESOURCE_NODE_HEIGHT / 2,
      },
      data: {
        itemName: ITEMS[raw.itemId]?.name ?? raw.itemId,
        ratePerMinute: raw.ratePerMinute,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    rfNodes.push(rfNode);
  }

  // Build cycle duration lookup for edge per-cycle computation
  const nodeCycleDuration = new Map<string, number>();

  for (const node of output.nodes) {
    const pos = g.node(node.id);
    const recipe = RECIPES[node.recipeId];
    const building = BUILDINGS[node.buildingId as keyof typeof BUILDINGS];
    const cycleDuration = recipe?.cycleDuration ?? 1;
    nodeCycleDuration.set(node.id, cycleDuration);

    const rfNode: ProductionGraphNode = {
      id: node.id,
      type: "production",
      position: {
        x: pos.x - PRODUCTION_NODE_WIDTH / 2,
        y: pos.y - PRODUCTION_NODE_HEIGHT / 2,
      },
      data: {
        recipeName: recipe?.name ?? node.recipeId,
        buildingName: building?.name ?? node.buildingId,
        buildingCount: node.buildingCount,
        clockSpeed: node.clockSpeed,
        powerMW: node.powerMW,
        cycleDuration,
        inputs: node.inputs.map((inp) => ({
          itemName: ITEMS[inp.itemId]?.name ?? inp.itemId,
          ratePerMinute: inp.ratePerMinute,
          perCycle: (inp.ratePerMinute / 60) * cycleDuration,
        })),
        outputs: node.outputs.map((out) => ({
          itemName: ITEMS[out.itemId]?.name ?? out.itemId,
          ratePerMinute: out.ratePerMinute,
          perCycle: (out.ratePerMinute / 60) * cycleDuration,
        })),
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    rfNodes.push(rfNode);
  }

  // 7. Build ReactFlow edges
  const rfEdges: AppEdge[] = [];

  for (const edge of output.edges) {
    const cd = nodeCycleDuration.get(edge.toNodeId) ?? 1;
    rfEdges.push({
      id: `${edge.fromNodeId}->${edge.toNodeId}::${edge.itemId}`,
      type: "itemFlow",
      source: edge.fromNodeId,
      target: edge.toNodeId,
      data: {
        itemName: ITEMS[edge.itemId]?.name ?? edge.itemId,
        ratePerMinute: edge.ratePerMinute,
        perCycle: (edge.ratePerMinute / 60) * cd,
      },
    });
  }

  for (const re of rawEdges) {
    const cd = nodeCycleDuration.get(re.prodNodeId) ?? 1;
    rfEdges.push({
      id: `${re.rawNodeId}->${re.prodNodeId}::${re.itemId}`,
      type: "itemFlow",
      source: re.rawNodeId,
      target: re.prodNodeId,
      data: {
        itemName: ITEMS[re.itemId]?.name ?? re.itemId,
        ratePerMinute: re.rate,
        perCycle: (re.rate / 60) * cd,
      },
    });
  }

  return { nodes: rfNodes, edges: rfEdges };
}
