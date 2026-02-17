import { Factory, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { useFactoryStore } from "../../stores/factory-store";
import { useConnectionStore } from "../../stores/connection-store";

export function ProductionDashboard() {
  const { productionStats } = useFactoryStore();
  const { status } = useConnectionStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "prod" | "cons">("name");

  if (status !== "connected") {
    return (
      <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
        Connect to FRM to view production data
      </div>
    );
  }

  const filtered = productionStats
    .filter((s) => s.Name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.Name.localeCompare(b.Name);
      if (sortBy === "prod") return b.CurrentProd - a.CurrentProd;
      return b.CurrentConsumed - a.CurrentConsumed;
    });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Factory className="w-5 h-5 text-[var(--color-satisfactory-orange)]" />
        Production Stats
      </h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="flex-1 px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)]"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)]"
        >
          <option value="name">Sort: Name</option>
          <option value="prod">Sort: Production</option>
          <option value="cons">Sort: Consumption</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
          {productionStats.length === 0
            ? "No production data available"
            : "No matching items"}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((stat) => (
            <div
              key={stat.ClassName}
              className="flex items-center justify-between p-3 bg-[var(--color-satisfactory-panel)] rounded border border-[var(--color-satisfactory-border)]"
            >
              <span className="text-sm font-medium">{stat.Name}</span>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--color-connected)]" />
                  <span className="text-[var(--color-connected)]">
                    {stat.CurrentProd.toFixed(1)}
                  </span>
                  <span className="text-[var(--color-satisfactory-text-dim)]">
                    / {stat.MaxProd.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[var(--color-satisfactory-orange)]" />
                  <span className="text-[var(--color-satisfactory-orange)]">
                    {stat.CurrentConsumed.toFixed(1)}
                  </span>
                  <span className="text-[var(--color-satisfactory-text-dim)]">
                    / {stat.MaxConsumed.toFixed(1)}
                  </span>
                </div>
                <div className="w-16 text-right">
                  <span
                    className={`text-xs font-medium ${
                      stat.ProdPercent >= 90
                        ? "text-[var(--color-connected)]"
                        : stat.ProdPercent >= 50
                          ? "text-[var(--color-warning)]"
                          : "text-[var(--color-disconnected)]"
                    }`}
                  >
                    {stat.ProdPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
