import type { ItemEfficiencyPoint } from "../../stores/factory-store";

const W = 140;
const H = 48;
const PAD = 2;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function EfficiencySparkline({ points }: { points: ItemEfficiencyPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="text-[10px] text-[var(--color-satisfactory-text-dim)] px-1">
        Collecting data...
      </div>
    );
  }

  const minT = points[0].time;
  const maxT = points[points.length - 1].time;
  const rangeT = maxT - minT || 1;

  const coords = points.map((p) => ({
    x: PAD + ((p.time - minT) / rangeT) * (W - PAD * 2),
    y: PAD + (1 - p.prodPercent / 100) * (H - PAD * 2),
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  // Gradient fill area
  const areaD = `${pathD} L${coords[coords.length - 1].x.toFixed(1)},${H - PAD} L${coords[0].x.toFixed(1)},${H - PAD} Z`;

  const latest = points[points.length - 1];
  const lineColor = latest.prodPercent > 50 ? "var(--color-warning)" : "var(--color-disconnected)";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] text-[var(--color-satisfactory-text-dim)]">
        <span>{formatTime(minT)}</span>
        <span className="font-medium" style={{ color: lineColor }}>
          {latest.prodPercent.toFixed(0)}%
        </span>
        <span>{formatTime(maxT)}</span>
      </div>
      <svg width={W} height={H} className="block">
        {/* 50% reference line */}
        <line
          x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2}
          stroke="var(--color-satisfactory-border)" strokeWidth={0.5} strokeDasharray="2,2"
        />
        {/* Fill area */}
        <path d={areaD} fill={lineColor} opacity={0.15} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* End dot */}
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={2} fill={lineColor} />
      </svg>
      <div className="text-[10px] text-[var(--color-satisfactory-text-dim)] text-center">
        {latest.currentProd.toFixed(1)} / {latest.maxProd.toFixed(1)} per min
      </div>
    </div>
  );
}
