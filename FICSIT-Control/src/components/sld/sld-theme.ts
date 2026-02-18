export const GENERATOR_NODE_WIDTH = 220;
export const GENERATOR_NODE_HEIGHT = 100;

export const BUS_NODE_WIDTH = 60;
export const BUS_NODE_HEIGHT = 200;

export const FUSE_NODE_WIDTH = 80;
export const FUSE_NODE_HEIGHT = 80;

export const CONSUMER_NODE_WIDTH = 220;
export const CONSUMER_NODE_HEIGHT = 80;

export const BATTERY_NODE_WIDTH = 180;
export const BATTERY_NODE_HEIGHT = 90;

export const SLD_GRAPH_PROPS = {
  fitView: true,
  fitViewOptions: { padding: 0.15 },
  minZoom: 0.1,
  maxZoom: 2,
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: true,
  panOnScroll: false,
  zoomOnScroll: true,
  proOptions: { hideAttribution: false },
} as const;

export const MAX_CONSUMER_GROUPS = 8;

export function utilizationColor(utilization: number, fuseTripped: boolean): string {
  if (fuseTripped || utilization >= 1.0) return "var(--color-disconnected)";
  if (utilization >= 0.8) return "var(--color-warning)";
  return "var(--color-connected)";
}
