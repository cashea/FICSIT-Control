import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapPin, Check, Star } from "lucide-react";
import { formatLocation, getPakUtilityCommand } from "../../utils/format";
import { useFavoritesStore } from "../../stores/favorites-store";

interface LocationBadgeProps {
  location: { x: number; y: number; z: number };
  entityType?: string;
  entityName?: string;
  className?: string;
}

export function LocationBadge({ location, entityType, entityName, className = "" }: LocationBadgeProps) {
  const [copied, setCopied] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const addFavorite = useFavoritesStore((s) => s.addFavorite);

  // Close menu on click-outside or Escape
  useEffect(() => {
    if (!menuPos) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuPos(null);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuPos]);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const command = getPakUtilityCommand(location);

    await navigator.clipboard.writeText(command).catch(() => {});

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
      // Server not running — command is already on clipboard
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setSaved(false);
  }

  function handleSaveToFavorites() {
    const nameParts = [entityType, entityName].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join(" — ") : formatLocation(location);

    addFavorite({ name, location, entityType, entityName });
    setSaved(true);
    setTimeout(() => setMenuPos(null), 800);
  }

  return (
    <>
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title="Click to teleport (or copy !tp command) · Right-click to save"
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

      {menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ left: menuPos.x, top: menuPos.y }}
            className="fixed z-50 min-w-[180px] py-1 rounded border border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)] shadow-lg"
          >
            <button
              onClick={handleSaveToFavorites}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-[var(--color-satisfactory-dark)] transition-colors"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-[var(--color-connected)]" />
                  <span className="text-[var(--color-connected)]">Saved!</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 text-[var(--color-satisfactory-orange)]" />
                  <span>Save to Favorites</span>
                </>
              )}
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
