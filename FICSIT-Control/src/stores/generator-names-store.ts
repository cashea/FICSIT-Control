import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GeneratorNamesState {
  // Map of generator ID to custom suffix
  customSuffixes: Record<string, string>;
  
  setCustomSuffix: (generatorId: string, suffix: string) => void;
  getCustomSuffix: (generatorId: string) => string;
}

export const useGeneratorNamesStore = create<GeneratorNamesState>()(
  persist(
    (set, get) => ({
      customSuffixes: {},
      
      setCustomSuffix: (generatorId, suffix) =>
        set((state) => ({
          customSuffixes: {
            ...state.customSuffixes,
            [generatorId]: suffix,
          },
        })),
      
      getCustomSuffix: (generatorId) => {
        return get().customSuffixes[generatorId] ?? "";
      },
    }),
    {
      name: "satisfactory-generator-names",
    }
  )
);
