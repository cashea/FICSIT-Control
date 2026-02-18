import "@xyflow/react/dist/style.css";
import { useMemo, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node as RFNode,
  type NodeMouseHandler,
} from "@xyflow/react";

import { useFactoryStore } from "../../stores/factory-store";
import { buildSLDGraph } from "./layout/sld-layout";
import { GeneratorGroupNodeComponent } from "./nodes/GeneratorGroupNode";
import { BusBarNodeComponent } from "./nodes/BusBarNode";
import { FuseNodeComponent } from "./nodes/FuseNode";
import { ConsumerGroupNodeComponent } from "./nodes/ConsumerGroupNode";
import { BatteryNodeComponent } from "./nodes/BatteryNode";
import { PowerFlowEdge } from "./edges/PowerFlowEdge";
import { SLD_GRAPH_PROPS } from "./sld-theme";
import type { SLDNode } from "./nodes/types";
import type { SLDEdge } from "./edges/types";

const nodeTypes = {
  generatorGroup: GeneratorGroupNodeComponent,
  busBar: BusBarNodeComponent,
  fuse: FuseNodeComponent,
  consumerGroup: ConsumerGroupNodeComponent,
  battery: BatteryNodeComponent,
};

const edgeTypes = {
  powerFlow: PowerFlowEdge,
};

interface SingleLineDiagramProps {
  onCircuitSelect?: (circuitId: number) => void;
}

export function SingleLineDiagram({ onCircuitSelect }: SingleLineDiagramProps) {
  const { powerCircuits, generators, machines } = useFactoryStore();

  // Structural fingerprint — only re-layout when topology changes
  const structuralKey = useMemo(() => {
    const circuitIds = powerCircuits.map((c) => c.CircuitGroupID).sort().join(",");
    const genKey = generators
      .map((g) => `${g.ClassName}:${g.CircuitID}`)
      .sort()
      .join(",");
    const machineTypes = Object.keys(machines).sort().join(",");
    return `${circuitIds}|${genKey}|${machineTypes}`;
  }, [powerCircuits, generators, machines]);

  // Layout — only recomputed on structural changes
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildSLDGraph(powerCircuits, generators, machines),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structuralKey],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<SLDNode>(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<SLDEdge>(layoutEdges);

  // Sync layout changes
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  // Patch node data on value changes without re-layout
  useEffect(() => {
    const freshLayout = buildSLDGraph(powerCircuits, generators, machines);
    const dataMap = new Map(freshLayout.nodes.map((n) => [n.id, n.data]));
    const edgeDataMap = new Map(freshLayout.edges.map((e) => [e.id, e.data]));

    setNodes((prev) =>
      prev.map((node) => {
        const freshData = dataMap.get(node.id);
        return freshData ? { ...node, data: freshData } as SLDNode : node;
      }),
    );
    setEdges((prev) =>
      prev.map((edge) => {
        const freshData = edgeDataMap.get(edge.id);
        return freshData ? { ...edge, data: freshData } as SLDEdge : edge;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [powerCircuits, generators, machines]);

  // Click handler — bus/fuse nodes drill down
  const handleNodeClick: NodeMouseHandler<SLDNode> = useCallback(
    (_event, node) => {
      if (!onCircuitSelect) return;
      if (node.type === "busBar" || node.type === "fuse") {
        const circuitId = (node.data as { circuitId: number }).circuitId;
        onCircuitSelect(circuitId);
      }
    },
    [onCircuitSelect],
  );

  return (
    <div className="h-full rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-dark)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        {...SLD_GRAPH_PROPS}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--color-satisfactory-border)"
        />
        <Controls
          className="!bg-[var(--color-satisfactory-panel)] !border-[var(--color-satisfactory-border)] !shadow-none [&>button]:!bg-[var(--color-satisfactory-panel)] [&>button]:!border-[var(--color-satisfactory-border)] [&>button]:!text-[var(--color-satisfactory-text-dim)] [&>button:hover]:!text-[var(--color-satisfactory-text)]"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-[var(--color-satisfactory-panel)] !border-[var(--color-satisfactory-border)]"
          nodeColor={(node: RFNode) => {
            switch (node.type) {
              case "generatorGroup":
                return "#3fb950";
              case "busBar":
                return "#6b7280";
              case "fuse":
                return "#d29922";
              case "consumerGroup":
                return "#d97706";
              case "battery":
                return "#06b6d4";
              default:
                return "#30363d";
            }
          }}
          maskColor="rgba(13, 17, 23, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
