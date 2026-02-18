import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";

import type { FRMPowerCircuit, FRMGenerator, FRMMachine } from "../../../types";
import {
  groupGeneratorsByCategory,
  getConsumersForCircuit,
  GENERATOR_COLORS,
} from "../../../utils/power";
import type { SLDNode } from "../nodes/types";
import type { SLDEdge } from "../edges/types";
import {
  GENERATOR_NODE_WIDTH,
  GENERATOR_NODE_HEIGHT,
  BUS_NODE_WIDTH,
  BUS_NODE_HEIGHT,
  FUSE_NODE_WIDTH,
  FUSE_NODE_HEIGHT,
  CONSUMER_NODE_WIDTH,
  CONSUMER_NODE_HEIGHT,
  BATTERY_NODE_WIDTH,
  BATTERY_NODE_HEIGHT,
  MAX_CONSUMER_GROUPS,
} from "../sld-theme";

export interface SLDLayoutResult {
  nodes: SLDNode[];
  edges: SLDEdge[];
}

const CIRCUIT_GAP = 80;

export function buildSLDGraph(
  circuits: FRMPowerCircuit[],
  generators: FRMGenerator[],
  machines: Record<string, FRMMachine[]>,
): SLDLayoutResult {
  const allNodes: SLDNode[] = [];
  const allEdges: SLDEdge[] = [];
  let yOffset = 0;

  for (const circuit of circuits) {
    const cId = circuit.CircuitGroupID;
    const circuitGens = generators.filter((g) => g.CircuitID === cId);
    const genGroups = groupGeneratorsByCategory(circuitGens);
    const consumerGroups = getConsumersForCircuit(machines, cId)
      .slice(0, MAX_CONSUMER_GROUPS);
    const hasBattery = circuit.BatteryCapacity > 0;
    const utilization =
      circuit.PowerCapacity > 0
        ? circuit.PowerConsumed / circuit.PowerCapacity
        : 0;

    // Build dagre graph for this circuit
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: "LR",
      nodesep: 40,
      ranksep: 120,
      marginx: 40,
      marginy: 40,
    });
    g.setDefaultEdgeLabel(() => ({}));

    const busId = `c${cId}::bus`;
    const fuseId = `c${cId}::fuse`;

    // Generator group nodes
    for (const group of genGroups) {
      const nodeId = `c${cId}::gen::${group.category}`;
      g.setNode(nodeId, {
        width: GENERATOR_NODE_WIDTH,
        height: GENERATOR_NODE_HEIGHT,
      });
      g.setEdge(nodeId, busId);
    }

    // If no generators, still need the bus
    g.setNode(busId, {
      width: BUS_NODE_WIDTH,
      height: BUS_NODE_HEIGHT,
    });

    // Fuse node
    g.setNode(fuseId, {
      width: FUSE_NODE_WIDTH,
      height: FUSE_NODE_HEIGHT,
    });
    g.setEdge(busId, fuseId);

    // Consumer group nodes
    for (const group of consumerGroups) {
      const nodeId = `c${cId}::load::${group.name}`;
      g.setNode(nodeId, {
        width: CONSUMER_NODE_WIDTH,
        height: CONSUMER_NODE_HEIGHT,
      });
      g.setEdge(fuseId, nodeId);
    }

    // Run dagre layout
    dagre.layout(g);

    // Extract positioned nodes
    for (const group of genGroups) {
      const nodeId = `c${cId}::gen::${group.category}`;
      const pos = g.node(nodeId);
      allNodes.push({
        id: nodeId,
        type: "generatorGroup",
        position: {
          x: pos.x - GENERATOR_NODE_WIDTH / 2,
          y: pos.y - GENERATOR_NODE_HEIGHT / 2 + yOffset,
        },
        data: {
          circuitId: cId,
          category: group.category,
          count: group.count,
          totalMW: group.totalMW,
          maxMW: group.generators.reduce(
            (sum, gen) => sum + gen.PowerProductionPotential,
            0,
          ),
          avgFuelPercent:
            group.generators.length > 0
              ? group.generators.reduce((sum, gen) => sum + gen.FuelAmount, 0) /
                group.generators.length
              : 0,
          categoryColor: GENERATOR_COLORS[group.category],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }

    // Bus bar node
    const busPos = g.node(busId);
    allNodes.push({
      id: busId,
      type: "busBar",
      position: {
        x: busPos.x - BUS_NODE_WIDTH / 2,
        y: busPos.y - BUS_NODE_HEIGHT / 2 + yOffset,
      },
      data: {
        circuitId: cId,
        powerProduction: circuit.PowerProduction,
        powerConsumed: circuit.PowerConsumed,
        powerCapacity: circuit.PowerCapacity,
        utilization,
        fuseTripped: circuit.FuseTriggered,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Fuse node
    const fusePos = g.node(fuseId);
    allNodes.push({
      id: fuseId,
      type: "fuse",
      position: {
        x: fusePos.x - FUSE_NODE_WIDTH / 2,
        y: fusePos.y - FUSE_NODE_HEIGHT / 2 + yOffset,
      },
      data: {
        circuitId: cId,
        fuseTripped: circuit.FuseTriggered,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Consumer group nodes
    for (const group of consumerGroups) {
      const nodeId = `c${cId}::load::${group.name}`;
      const pos = g.node(nodeId);
      const groupMachines = group.machines;
      allNodes.push({
        id: nodeId,
        type: "consumerGroup",
        position: {
          x: pos.x - CONSUMER_NODE_WIDTH / 2,
          y: pos.y - CONSUMER_NODE_HEIGHT / 2 + yOffset,
        },
        data: {
          circuitId: cId,
          name: group.name,
          count: group.count,
          totalPowerDraw: group.totalPowerDraw,
          maxPowerDraw: groupMachines.reduce(
            (sum, m) => sum + m.PowerInfo.MaxPowerConsumed,
            0,
          ),
          activeCount: groupMachines.filter((m) => m.IsProducing).length,
          pausedCount: groupMachines.filter((m) => m.IsPaused).length,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }

    // Battery node — placed below the bus bar
    if (hasBattery) {
      const batteryId = `c${cId}::battery`;
      allNodes.push({
        id: batteryId,
        type: "battery",
        position: {
          x: busPos.x - BATTERY_NODE_WIDTH / 2,
          y: busPos.y + BUS_NODE_HEIGHT / 2 + 30 + yOffset,
        },
        data: {
          circuitId: cId,
          batteryPercent: circuit.BatteryPercent,
          batteryCapacity: circuit.BatteryCapacity,
          batteryDifferential: circuit.BatteryDifferential,
          batteryTimeEmpty: circuit.BatteryTimeEmpty,
          batteryTimeFull: circuit.BatteryTimeFull,
        },
        sourcePosition: Position.Top,
        targetPosition: Position.Left,
      });

      // Edge: battery -> bus
      allEdges.push({
        id: `${batteryId}->${busId}`,
        type: "powerFlow",
        source: batteryId,
        target: busId,
        sourceHandle: null,
        targetHandle: "battery",
        data: {
          powerMW: Math.abs(circuit.BatteryDifferential),
          utilization,
          direction: "battery",
        },
      });
    }

    // Edges: generators -> bus
    for (const group of genGroups) {
      const genNodeId = `c${cId}::gen::${group.category}`;
      allEdges.push({
        id: `${genNodeId}->${busId}`,
        type: "powerFlow",
        source: genNodeId,
        target: busId,
        data: {
          powerMW: group.totalMW,
          utilization,
          direction: "generation",
        },
      });
    }

    // Edge: bus -> fuse
    allEdges.push({
      id: `${busId}->${fuseId}`,
      type: "powerFlow",
      source: busId,
      target: fuseId,
      data: {
        powerMW: circuit.PowerConsumed,
        utilization,
        direction: "consumption",
      },
    });

    // Edges: fuse -> consumers
    for (const group of consumerGroups) {
      const loadNodeId = `c${cId}::load::${group.name}`;
      allEdges.push({
        id: `${fuseId}->${loadNodeId}`,
        type: "powerFlow",
        source: fuseId,
        target: loadNodeId,
        data: {
          powerMW: group.totalPowerDraw,
          utilization,
          direction: "consumption",
        },
      });
    }

    // Calculate bounding box height for this circuit to offset the next one
    const nodePositions = allNodes
      .filter((n) => n.id.startsWith(`c${cId}::`))
      .map((n) => n.position.y);
    const minY = Math.min(...nodePositions);
    const maxY = Math.max(...nodePositions);
    const circuitHeight = maxY - minY + BUS_NODE_HEIGHT + (hasBattery ? BATTERY_NODE_HEIGHT + 30 : 0);
    yOffset += circuitHeight + CIRCUIT_GAP;
  }

  return { nodes: allNodes, edges: allEdges };
}
