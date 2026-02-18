import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node as RFNode,
} from "@xyflow/react";

import type { SolverOutput } from "../../types";
import { layoutSolverOutput } from "./layout/dagre-layout";
import { ProductionNodeComponent } from "./nodes/ProductionNodeComponent";
import { RawResourceNodeComponent } from "./nodes/RawResourceNode";
import { ItemFlowEdge } from "./edges/ItemFlowEdge";
import { GRAPH_PROPS } from "./graph-theme";
import type { AppNode } from "./nodes/types";
import type { AppEdge } from "./edges/types";

const nodeTypes = {
  production: ProductionNodeComponent,
  rawResource: RawResourceNodeComponent,
};

const edgeTypes = {
  itemFlow: ItemFlowEdge,
};

export function ProductionGraph({ output }: { output: SolverOutput }) {
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutSolverOutput(output),
    [output],
  );

  const [nodes, , onNodesChange] = useNodesState<AppNode>(layoutNodes);
  const [edges, , onEdgesChange] = useEdgesState<AppEdge>(layoutEdges);

  return (
    <div className="h-[600px] rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-dark)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        {...GRAPH_PROPS}
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
          nodeColor={(node: RFNode) =>
            node.type === "rawResource" ? "#d97706" : "#30363d"
          }
          maskColor="rgba(13, 17, 23, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
