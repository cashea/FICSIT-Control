import { useState } from "react";
import { MapPin, Plus, Trash2, Navigation, Loader2, Check, X } from "lucide-react";
import { useLocationsStore, type SavedLocation } from "../../stores/locations-store";
import { useConnectionStore } from "../../stores/connection-store";
import { useControlStore } from "../../stores/control-store";

type TeleportState = "idle" | "submitting" | "success" | "error";

function LocationRow({ location }: { location: SavedLocation }) {
  const { removeLocation, updateLocationName } = useLocationsStore();
  const { submitCommand, isFeatureAvailable, connectionStatus } = useControlStore();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(location.name);
  const [teleportState, setTeleportState] = useState<TeleportState>("idle");

  const canTeleport =
    connectionStatus === "connected" && isFeatureAvailable("teleportPlayer");

  const handleTeleport = async () => {
    setTeleportState("submitting");
    const commandId = await submitCommand("TELEPORT_PLAYER", {
      x: location.x,
      y: location.y,
      z: location.z,
    });
    setTeleportState(commandId ? "success" : "error");
    setTimeout(() => setTeleportState("idle"), 2000);
  };

  const handleNameCommit = () => {
    const trimmed = draftName.trim();
    if (trimmed) updateLocationName(location.id, trimmed);
    else setDraftName(location.name);
    setEditing(false);
  };

  return (
    <tr className="border-b border-[var(--color-satisfactory-border)] hover:bg-[var(--color-satisfactory-dark)]/40">
      <td className="py-2 px-3">
        {editing ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={handleNameCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameCommit();
              if (e.key === "Escape") {
                setDraftName(location.name);
                setEditing(false);
              }
            }}
            className="bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-orange)] rounded px-2 py-0.5 text-sm text-[var(--color-satisfactory-text)] w-full focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[var(--color-satisfactory-text)] hover:text-[var(--color-satisfactory-orange)] text-left w-full"
            title="Click to rename"
          >
            {location.name}
          </button>
        )}
      </td>
      <td className="py-2 px-3 text-sm text-[var(--color-satisfactory-text-dim)] font-mono">
        {location.x.toFixed(1)}
      </td>
      <td className="py-2 px-3 text-sm text-[var(--color-satisfactory-text-dim)] font-mono">
        {location.y.toFixed(1)}
      </td>
      <td className="py-2 px-3 text-sm text-[var(--color-satisfactory-text-dim)] font-mono">
        {location.z.toFixed(1)}
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          {canTeleport && (
            <button
              onClick={handleTeleport}
              disabled={teleportState === "submitting"}
              title="Teleport to this location"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded transition-colors bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] hover:bg-[var(--color-satisfactory-orange)]/30 disabled:opacity-50"
            >
              {teleportState === "submitting" && <Loader2 className="w-3 h-3 animate-spin" />}
              {teleportState === "success" && <Check className="w-3 h-3 text-[var(--color-connected)]" />}
              {teleportState === "error" && <X className="w-3 h-3 text-[var(--color-disconnected)]" />}
              {teleportState === "idle" && <Navigation className="w-3 h-3" />}
              {teleportState === "submitting" ? "..." : teleportState === "success" ? "Done" : teleportState === "error" ? "Failed" : "Teleport"}
            </button>
          )}
          <button
            onClick={() => removeLocation(location.id)}
            title="Delete location"
            className="p-1 text-[var(--color-satisfactory-text-dim)] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function LocationsView() {
  const { locations, addLocation } = useLocationsStore();
  const { client, status } = useConnectionStore();

  const [name, setName] = useState("");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [z, setZ] = useState("");
  const [captureState, setCaptureState] = useState<"idle" | "loading" | "error">("idle");
  const [captureError, setCaptureError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const px = parseFloat(x);
    const py = parseFloat(y);
    const pz = parseFloat(z);
    if (!name.trim() || isNaN(px) || isNaN(py) || isNaN(pz)) return;
    addLocation({ name: name.trim(), x: px, y: py, z: pz });
    setName("");
    setX("");
    setY("");
    setZ("");
  };

  const handleCapture = async () => {
    if (!client || status !== "connected") return;
    setCaptureState("loading");
    setCaptureError(null);
    try {
      const players = await client.getPlayer();
      if (players.length === 0) {
        setCaptureError("No player found");
        setCaptureState("error");
        return;
      }
      const player = players[0];
      const { x: px, y: py, z: pz } = player.location;
      const locationName = name.trim() || `Location ${locations.length + 1}`;
      addLocation({ name: locationName, x: px, y: py, z: pz });
      setName("");
      setCaptureState("idle");
    } catch {
      setCaptureError("Failed to get player position");
      setCaptureState("error");
    }
    setTimeout(() => {
      setCaptureState("idle");
      setCaptureError(null);
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 shrink-0">
        <MapPin className="w-5 h-5 text-[var(--color-satisfactory-orange)]" />
        Locations
      </h2>

      <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* Add location form */}
        <div className="bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] rounded-lg p-4 shrink-0">
          <h3 className="text-sm font-semibold text-[var(--color-satisfactory-text)] mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--color-satisfactory-orange)]" />
            Add Location
          </h3>

          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Location name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 min-w-32 bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded px-3 py-1.5 text-sm text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)] focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
              />
              <input
                type="number"
                placeholder="X"
                value={x}
                onChange={(e) => setX(e.target.value)}
                className="w-24 bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded px-3 py-1.5 text-sm text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)] font-mono focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
              />
              <input
                type="number"
                placeholder="Y"
                value={y}
                onChange={(e) => setY(e.target.value)}
                className="w-24 bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded px-3 py-1.5 text-sm text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)] font-mono focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
              />
              <input
                type="number"
                placeholder="Z"
                value={z}
                onChange={(e) => setZ(e.target.value)}
                className="w-24 bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded px-3 py-1.5 text-sm text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)] font-mono focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
              />
              <button
                type="submit"
                disabled={!name.trim() || x === "" || y === "" || z === ""}
                className="px-3 py-1.5 text-sm font-medium rounded bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] hover:bg-[var(--color-satisfactory-orange)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {status === "connected" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={captureState === "loading"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border border-[var(--color-satisfactory-border)] text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)] hover:border-[var(--color-satisfactory-orange)] disabled:opacity-50 transition-colors"
                >
                  {captureState === "loading" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  Capture Current Position
                </button>
                {captureError && (
                  <span className="text-xs text-red-400">{captureError}</span>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Locations table */}
        <div className="bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] rounded-lg overflow-hidden shrink-0">
          {locations.length === 0 ? (
            <p className="text-sm text-[var(--color-satisfactory-text-dim)] text-center py-8">
              No saved locations. Add one above or capture your current position.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-dark)]/60">
                  <th className="py-2 px-3 text-left text-xs font-semibold text-[var(--color-satisfactory-text-dim)] uppercase tracking-wide">
                    Name
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-[var(--color-satisfactory-text-dim)] uppercase tracking-wide">
                    X
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-[var(--color-satisfactory-text-dim)] uppercase tracking-wide">
                    Y
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-[var(--color-satisfactory-text-dim)] uppercase tracking-wide">
                    Z
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-[var(--color-satisfactory-text-dim)] uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <LocationRow key={loc.id} location={loc} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationsView;
