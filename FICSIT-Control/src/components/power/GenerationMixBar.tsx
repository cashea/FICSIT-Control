import type { FRMGenerator } from "../../types";
import { groupGeneratorsByCategory, GENERATOR_COLORS } from "../../utils/power";
import { formatMW } from "../../utils/format";

export function GenerationMixBar({ generators }: { generators: FRMGenerator[] }) {
  const groups = groupGeneratorsByCategory(generators);
  const totalMW = groups.reduce((s, g) => s + g.totalMW, 0);

  if (generators.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
        <h3 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)] mb-3">
          Generation Mix
        </h3>
        <p className="text-xs text-[var(--color-satisfactory-text-dim)]">
          Awaiting generator data...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--color-satisfactory-text-dim)]">
          Generation Mix
        </h3>
        <span className="text-xs text-[var(--color-satisfactory-text-dim)]">
          {formatMW(totalMW)} total
        </span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-6 rounded overflow-hidden bg-[var(--color-satisfactory-dark)]">
        {groups.map((g) => {
          const pct = totalMW > 0 ? (g.totalMW / totalMW) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={g.category}
              style={{
                width: `${pct}%`,
                backgroundColor: GENERATOR_COLORS[g.category],
              }}
              className="transition-all duration-500 relative group"
              title={`${g.category}: ${formatMW(g.totalMW)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
        {groups.map((g) => (
          <div key={g.category} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: GENERATOR_COLORS[g.category] }}
            />
            <span className="text-[var(--color-satisfactory-text-dim)]">
              {g.category}
            </span>
            <span className="text-[var(--color-satisfactory-text)] font-medium">
              {formatMW(g.totalMW)}
            </span>
            <span className="text-[var(--color-satisfactory-text-dim)]">
              x{g.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
