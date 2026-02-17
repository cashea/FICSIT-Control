import { useState } from "react";
import { Search } from "lucide-react";
import { useConnectionStore } from "../../stores/connection-store";
import { AssetSummaryCards } from "./AssetSummaryCards";
import { MachineAssetList } from "./MachineAssetList";
import { PowerCircuitList } from "./PowerCircuitList";
import { StorageAssetList } from "./StorageAssetList";

type Category = "all" | "machines" | "power" | "storage";

const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: "all", label: "All" },
  { id: "machines", label: "Machines" },
  { id: "power", label: "Power" },
  { id: "storage", label: "Storage" },
];

export function AssetsView() {
  const { status } = useConnectionStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");

  if (status !== "connected") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-satisfactory-text-dim)]">
        <p className="text-lg mb-2">Not connected to game</p>
        <p className="text-sm mb-4">
          Connect to FICSIT Remote Monitoring in the sidebar to view factory
          assets.
        </p>
        <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)] text-sm max-w-md">
          <p className="mb-2 text-[var(--color-satisfactory-text)]">
            In Satisfactory, open chat and type:
          </p>
          <code className="block px-3 py-2 bg-[var(--color-satisfactory-dark)] rounded text-[var(--color-satisfactory-orange)] font-mono">
            /frm http start
          </code>
          <p className="mt-2 text-xs">
            This starts the FRM web server so this app can connect to your game.
          </p>
        </div>
      </div>
    );
  }

  const normalizedSearch = search.toLowerCase().trim();

  return (
    <div className="space-y-6">
      <AssetSummaryCards />

      {/* Filter bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)]"
          />
        </div>
        <div className="flex items-center gap-1">
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                category === id
                  ? "bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)] font-medium"
                  : "bg-[var(--color-satisfactory-panel)] text-[var(--color-satisfactory-text-dim)] border border-[var(--color-satisfactory-border)] hover:text-[var(--color-satisfactory-text)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset sections */}
      {(category === "all" || category === "machines") && (
        <MachineAssetList search={normalizedSearch} />
      )}
      {(category === "all" || category === "power") && (
        <PowerCircuitList search={normalizedSearch} />
      )}
      {(category === "all" || category === "storage") && (
        <StorageAssetList search={normalizedSearch} />
      )}
    </div>
  );
}
