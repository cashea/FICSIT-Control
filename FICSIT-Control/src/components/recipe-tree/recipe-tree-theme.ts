import type { ItemCategory } from "../../types";

export const ITEM_NODE_WIDTH = 160;
export const ITEM_NODE_HEIGHT = 70;

export const RECIPE_NODE_WIDTH = 200;
export const RECIPE_NODE_HEIGHT = 50;

export const RECIPE_TREE_GRAPH_PROPS = {
  fitView: true,
  fitViewOptions: { padding: 0.1 },
  minZoom: 0.05,
  maxZoom: 2,
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: true,
  panOnScroll: false,
  zoomOnScroll: true,
  proOptions: { hideAttribution: false },
} as const;

export const CATEGORY_COLORS: Record<ItemCategory, string> = {
  ore: "#d97706",
  fluid: "#0ea5e9",
  ingot: "#a3a3a3",
  component: "#22c55e",
  industrial: "#6366f1",
  communication: "#8b5cf6",
  "space-elevator": "#f43f5e",
  nuclear: "#eab308",
  quantum: "#a855f7",
  biomass: "#84cc16",
  ficsit: "#f97316",
  alien: "#14b8a6",
  ammo: "#ef4444",
  packaged: "#06b6d4",
};

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  ore: "Ore",
  fluid: "Fluid",
  ingot: "Ingot",
  component: "Component",
  industrial: "Industrial",
  communication: "Communication",
  "space-elevator": "Space Elevator",
  nuclear: "Nuclear",
  quantum: "Quantum",
  biomass: "Biomass",
  ficsit: "FICSIT",
  alien: "Alien",
  ammo: "Ammo",
  packaged: "Packaged",
};
