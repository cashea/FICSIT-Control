import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteLocation {
  id: string;
  name: string;
  location: { x: number; y: number; z: number };
  entityType?: string;
  entityName?: string;
  notes?: string;
  createdAt: number;
}

interface FavoritesState {
  favorites: FavoriteLocation[];

  addFavorite: (fav: Omit<FavoriteLocation, "id" | "createdAt">) => void;
  removeFavorite: (id: string) => void;
  updateFavorite: (id: string, updates: Partial<Pick<FavoriteLocation, "name" | "notes" | "location">>) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favorites: [],

      addFavorite: (fav) =>
        set((state) => ({
          favorites: [
            ...state.favorites,
            { ...fav, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })),

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),

      updateFavorite: (id, updates) =>
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.id === id ? { ...f, ...updates } : f,
          ),
        })),
    }),
    {
      name: "satisfactory-favorite-locations",
    },
  ),
);
