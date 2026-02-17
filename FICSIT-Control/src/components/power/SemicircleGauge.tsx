export function SemicircleGauge({
  value,
  max,
  fuseTripped = false,
}: {
  value: number;
  max: number;
  fuseTripped?: boolean;
}) {
  const pct = max > 0 ? Math.min(value / max, 1.2) : 0;
  const displayPct = (pct * 100).toFixed(0);

  const radius = 70;
  const stroke = 12;
  const cx = 80;
  const cy = 80;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - Math.min(pct, 1));

  let arcColor: string;
  if (fuseTripped) arcColor = "var(--color-disconnected)";
  else if (pct > 0.9) arcColor = "var(--color-warning)";
  else if (pct > 0.7) arcColor = "var(--color-warning)";
  else arcColor = "var(--color-connected)";

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="95" viewBox="0 0 160 95">
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--color-satisfactory-dark)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={arcColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="var(--color-satisfactory-text)"
          fontSize="24"
        >
          {displayPct}%
        </text>
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fill="var(--color-satisfactory-text-dim)"
          fontSize="10"
        >
          utilization
        </text>
      </svg>
    </div>
  );
}
