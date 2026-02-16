import { useState, useRef, useEffect } from "react";
import type { Item } from "../../types";

interface ItemSelectProps {
  items: Item[];
  value: string | null;
  onChange: (itemId: string) => void;
  placeholder?: string;
}

export function ItemSelect({
  items,
  value,
  onChange,
  placeholder = "Search items...",
}: ItemSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = value ? items.find((i) => i.id === value) : null;

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={open ? search : selectedItem?.name ?? ""}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setSearch("");
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)]"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-[var(--color-satisfactory-panel)] border border-[var(--color-satisfactory-border)] rounded shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--color-satisfactory-text-dim)]">
              No items found
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id);
                  setSearch("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--color-satisfactory-border)]/30 transition-colors text-[var(--color-satisfactory-text)]"
              >
                {item.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
