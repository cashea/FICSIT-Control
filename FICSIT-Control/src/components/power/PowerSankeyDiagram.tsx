import { ResponsiveSankey } from "@nivo/sankey";
import type { FRMGenerator } from "../../types";
import {
  groupGeneratorsByCategory,
  GENERATOR_COLORS,
  type ConsumerGroup,
} from "../../utils/power";

interface SankeyNode {
  id: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

function buildSankeyData(
  generators: FRMGenerator[],
  consumers: ConsumerGroup[],
): { nodes: SankeyNode[]; links: SankeyLink[] } | null {
  const genGroups = groupGeneratorsByCategory(generators);
  if (genGroups.length === 0 && consumers.length === 0) return null;

  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Source nodes (generators)
  for (const g of genGroups) {
    if (g.totalMW > 0) {
      nodes.push({ id: g.category });
    }
  }

  // Sink nodes (consumers)
  const topConsumers = consumers.filter((c) => c.totalPowerDraw > 0).slice(0, 10);
  for (const c of topConsumers) {
    nodes.push({ id: c.name });
  }

  if (nodes.length === 0) return null;

  // If we have generators but no consumers, add a "No Load" node
  if (topConsumers.length === 0 && genGroups.some((g) => g.totalMW > 0)) {
    nodes.push({ id: "No Load" });
    for (const g of genGroups) {
      if (g.totalMW > 0) {
        links.push({ source: g.category, target: "No Load", value: g.totalMW });
      }
    }
    return { nodes, links };
  }

  // If we have consumers but no generators, add an "Unknown Source" node
  if (genGroups.every((g) => g.totalMW <= 0) && topConsumers.length > 0) {
    nodes.push({ id: "Unknown Source" });
    for (const c of topConsumers) {
      links.push({
        source: "Unknown Source",
        target: c.name,
        value: c.totalPowerDraw,
      });
    }
    return { nodes, links };
  }

  // Distribute generator output proportionally to consumers
  const totalConsumption = topConsumers.reduce(
    (s, c) => s + c.totalPowerDraw,
    0,
  );
  if (totalConsumption <= 0) return null;

  for (const g of genGroups) {
    if (g.totalMW <= 0) continue;
    for (const c of topConsumers) {
      const proportion = c.totalPowerDraw / totalConsumption;
      const linkValue = g.totalMW * proportion;
      if (linkValue > 0.01) {
        links.push({ source: g.category, target: c.name, value: linkValue });
      }
    }
  }

  return links.length > 0 ? { nodes, links } : null;
}

const CUSTOM_COLORS: Record<string, string> = {
  ...GENERATOR_COLORS,
};

export function PowerSankeyDiagram({
  generators,
  consumers,
}: {
  generators: FRMGenerator[];
  consumers: ConsumerGroup[];
}) {
  const data = buildSankeyData(generators, consumers);

  if (!data) {
    return (
      <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
        <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
          Power Flow
        </h4>
        <div className="h-[200px] flex items-center justify-center text-xs text-[var(--color-satisfactory-text-dim)]">
          Awaiting power flow data...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
      <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
        Power Flow
      </h4>
      <div className="h-[350px]">
        <ResponsiveSankey
          data={data}
          margin={{ top: 10, right: 140, bottom: 10, left: 140 }}
          align="justify"
          colors={(node) =>
            CUSTOM_COLORS[node.id as string] ?? "#f5a623"
          }
          nodeOpacity={1}
          nodeThickness={18}
          nodeSpacing={16}
          nodeBorderWidth={0}
          nodeBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
          linkOpacity={0.25}
          linkHoverOpacity={0.5}
          linkContract={3}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={12}
          labelTextColor="#e6edf3"
          theme={{
            text: { fill: "#e6edf3", fontSize: 11 },
            tooltip: {
              container: {
                background: "#161b22",
                color: "#e6edf3",
                border: "1px solid #30363d",
                fontSize: 12,
              },
            },
          }}
        />
      </div>
    </div>
  );
}
