import "@xyflow/react/dist/style.css";
import { useMemo, useEffect } from "react";
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

import type { Item, Recipe } from "../../types";
import { layoutRecipeTree } from "./layout/recipe-tree-layout";
import { ItemNodeComponent } from "./nodes/ItemNode";
import { RecipeNodeComponent } from "./nodes/RecipeNode";
import { RecipeFlowEdge } from "./edges/RecipeFlowEdge";
import { RECIPE_TREE_GRAPH_PROPS, CATEGORY_COLORS } from "./recipe-tree-theme";
import type { RecipeTreeAppNode } from "./nodes/types";
import type { RecipeTreeEdge } from "./edges/types";
import type { ItemCategory } from "../../types";

const nodeTypes = {
  item: ItemNodeComponent,
  recipe: RecipeNodeComponent,
};

const edgeTypes = {
  recipeFlow: RecipeFlowEdge,
};

interface RecipeTreeGraphProps {
  visibleItems: Item[];
  visibleRecipes: Recipe[];
  inventoryMap: Map<string, number>;
}

export function RecipeTreeGraph({
  visibleItems,
  visibleRecipes,
  inventoryMap,
}: RecipeTreeGraphProps) {
  // Structural fingerprint — only re-layout when the set of visible items/recipes changes
  const structuralKey = useMemo(() => {
    const itemIds = visibleItems.map((i) => i.id).sort().join(",");
    const recipeIds = visibleRecipes.map((r) => r.id).sort().join(",");
    return `${itemIds}|${recipeIds}`;
  }, [visibleItems, visibleRecipes]);

  // Layout computation
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutRecipeTree({ visibleItems, visibleRecipes, inventoryMap }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structuralKey, inventoryMap],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<RecipeTreeAppNode>(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RecipeTreeEdge>(layoutEdges);

  // Sync when layout changes
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  return (
    <div className="h-full rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-dark)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        {...RECIPE_TREE_GRAPH_PROPS}
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
            if (node.type === "item") {
              const cat = (node.data as { category?: ItemCategory }).category;
              return cat ? CATEGORY_COLORS[cat] : "#30363d";
            }
            return "#4b5563"; // gray for recipe nodes
          }}
          maskColor="rgba(13, 17, 23, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
