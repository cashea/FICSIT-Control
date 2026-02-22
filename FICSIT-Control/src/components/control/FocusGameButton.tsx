import { useState } from "react";
import {
  Loader2,
  Check,
  X,
  Gamepad2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { focusSatisfactory } from "../../services/windowFocus/client";
import type { FocusResult } from "../../services/windowFocus/types";

export function FocusGameButton() {
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [lastResult, setLastResult] = useState<FocusResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const handleClick = async () => {
    setState("submitting");
    setErrorMessage(null);
    try {
      const result = await focusSatisfactory();
      setLastResult(result);
      if (result.ok) {
        setState("success");
      } else {
        setState("error");
        setErrorMessage(
          result.errors.length > 0
            ? result.errors.map((e) => e.message).join("; ")
            : "Could not focus Satisfactory window"
        );
      }
    } catch (err) {
      setState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Unknown error"
      );
      setLastResult(null);
    }
    setTimeout(() => setState("idle"), 3000);
  };

  const stateIcon =
    state === "submitting" ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : state === "success" ? (
      <Check className="w-3.5 h-3.5 text-[var(--color-connected)]" />
    ) : state === "error" ? (
      <X className="w-3.5 h-3.5 text-[var(--color-disconnected)]" />
    ) : (
      <Gamepad2 className="w-3.5 h-3.5" />
    );

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={state === "submitting"}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors bg-[var(--color-satisfactory-dark)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] hover:bg-[var(--color-satisfactory-border)] border border-[var(--color-satisfactory-border)] disabled:opacity-50"
        title="Bring Satisfactory window to foreground"
      >
        {stateIcon}
        {state === "submitting"
          ? "..."
          : state === "success"
            ? "Focused"
            : state === "error"
              ? "Failed"
              : "Focus Game"}
      </button>

      {/* Error popover */}
      {state === "error" && errorMessage && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-64 max-w-96 p-2 rounded bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] shadow-lg">
          <div className="text-xs text-[var(--color-disconnected)]">
            {errorMessage}
          </div>
          {lastResult && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
            >
              Debug{" "}
              {showDebug ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
          {showDebug && lastResult && (
            <FocusDebugPanel result={lastResult} />
          )}
        </div>
      )}
    </div>
  );
}

function FocusDebugPanel({ result }: { result: FocusResult }) {
  return (
    <div className="mt-1 p-2 bg-[var(--color-satisfactory-dark)] rounded border border-[var(--color-satisfactory-border)] text-[10px] font-mono space-y-1.5 max-h-48 overflow-y-auto">
      <div>
        <span className="text-[var(--color-satisfactory-text-dim)]">
          Candidates:{" "}
        </span>
        {result.candidates.length === 0 ? (
          <span className="text-[var(--color-disconnected)]">None found</span>
        ) : (
          result.candidates.map((c, i) => (
            <span key={i} className="text-[var(--color-satisfactory-text)]">
              {c.processName} (PID {c.pid})
              {i < result.candidates.length - 1 ? ", " : ""}
            </span>
          ))
        )}
      </div>

      {result.windows.length > 0 && (
        <div>
          <span className="text-[var(--color-satisfactory-text-dim)]">
            Windows ({result.windows.length}):
          </span>
          {result.windows.slice(0, 3).map((w, i) => (
            <div
              key={i}
              className="ml-2 text-[var(--color-satisfactory-text)]"
            >
              score={w.score} class=&quot;{w.className}&quot;
              {w.title ? ` "${w.title}"` : " (no title)"}{" "}
              {w.rect.r - w.rect.l}x{w.rect.b - w.rect.t}
              {w.isVisible ? "" : " [hidden]"}
            </div>
          ))}
        </div>
      )}

      {result.errors.length > 0 && (
        <div>
          <span className="text-[var(--color-disconnected)]">Errors:</span>
          {result.errors.map((e, i) => (
            <div key={i} className="ml-2 text-[var(--color-disconnected)]">
              [{e.step}] {e.message}
              {e.win32LastError !== undefined &&
                ` (Win32: ${e.win32LastError})`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
