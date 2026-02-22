import { useState } from "react";
import { Star, Plus, Trash2, Pencil, Check, X, MapPin } from "lucide-react";
import { useFavoritesStore, type FavoriteLocation } from "../../stores/favorites-store";
import { LocationBadge } from "../assets/LocationBadge";

function AddLocationForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [z, setZ] = useState("");
  const [notes, setNotes] = useState("");
  const addFavorite = useFavoritesStore((s) => s.addFavorite);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const xn = parseFloat(x);
    const yn = parseFloat(y);
    const zn = parseFloat(z);
    if (!name.trim() || isNaN(xn) || isNaN(yn) || isNaN(zn)) return;

    addFavorite({
      name: name.trim(),
      location: { x: xn, y: yn, z: zn },
      notes: notes.trim() || undefined,
    });
    onClose();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Add Custom Location</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-[var(--color-satisfactory-dark)] rounded transition-colors"
        >
          <X className="w-4 h-4 text-[var(--color-satisfactory-text-dim)]" />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 mb-3">
        <div>
          <label className="text-xs text-[var(--color-satisfactory-text-dim)] block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Base"
            required
            className="w-full px-2 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-satisfactory-text-dim)] block mb-1">X</label>
          <input
            type="number"
            value={x}
            onChange={(e) => setX(e.target.value)}
            required
            className="w-24 px-2 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-satisfactory-text-dim)] block mb-1">Y</label>
          <input
            type="number"
            value={y}
            onChange={(e) => setY(e.target.value)}
            required
            className="w-24 px-2 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-satisfactory-text-dim)] block mb-1">Z</label>
          <input
            type="number"
            value={z}
            onChange={(e) => setZ(e.target.value)}
            required
            className="w-24 px-2 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-[var(--color-satisfactory-text-dim)] block mb-1">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional description..."
          className="w-full px-2 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
        />
      </div>

      <button
        type="submit"
        className="px-3 py-1.5 text-sm bg-[var(--color-satisfactory-orange)] text-black rounded hover:brightness-110 transition-all"
      >
        Save Location
      </button>
    </form>
  );
}

