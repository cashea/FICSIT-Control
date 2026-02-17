export const FIT_VIEW_PADDING = 0.1;

export const GRAPH_PROPS = {
  fitView: true,
  fitViewOptions: { padding: FIT_VIEW_PADDING },
  minZoom: 0.1,
  maxZoom: 2,
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: true,
  panOnScroll: true,
  zoomOnScroll: true,
  proOptions: { hideAttribution: false },
} as const;
