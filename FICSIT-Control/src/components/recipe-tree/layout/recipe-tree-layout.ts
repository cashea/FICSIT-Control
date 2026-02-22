import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";

import { ITEMS } from "../../../data/items";
import { BUILDINGS } from "../../../data/buildings";
import type { Item, Recipe } from "../../../types";
import type { ItemTreeNode, RecipeTreeNode, RecipeTreeAppNode } from "../nodes/types";
import type { RecipeTreeEdge } from "../edges/types";
import {
  ITEM_NODE_WIDTH,
  ITEM_NODE_HEIGHT,
  RECIPE_NODE_WIDTH,
  RECIPE_NODE_HEIGHT,
} from "../recipe-tree-theme";

export interface RecipeTreeLayoutInput {
  visibleItems: Item[];
  visibleRecipes: Recipe[];
  inventoryMap: Map<string, number>;
}

export interface RecipeTreeLayoutResult {
  nodes: RecipeTreeAppNode[];
  edges: RecipeTreeEdge[];
}

export function layoutRecipeTree(input: RecipeTreeLayoutInput): RecipeTreeLayoutResult {
  const { visibleItems, visibleRecipes, inventoryMap } = input;

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: 30,
    ranksep: 60,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const visibleItemIds = new Set(visibleItems.map((i) => i.id));

  // 1. Add item nodes
  for (const item of visibleItems) {
    g.setNode(`item::${item.id}`, {
      width: ITEM_NODE_WIDTH,
      height: ITEM_NODE_HEIGHT,
    });
  }

  // 2. Add recipe nodes
  for (const recipe of visibleRecipes) {
    g.setNode(`recipe::${recipe.id}`, {
      width: RECIPE_NODE_WIDTH,
      height: RECIPE_NODE_HEIGHT,
    });
  }

  // 3. Add edges: input items → recipe, recipe → output items
  //    Only where both endpoints are visible
  const edgeDefs: Array<{
    source: string;
    target: string;
    itemId: string;
    sourceHandle?: string;
    targetHandle?: string;
  }> = [];

  for (const recipe of visibleRecipes) {
    recipe.inputs.forEach((inp, i) => {
      if (visibleItemIds.has(inp.itemId)) {
        const source = `item::${inp.itemId}`;
        const target = `recipe::${recipe.id}`;
        g.setEdge(source, target);
        edgeDefs.push({
          source,
          target,
          itemId: inp.itemId,
          targetHandle: `in-${i}`,
        });
      }
    });

    recipe.outputs.forEach((out, i) => {
      if (visibleItemIds.has(out.itemId)) {
        const source = `recipe::${recipe.id}`;
        const target = `item::${out.itemId}`;
        g.setEdge(source, target);
        edgeDefs.push({
          source,
          target,
          itemId: out.itemId,
          sourceHandle: `out-${i}`,
        });
      }
    });
  }

  // 4. Run dagre layout
  dagre.layout(g);

  // 5. Build ReactFlow nodes
  const rfNodes: RecipeTreeAppNode[] = [];

  for (const item of visibleItems) {
    const nodeId = `item::${item.id}`;
    const pos = g.node(nodeId);
    const count = inventoryMap.get(item.id) ?? 0;

    const rfNode: ItemTreeNode = {
      id: nodeId,
      type: "item",
      position: {
        x: pos.x - ITEM_NODE_WIDTH / 2,
        y: pos.y - ITEM_NODE_HEIGHT / 2,
      },
      data: {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        form: item.form,
        isRawResource: item.isRawResource,
        inventoryCount: count,
        hasInventory: count > 0,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    rfNodes.push(rfNode);
  }

  for (const recipe of visibleRecipes) {
    const nodeId = `recipe::${recipe.id}`;
    const pos = g.node(nodeId);
    const building = BUILDINGS[recipe.buildingId as keyof typeof BUILDINGS];

    const rfNode: RecipeTreeNode = {
      id: nodeId,
      type: "recipe",
      position: {
        x: pos.x - RECIPE_NODE_WIDTH / 2,
        y: pos.y - RECIPE_NODE_HEIGHT / 2,
      },
      data: {
        recipeId: recipe.id,
        recipeName: recipe.name,
        buildingName: building?.name ?? recipe.buildingId,
        buildingId: recipe.buildingId,
        isAlternate: recipe.isAlternate,
        inputCount: recipe.inputs.length,
        outputCount: recipe.outputs.length,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    rfNodes.push(rfNode);
  }

  // 6. Build ReactFlow edges
  const rfEdges: RecipeTreeEdge[] = edgeDefs.map((e, i) => ({
    id: `${e.source}->${e.target}::${e.itemId}::${i}`,
    type: "recipeFlow",
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    data: {
      itemName: ITEMS[e.itemId]?.name ?? e.itemId,
      itemId: e.itemId,
    },
  }));

  return { nodes: rfNodes, edges: rfEdges };
}