function FavoriteRow({ fav }: { fav: FavoriteLocation }) {
  const { removeFavorite, updateFavorite } = useFavoritesStore();
  const [editing, setEditing] = useState<"name" | "notes" | "location" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editCoords, setEditCoords] = useState({ x: "", y: "", z: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  function startEdit(field: "name" | "notes" | "location") {
    setEditing(field);
    if (field === "location") {
      setEditCoords({
        x: String(Math.round(fav.location.x)),
        y: String(Math.round(fav.location.y)),
        z: String(Math.round(fav.location.z)),
      });
    } else {
      setEditValue(field === "name" ? fav.name : fav.notes ?? "");
    }
  }

  function saveEdit() {
    if (!editing) return;
    if (editing === "location") {
      const x = parseFloat(editCoords.x);
      const y = parseFloat(editCoords.y);
      const z = parseFloat(editCoords.z);
      if (isNaN(x) || isNaN(y) || isNaN(z)) return;
      updateFavorite(fav.id, { location: { x, y, z } });
    } else {
      if (editing === "name" && !editValue.trim()) return;
      updateFavorite(fav.id, { [editing]: editValue.trim() || undefined });
    }
    setEditing(null);
  }

  function cancelEdit() {
    setEditing(null);
  }

  return (
    <div className="flex items-start gap-4 px-4 py-3 border-b border-[var(--color-satisfactory-border)] last:border-b-0 group">
      {/* Left: info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {editing === "name" ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className="px-2 py-0.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
                autoFocus
              />
              <button onClick={saveEdit} className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded">
                <Check className="w-3.5 h-3.5 text-[var(--color-connected)]" />
              </button>
              <button onClick={cancelEdit} className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded">
                <X className="w-3.5 h-3.5 text-[var(--color-satisfactory-text-dim)]" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium text-[var(--color-satisfactory-text)] truncate">
                {fav.name}
              </span>
              <button
                onClick={() => startEdit("name")}
                className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit name"
              >
                <Pencil className="w-3 h-3 text-[var(--color-satisfactory-text-dim)]" />
              </button>
            </>
          )}
        </div>

        {/* Entity info */}
        {(fav.entityType || fav.entityName) && (
          <div className="text-xs text-[var(--color-satisfactory-text-dim)] mb-1">
            {[fav.entityType, fav.entityName].filter(Boolean).join(" — ")}
          </div>
        )}

        {/* Notes */}
        {editing === "notes" ? (
          <div className="flex items-center gap-1 mt-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              placeholder="Add notes..."
              className="px-2 py-0.5 text-xs bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded focus:outline-none focus:border-[var(--color-satisfactory-orange)] flex-1 max-w-xs"
              autoFocus
            />
            <button onClick={saveEdit} className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded">
              <Check className="w-3 h-3 text-[var(--color-connected)]" />
            </button>
            <button onClick={cancelEdit} className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded">
              <X className="w-3 h-3 text-[var(--color-satisfactory-text-dim)]" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-1">
            {fav.notes ? (
              <span className="text-xs text-[var(--color-satisfactory-text-dim)] italic">{fav.notes}</span>
            ) : (
              <span className="text-xs text-[var(--color-satisfactory-text-dim)]/50 opacity-0 group-hover:opacity-100 transition-opacity">
                Add notes...
              </span>
            )}
            <button
              onClick={() => startEdit("notes")}
              className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit notes"
            >
              <Pencil className="w-3 h-3 text-[var(--color-satisfactory-text-dim)]" />
            </button>
          </div>
        )}
      </div>

      {/* Right: location + actions */}
      <div className="flex items-center gap-3 shrink-0">
        {editing === "location" ? (
          <div className="flex items-center gap-1.5">
            {(["x", "y", "z"] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-0.5">
                <span className="text-[10px] text-[var(--color-satisfactory-text-dim)] uppercase">{axis}</span>
                <input
                  type="number"
                  value={editCoords[axis]}
                  onChange={(e) => setEditCoords((c) => ({ ...c, [axis]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus={axis === "x"}
                  className="w-20 px-1.5 py-0.5 text-xs font-mono bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded focus:outline-none focus:border-[var(--color-satisfactory-orange)]"
                />
              </div>
            ))}
            <button onClick={saveEdit} className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded" title="Save">
              <Check className="w-3.5 h-3.5 text-[var(--color-connected)]" />
            </button>
            <button onClick={cancelEdit} className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded" title="Cancel">
              <X className="w-3.5 h-3.5 text-[var(--color-satisfactory-text-dim)]" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <LocationBadge location={fav.location} entityType={fav.entityType} entityName={fav.entityName} />
            <button
              onClick={() => startEdit("location")}
              className="p-0.5 hover:bg-[var(--color-satisfactory-dark)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit coordinates"
            >
              <Pencil className="w-3 h-3 text-[var(--color-satisfactory-text-dim)]" />
            </button>
          </div>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => removeFavorite(fav.id)}
              className="px-2 py-0.5 text-xs bg-[var(--color-disconnected)] text-white rounded hover:brightness-110"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-0.5 text-xs text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1 hover:bg-[var(--color-satisfactory-dark)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete favorite"
          >
            <Trash2 className="w-4 h-4 text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-disconnected)]" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function FavoritesView() {
  const { favorites } = useFavoritesStore();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-[var(--color-satisfactory-orange)]" />
          Favorite Locations
          {favorites.length > 0 && (
            <span className="text-sm font-normal text-[var(--color-satisfactory-text-dim)]">
              ({favorites.length})
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] rounded hover:border-[var(--color-satisfactory-orange)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Add form */}
      {showAddForm && <AddLocationForm onClose={() => setShowAddForm(false)} />}

      {/* Favorites list */}
      {favorites.length === 0 ? (
        <div className="p-12 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-[var(--color-satisfactory-text-dim)]/30" />
          <p className="text-[var(--color-satisfactory-text-dim)] mb-2">No favorite locations saved yet</p>
          <p className="text-xs text-[var(--color-satisfactory-text-dim)]/60">
            Right-click any location badge in the Assets or Power Grid tabs to save it here,
            or use the "Add Location" button above to enter coordinates manually.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--color-satisfactory-border)] rounded-lg overflow-hidden bg-[var(--color-satisfactory-panel)]">
          {/* Column header */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs text-[var(--color-satisfactory-text-dim)] bg-[var(--color-satisfactory-dark)] border-b border-[var(--color-satisfactory-border)]">
            <span className="flex-1">Name</span>
            <span className="w-48 text-right">Location</span>
            <span className="w-20" />
          </div>

          {favorites.map((fav) => (
            <FavoriteRow key={fav.id} fav={fav} />
          ))}
        </div>
      )}
    </div>
  );
}
