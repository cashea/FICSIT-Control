import { useState } from "react";
import { Download, AlertTriangle, X } from "lucide-react";
import { useFactoryStore } from "../../stores/factory-store";
import { useConnectionStore } from "../../stores/connection-store";
import { usePlannerStore } from "../../stores/planner-store";
import { importFactory, type ImportResult } from "../../solver/factory-import";
import { RECIPES } from "../../data/recipes";

export function FactoryImportButton() {
  const status = useConnectionStore((s) => s.status);
  const productionStats = useFactoryStore((s) => s.productionStats);
  const machines = useFactoryStore((s) => s.machines);
  const targets = usePlannerStore((s) => s.targets);
  const importTargets = usePlannerStore((s) => s.importTargets);
  const mergeTargets = usePlannerStore((s) => s.mergeTargets);

  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const isConnected = status === "connected";
  const hasData = productionStats.length > 0;
  const hasExisting = targets.length > 0;

  function handleClick() {
    const allMachines = Object.values(machines).flat();
    const r = importFactory(productionStats, allMachines);
    setResult(r);
    setShowModal(true);
  }

  function handleConfirm(mode: "replace" | "merge") {
    if (!result) return;
    const { targets: t, recipeOverrides: o } = result.input;
    if (mode === "replace") importTargets(t, o);
    else mergeTargets(t, o);
    setShowModal(false);
    setResult(null);
  }

  function handleClose() {
    setShowModal(false);
    setResult(null);
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!isConnected || !hasData}
        title={
          !isConnected
            ? "Connect to factory first"
            : !hasData
              ? "Waiting for production data..."
              : "Import production targets from live factory"
        }
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] hover:border-[var(--color-satisfactory-orange)]/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Download className="w-3.5 h-3.5" />
        Import from Factory
      </button>

      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md mx-4 rounded-lg border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-bg)] shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-satisfactory-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-satisfactory-text)]">
                Import from Factory
              </h3>
              <button
                onClick={handleClose}
                className="p-1 text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Detected outputs */}
              {result.detectedOutputs.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-[var(--color-satisfactory-text-dim)] mb-2">
                    Detected {result.detectedOutputs.length} production target(s):
                  </p>
                  <div className="space-y-1">
                    {result.detectedOutputs.map((o) => (
                      <div
                        key={o.itemId}
                        className="flex justify-between px-3 py-1.5 text-sm rounded bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)]"
                      >
                        <span className="text-[var(--color-satisfactory-text)]">
                          {o.name}
                        </span>
                        <span className="text-[var(--color-satisfactory-orange)] font-mono">
                          {o.netRate.toFixed(1)}/min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-satisfactory-text-dim)]">
                  No net production outputs detected. Your factory may only be
                  producing intermediates consumed internally.
                </p>
              )}

              {/* Recipe overrides */}
              {Object.keys(result.input.recipeOverrides).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--color-satisfactory-text-dim)] mb-2">
                    Alternate recipes detected:
                  </p>
                  <div className="space-y-1">
                    {Object.entries(result.input.recipeOverrides).map(
                      ([itemId, recipeId]) => (
                        <div
                          key={itemId}
                          className="px-3 py-1.5 text-xs rounded bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)]"
                        >
                          {RECIPES[recipeId]?.name ?? recipeId}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="flex gap-2 p-3 rounded bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
                  <div className="text-xs text-[var(--color-warning)]">
                    {result.warnings.map((w, i) => (
                      <p key={i}>{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing targets notice */}
              {hasExisting && result.detectedOutputs.length > 0 && (
                <p className="text-xs text-[var(--color-satisfactory-text-dim)]">
                  Your planner has {targets.length} existing target(s).
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--color-satisfactory-border)]">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] transition-colors"
              >
                Cancel
              </button>
              {result.detectedOutputs.length > 0 && (
                <>
                  {hasExisting && (
                    <button
                      onClick={() => handleConfirm("merge")}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] text-[var(--color-satisfactory-text)] hover:border-[var(--color-satisfactory-orange)]/50 transition-colors"
                    >
                      Merge
                    </button>
                  )}
                  <button
                    onClick={() => handleConfirm("replace")}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-dark)] hover:opacity-90 transition-opacity"
                  >
                    {hasExisting ? "Replace All" : "Import"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
