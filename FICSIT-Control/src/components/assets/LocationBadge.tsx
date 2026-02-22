import { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { formatLocation, getPakUtilityCommand } from "../../utils/format";

interface LocationBadgeProps {
  location: { x: number; y: number; z: number };
  className?: string;
}

export function LocationBadge({ location, className = "" }: LocationBadgeProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const command = getPakUtilityCommand(location);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch("http://127.0.0.1:3001/teleport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Server error");
    } catch {
      navigator.clipboard.writeText(command).catch(() => {});
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleClick}
      title="Click to teleport (or copy !tp command)"
      className={`inline-flex items-center gap-1 text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-orange)] transition-colors cursor-pointer ${className}`}
    >
      {copied ? (
        <Check className="w-3 h-3 text-[var(--color-connected)]" />
      ) : (
        <MapPin className="w-3 h-3" />
      )}
      <span className={copied ? "text-[var(--color-connected)]" : ""}>
        {copied ? "Sent!" : formatLocation(location)}
      </span>
    </button>
  );
}
