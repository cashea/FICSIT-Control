import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { useControlStore } from "../../stores/control-store";
import type { CommandType, ControlFeatureMap } from "../../types";

interface ControlActionButtonProps {
  commandType: CommandType;
  payload: unknown;
  label: string;
  icon?: React.ReactNode;
  feature: keyof ControlFeatureMap;
  className?: string;
}

export function ControlActionButton({
  commandType,
  payload,
  label,
  icon,
  feature,
  className = "",
}: ControlActionButtonProps) {
  const { submitCommand, isFeatureAvailable, connectionStatus } = useControlStore();
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  if (connectionStatus !== "connected" || !isFeatureAvailable(feature)) {
    return null;
  }

  const handleClick = async () => {
    setState("submitting");
    const commandId = await submitCommand(commandType, payload);
    setState(commandId ? "success" : "error");
    setTimeout(() => setState("idle"), 2000);
  };

  const stateIcon =
    state === "submitting" ? <Loader2 className="w-3 h-3 animate-spin" /> :
    state === "success" ? <Check className="w-3 h-3 text-[var(--color-connected)]" /> :
    state === "error" ? <X className="w-3 h-3 text-[var(--color-disconnected)]" /> :
    icon;

  const stateLabel =
    state === "submitting" ? "..." :
    state === "success" ? "Done" :
    state === "error" ? "Failed" :
    label;

  return (
    <button
      onClick={handleClick}
      disabled={state === "submitting"}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded transition-colors bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] hover:bg-[var(--color-satisfactory-orange)]/30 disabled:opacity-50 ${className}`}
    >
      {stateIcon}
      {stateLabel}
    </button>
  );
}
