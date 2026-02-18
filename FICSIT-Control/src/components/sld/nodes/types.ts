import type { Node } from "@xyflow/react";
import type { GeneratorCategory } from "../../../utils/power";

export interface GeneratorGroupNodeData extends Record<string, unknown> {
  circuitId: number;
  category: GeneratorCategory;
  count: number;
  totalMW: number;
  maxMW: number;
  avgFuelPercent: number;
  categoryColor: string;
}

export interface BusBarNodeData extends Record<string, unknown> {
  circuitId: number;
  powerProduction: number;
  powerConsumed: number;
  powerCapacity: number;
  utilization: number;
  fuseTripped: boolean;
}

export interface FuseNodeData extends Record<string, unknown> {
  circuitId: number;
  fuseTripped: boolean;
}

export interface ConsumerGroupNodeData extends Record<string, unknown> {
  circuitId: number;
  name: string;
  count: number;
  totalPowerDraw: number;
  maxPowerDraw: number;
  activeCount: number;
  pausedCount: number;
}

export interface BatteryNodeData extends Record<string, unknown> {
  circuitId: number;
  batteryPercent: number;
  batteryCapacity: number;
  batteryDifferential: number;
  batteryTimeEmpty: string;
  batteryTimeFull: string;
}

export type GeneratorGroupNode = Node<GeneratorGroupNodeData, "generatorGroup">;
export type BusBarNode = Node<BusBarNodeData, "busBar">;
export type FuseNode = Node<FuseNodeData, "fuse">;
export type ConsumerGroupNode = Node<ConsumerGroupNodeData, "consumerGroup">;
export type BatteryNode = Node<BatteryNodeData, "battery">;

export type SLDNode =
  | GeneratorGroupNode
  | BusBarNode
  | FuseNode
  | ConsumerGroupNode
  | BatteryNode;
