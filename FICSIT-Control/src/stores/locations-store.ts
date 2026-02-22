import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
}

interface LocationsState {
  locations: SavedLocation[];
  addLocation: (location: Omit<SavedLocation, "id">) => void;
  removeLocation: (id: string) => void;
  updateLocationName: (id: string, name: string) => void;
}

export const useLocationsStore = create<LocationsState>()(
  persist(
    (set) => ({
      locations: [],

      addLocation: (location) =>
        set((state) => ({
          locations: [
            ...state.locations,
            { ...location, id: crypto.randomUUID() },
          ],
        })),

      removeLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        })),

      updateLocationName: (id, name) =>
        set((state) => ({
          locations: state.locations.map((loc) =>
            loc.id === id ? { ...loc, name } : loc
          ),
        })),
    }),
    {
      name: "satisfactory-locations",
    }
  )
);
