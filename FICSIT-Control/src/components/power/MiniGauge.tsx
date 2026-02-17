function arcColor(pct: number, fuse: boolean): string {
  if (fuse) return "var(--color-disconnected)";
  if (pct > 0.9) return "var(--color-disconnected)";
  if (pct > 0.7) return "var(--color-warning)";
  return "var(--color-connected)";
}

export function MiniGauge({
  consumed,
  production,
  capacity,
  fuseTripped = false,
}: {
  consumed: number;
  production: number;
  capacity: number;
  fuseTripped?: boolean;
}) {
  const utilPct = capacity > 0 ? Math.min(consumed / capacity, 1.2) : 0;
  const prodPct = capacity > 0 ? Math.min(production / capacity, 1) : 0;
  const displayPct = (utilPct * 100).toFixed(0);

  const radius = 52;
  const stroke = 8;
  const cx = 60;
  const cy = 58;
  const circumference = Math.PI * radius;

  const consOffset = circumference * (1 - Math.min(utilPct, 1));
  const prodOffset = circumference * (1 - prodPct);

  const color = arcColor(utilPct, fuseTripped);

  return (
    <svg width="120" height="68" viewBox="0 0 120 68" className="mx-auto">
      {/* Background arc */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="var(--color-satisfactory-dark)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Production arc (subtle) */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="var(--color-connected)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={prodOffset}
        opacity={0.2}
        className="transition-all duration-500"
      />
      {/* Consumption arc */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={consOffset}
        className="transition-all duration-700"
      />
      {/* Percentage text */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill="var(--color-satisfactory-text)"
        fontSize="18"
        fontWeight="bold"
      >
        {displayPct}%
      </text>
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        fill="var(--color-satisfactory-text-dim)"
        fontSize="9"
      >
        utilization
      </text>
    </svg>
  );
}
