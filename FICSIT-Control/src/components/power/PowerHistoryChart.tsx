import { ResponsiveLine } from "@nivo/line";
import type { PowerSnapshot } from "../../stores/factory-store";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Deduplicate & sort: keep only one point per 2s window */
function cleanHistory(raw: PowerSnapshot[]): PowerSnapshot[] {
  const sorted = [...raw].sort((a, b) => a.time - b.time);
  const out: PowerSnapshot[] = [];
  for (const s of sorted) {
    const prev = out[out.length - 1];
    if (prev && s.time - prev.time < 2000) continue;
    out.push(s);
  }
  return out;
}

export function PowerHistoryChart({ history: raw }: { history: PowerSnapshot[] }) {
  const history = cleanHistory(raw);
  if (history.length < 2) {
    return (
      <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
        <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
          Power History
        </h4>
        <div className="h-[200px] flex items-center justify-center text-xs text-[var(--color-satisfactory-text-dim)]">
          Collecting data...
        </div>
      </div>
    );
  }

  // Use small offsets (seconds from start) instead of raw timestamps
  // to avoid floating-point precision issues in curve interpolation
  const t0 = history[0].time;

  const data = [
    {
      id: "Capacity",
      data: history.map((s) => ({ x: (s.time - t0) / 1000, y: s.capacity })),
    },
    {
      id: "Production",
      data: history.map((s) => ({ x: (s.time - t0) / 1000, y: s.production })),
    },
    {
      id: "Consumption",
      data: history.map((s) => ({ x: (s.time - t0) / 1000, y: s.consumed })),
    },
  ];

  const seriesColors: Record<string, string> = {
    Capacity: "#8b949e",
    Production: "#3fb950",
    Consumption: "#f5a623",
  };

  // Build a map from offset-seconds back to real timestamps for axis labels
  const offsetToTime = new Map<number, number>();
  for (const s of history) offsetToTime.set((s.time - t0) / 1000, s.time);

  // Pick ~6 ticks spread across the time range
  const tickCount = Math.min(6, history.length);
  const step = Math.max(1, Math.floor((history.length - 1) / (tickCount - 1)));
  const tickValues: number[] = [];
  for (let i = 0; i < history.length; i += step) {
    tickValues.push((history[i].time - t0) / 1000);
  }
  const lastOffset = (history[history.length - 1].time - t0) / 1000;
  if (tickValues[tickValues.length - 1] !== lastOffset) {
    tickValues.push(lastOffset);
  }

  return (
    <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
      <h4 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
        Power History
      </h4>
      <div className="h-[250px]">
        <ResponsiveLine
          data={data}
          margin={{ top: 10, right: 20, bottom: 35, left: 55 }}
          xScale={{ type: "linear", min: "auto", max: "auto" }}
          yScale={{ type: "linear", min: 0, stacked: false }}
          colors={(series) => seriesColors[series.id as string] ?? "#f5a623"}
          curve="monotoneX"
          lineWidth={2}
          enablePoints={false}
          enableArea={false}
          useMesh={true}
          enableSlices="x"
          axisBottom={{
            tickValues,
            format: (v) => {
              const ts = offsetToTime.get(v as number);
              return ts ? formatTime(ts) : "";
            },
            tickSize: 4,
            tickPadding: 6,
          }}
          axisLeft={{
            format: (v) => `${v} MW`,
            tickSize: 4,
            tickPadding: 6,
          }}
          legends={[
            {
              anchor: "top-left",
              direction: "row",
              translateY: -5,
              itemWidth: 90,
              itemHeight: 16,
              symbolSize: 10,
              symbolShape: "circle",
              itemTextColor: "#8b949e",
            },
          ]}
          sliceTooltip={({ slice }) => {
            const offsetSec = slice.points[0].data.x as number;
            const ts = offsetToTime.get(offsetSec);
            return (
              <div className="rounded bg-[#161b22] border border-[#30363d] px-3 py-2 text-xs">
                <div className="text-[#8b949e] mb-1">
                  {ts ? formatTime(ts) : `${offsetSec.toFixed(0)}s`}
                </div>
                {slice.points.map((p) => (
                  <div key={p.serieId} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: p.serieColor }}
                    />
                    <span style={{ color: p.serieColor }}>{p.serieId}</span>
                    <span className="text-[#e6edf3] ml-auto pl-3">
                      {(p.data.y as number).toFixed(1)} MW
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
          theme={{
            text: { fill: "#8b949e", fontSize: 10 },
            axis: {
              ticks: { text: { fill: "#8b949e", fontSize: 10 } },
            },
            grid: {
              line: { stroke: "#21262d", strokeWidth: 1 },
            },
            crosshair: {
              line: { stroke: "#484f58", strokeWidth: 1 },
            },
          }}
        />
      </div>
    </div>
  );
}
