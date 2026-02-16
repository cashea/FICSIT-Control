import type { Recipe } from "../types";

export const RECIPES: Record<string, Recipe> = {
  // === SMELTER RECIPES ===
  "iron-ingot": {
    id: "iron-ingot",
    name: "Iron Ingot",
    buildingId: "smelter",
    cycleDuration: 2,
    inputs: [{ itemId: "iron-ore", amount: 1, ratePerMinute: 30 }],
    outputs: [{ itemId: "iron-ingot", amount: 1, ratePerMinute: 30 }],
    primaryOutputId: "iron-ingot",
    isAlternate: false,
    defaultRecipeId: null,
  },
  "copper-ingot": {
    id: "copper-ingot",
    name: "Copper Ingot",
    buildingId: "smelter",
    cycleDuration: 2,
    inputs: [{ itemId: "copper-ore", amount: 1, ratePerMinute: 30 }],
    outputs: [{ itemId: "copper-ingot", amount: 1, ratePerMinute: 30 }],
    primaryOutputId: "copper-ingot",
    isAlternate: false,
    defaultRecipeId: null,
  },

  // === FOUNDRY RECIPES ===
  "steel-ingot": {
    id: "steel-ingot",
    name: "Steel Ingot",
    buildingId: "foundry",
    cycleDuration: 4,
    inputs: [
      { itemId: "iron-ore", amount: 3, ratePerMinute: 45 },
      { itemId: "coal", amount: 3, ratePerMinute: 45 },
    ],
    outputs: [{ itemId: "steel-ingot", amount: 3, ratePerMinute: 45 }],
    primaryOutputId: "steel-ingot",
    isAlternate: false,
    defaultRecipeId: null,
  },

  // === CONSTRUCTOR RECIPES ===
  "iron-plate": {
    id: "iron-plate",
    name: "Iron Plate",
    buildingId: "constructor",
    cycleDuration: 6,
    inputs: [{ itemId: "iron-ingot", amount: 3, ratePerMinute: 30 }],
    outputs: [{ itemId: "iron-plate", amount: 2, ratePerMinute: 20 }],
    primaryOutputId: "iron-plate",
    isAlternate: false,
    defaultRecipeId: null,
  },
  "iron-rod": {
    id: "iron-rod",
    name: "Iron Rod",
    buildingId: "constructor",
    cycleDuration: 4,
    inputs: [{ itemId: "iron-ingot", amount: 1, ratePerMinute: 15 }],
    outputs: [{ itemId: "iron-rod", amount: 1, ratePerMinute: 15 }],
    primaryOutputId: "iron-rod",
    isAlternate: false,
    defaultRecipeId: null,
  },
  screw: {
    id: "screw",
    name: "Screw",
    buildingId: "constructor",
    cycleDuration: 6,
    inputs: [{ itemId: "iron-rod", amount: 1, ratePerMinute: 10 }],
    outputs: [{ itemId: "screw", amount: 4, ratePerMinute: 40 }],
    primaryOutputId: "screw",
    isAlternate: false,
    defaultRecipeId: null,
  },
  wire: {
    id: "wire",
    name: "Wire",
    buildingId: "constructor",
    cycleDuration: 4,
    inputs: [{ itemId: "copper-ingot", amount: 1, ratePerMinute: 15 }],
    outputs: [{ itemId: "wire", amount: 2, ratePerMinute: 30 }],
    primaryOutputId: "wire",
    isAlternate: false,
    defaultRecipeId: null,
  },
  cable: {
    id: "cable",
    name: "Cable",
    buildingId: "constructor",
    cycleDuration: 2,
    inputs: [{ itemId: "wire", amount: 2, ratePerMinute: 60 }],
    outputs: [{ itemId: "cable", amount: 1, ratePerMinute: 30 }],
    primaryOutputId: "cable",
    isAlternate: false,
    defaultRecipeId: null,
  },
  concrete: {
    id: "concrete",
    name: "Concrete",
    buildingId: "constructor",
    cycleDuration: 4,
    inputs: [{ itemId: "limestone", amount: 3, ratePerMinute: 45 }],
    outputs: [{ itemId: "concrete", amount: 1, ratePerMinute: 15 }],
    primaryOutputId: "concrete",
    isAlternate: false,
    defaultRecipeId: null,
  },
  "steel-beam": {
    id: "steel-beam",
    name: "Steel Beam",
    buildingId: "constructor",
    cycleDuration: 4,
    inputs: [{ itemId: "steel-ingot", amount: 4, ratePerMinute: 60 }],
    outputs: [{ itemId: "steel-beam", amount: 1, ratePerMinute: 15 }],
    primaryOutputId: "steel-beam",
    isAlternate: false,
    defaultRecipeId: null,
  },
  "steel-pipe": {
    id: "steel-pipe",
    name: "Steel Pipe",
    buildingId: "constructor",
    cycleDuration: 6,
    inputs: [{ itemId: "steel-ingot", amount: 3, ratePerMinute: 30 }],
    outputs: [{ itemId: "steel-pipe", amount: 2, ratePerMinute: 20 }],
    primaryOutputId: "steel-pipe",
    isAlternate: false,
    defaultRecipeId: null,
  },

  // === ASSEMBLER RECIPES ===
  "reinforced-iron-plate": {
    id: "reinforced-iron-plate",
    name: "Reinforced Iron Plate",
    buildingId: "assembler",
    cycleDuration: 12,
    inputs: [
      { itemId: "iron-plate", amount: 6, ratePerMinute: 30 },
      { itemId: "screw", amount: 12, ratePerMinute: 60 },
    ],
    outputs: [
      {
        itemId: "reinforced-iron-plate",
        amount: 1,
        ratePerMinute: 5,
      },
    ],
    primaryOutputId: "reinforced-iron-plate",
    isAlternate: false,
    defaultRecipeId: null,
  },
  rotor: {
    id: "rotor",
    name: "Rotor",
    buildingId: "assembler",
    cycleDuration: 15,
    inputs: [
      { itemId: "iron-rod", amount: 5, ratePerMinute: 20 },
      { itemId: "screw", amount: 25, ratePerMinute: 100 },
    ],
    outputs: [{ itemId: "rotor", amount: 1, ratePerMinute: 4 }],
    primaryOutputId: "rotor",
    isAlternate: false,
    defaultRecipeId: null,
  },
  stator: {
    id: "stator",
    name: "Stator",
    buildingId: "assembler",
    cycleDuration: 12,
    inputs: [
      { itemId: "steel-pipe", amount: 3, ratePerMinute: 15 },
      { itemId: "wire", amount: 8, ratePerMinute: 40 },
    ],
    outputs: [{ itemId: "stator", amount: 1, ratePerMinute: 5 }],
    primaryOutputId: "stator",
    isAlternate: false,
    defaultRecipeId: null,
  },
  "modular-frame": {
    id: "modular-frame",
    name: "Modular Frame",
    buildingId: "assembler",
    cycleDuration: 60,
    inputs: [
      { itemId: "reinforced-iron-plate", amount: 3, ratePerMinute: 3 },
      { itemId: "iron-rod", amount: 12, ratePerMinute: 12 },
    ],
    outputs: [{ itemId: "modular-frame", amount: 2, ratePerMinute: 2 }],
    primaryOutputId: "modular-frame",
    isAlternate: false,
    defaultRecipeId: null,
  },
  motor: {
    id: "motor",
    name: "Motor",
    buildingId: "assembler",
    cycleDuration: 12,
    inputs: [
      { itemId: "rotor", amount: 2, ratePerMinute: 10 },
      { itemId: "stator", amount: 2, ratePerMinute: 10 },
    ],
    outputs: [{ itemId: "motor", amount: 1, ratePerMinute: 5 }],
    primaryOutputId: "motor",
    isAlternate: false,
    defaultRecipeId: null,
  },
  "encased-industrial-beam": {
    id: "encased-industrial-beam",
    name: "Encased Industrial Beam",
    buildingId: "assembler",
    cycleDuration: 10,
    inputs: [
      { itemId: "steel-beam", amount: 4, ratePerMinute: 24 },
      { itemId: "concrete", amount: 5, ratePerMinute: 30 },
    ],
    outputs: [
      {
        itemId: "encased-industrial-beam",
        amount: 1,
        ratePerMinute: 6,
      },
    ],
    primaryOutputId: "encased-industrial-beam",
    isAlternate: false,
    defaultRecipeId: null,
  },

  // === MANUFACTURER RECIPES ===
  "heavy-modular-frame": {
    id: "heavy-modular-frame",
    name: "Heavy Modular Frame",
    buildingId: "manufacturer",
    cycleDuration: 30,
    inputs: [
      { itemId: "modular-frame", amount: 5, ratePerMinute: 10 },
      { itemId: "steel-pipe", amount: 15, ratePerMinute: 30 },
      { itemId: "encased-industrial-beam", amount: 5, ratePerMinute: 10 },
      { itemId: "screw", amount: 100, ratePerMinute: 200 },
    ],
    outputs: [
      {
        itemId: "heavy-modular-frame",
        amount: 1,
        ratePerMinute: 2,
      },
    ],
    primaryOutputId: "heavy-modular-frame",
    isAlternate: false,
    defaultRecipeId: null,
  },

  // === REFINERY RECIPES ===
  plastic: {
    id: "plastic",
    name: "Plastic",
    buildingId: "refinery",
    cycleDuration: 6,
    inputs: [{ itemId: "crude-oil", amount: 3, ratePerMinute: 30 }],
    outputs: [
      { itemId: "plastic", amount: 2, ratePerMinute: 20 },
      { itemId: "heavy-oil-residue", amount: 1, ratePerMinute: 10 },
    ],
    primaryOutputId: "plastic",
    isAlternate: false,
    defaultRecipeId: null,
  },
  rubber: {
    id: "rubber",
    name: "Rubber",
    buildingId: "refinery",
    cycleDuration: 6,
    inputs: [{ itemId: "crude-oil", amount: 3, ratePerMinute: 30 }],
    outputs: [
      { itemId: "rubber", amount: 2, ratePerMinute: 20 },
      { itemId: "heavy-oil-residue", amount: 2, ratePerMinute: 20 },
    ],
    primaryOutputId: "rubber",
    isAlternate: false,
    defaultRecipeId: null,
  },
  fuel: {
    id: "fuel",
    name: "Fuel",
    buildingId: "refinery",
    cycleDuration: 6,
    inputs: [{ itemId: "crude-oil", amount: 6, ratePerMinute: 60 }],
    outputs: [
      { itemId: "fuel", amount: 4, ratePerMinute: 40 },
      { itemId: "heavy-oil-residue", amount: 3, ratePerMinute: 30 },
    ],
    primaryOutputId: "fuel",
    isAlternate: false,
    defaultRecipeId: null,
  },

  // === ALTERNATE RECIPES ===
  "alt-iron-wire": {
    id: "alt-iron-wire",
    name: "Iron Wire",
    buildingId: "constructor",
    cycleDuration: 24,
    inputs: [{ itemId: "iron-ingot", amount: 5, ratePerMinute: 12.5 }],
    outputs: [{ itemId: "wire", amount: 9, ratePerMinute: 22.5 }],
    primaryOutputId: "wire",
    isAlternate: true,
    defaultRecipeId: "wire",
  },
  "alt-cast-screw": {
    id: "alt-cast-screw",
    name: "Cast Screw",
    buildingId: "constructor",
    cycleDuration: 24,
    inputs: [{ itemId: "iron-ingot", amount: 5, ratePerMinute: 12.5 }],
    outputs: [{ itemId: "screw", amount: 20, ratePerMinute: 50 }],
    primaryOutputId: "screw",
    isAlternate: true,
    defaultRecipeId: "screw",
  },
  "alt-steel-screw": {
    id: "alt-steel-screw",
    name: "Steel Screw",
    buildingId: "constructor",
    cycleDuration: 12,
    inputs: [{ itemId: "steel-beam", amount: 1, ratePerMinute: 5 }],
    outputs: [{ itemId: "screw", amount: 52, ratePerMinute: 260 }],
    primaryOutputId: "screw",
    isAlternate: true,
    defaultRecipeId: "screw",
  },
  "alt-bolted-iron-plate": {
    id: "alt-bolted-iron-plate",
    name: "Bolted Iron Plate",
    buildingId: "assembler",
    cycleDuration: 12,
    inputs: [
      { itemId: "iron-plate", amount: 18, ratePerMinute: 90 },
      { itemId: "screw", amount: 50, ratePerMinute: 250 },
    ],
    outputs: [
      {
        itemId: "reinforced-iron-plate",
        amount: 3,
        ratePerMinute: 15,
      },
    ],
    primaryOutputId: "reinforced-iron-plate",
    isAlternate: true,
    defaultRecipeId: "reinforced-iron-plate",
  },
  "alt-stitched-iron-plate": {
    id: "alt-stitched-iron-plate",
    name: "Stitched Iron Plate",
    buildingId: "assembler",
    cycleDuration: 32,
    inputs: [
      { itemId: "iron-plate", amount: 10, ratePerMinute: 18.75 },
      { itemId: "wire", amount: 20, ratePerMinute: 37.5 },
    ],
    outputs: [
      {
        itemId: "reinforced-iron-plate",
        amount: 3,
        ratePerMinute: 5.625,
      },
    ],
    primaryOutputId: "reinforced-iron-plate",
    isAlternate: true,
    defaultRecipeId: "reinforced-iron-plate",
  },
  "alt-pure-iron-ingot": {
    id: "alt-pure-iron-ingot",
    name: "Pure Iron Ingot",
    buildingId: "refinery",
    cycleDuration: 12,
    inputs: [
      { itemId: "iron-ore", amount: 7, ratePerMinute: 35 },
      { itemId: "water", amount: 4, ratePerMinute: 20 },
    ],
    outputs: [{ itemId: "iron-ingot", amount: 13, ratePerMinute: 65 }],
    primaryOutputId: "iron-ingot",
    isAlternate: true,
    defaultRecipeId: "iron-ingot",
  },
  "alt-solid-steel-ingot": {
    id: "alt-solid-steel-ingot",
    name: "Solid Steel Ingot",
    buildingId: "foundry",
    cycleDuration: 3,
    inputs: [
      { itemId: "iron-ingot", amount: 2, ratePerMinute: 40 },
      { itemId: "coal", amount: 2, ratePerMinute: 40 },
    ],
    outputs: [{ itemId: "steel-ingot", amount: 3, ratePerMinute: 60 }],
    primaryOutputId: "steel-ingot",
    isAlternate: true,
    defaultRecipeId: "steel-ingot",
  },
  "alt-bolted-frame": {
    id: "alt-bolted-frame",
    name: "Bolted Frame",
    buildingId: "assembler",
    cycleDuration: 24,
    inputs: [
      { itemId: "reinforced-iron-plate", amount: 3, ratePerMinute: 7.5 },
      { itemId: "screw", amount: 56, ratePerMinute: 140 },
    ],
    outputs: [
      { itemId: "modular-frame", amount: 2, ratePerMinute: 5 },
    ],
    primaryOutputId: "modular-frame",
    isAlternate: true,
    defaultRecipeId: "modular-frame",
  },
};

// Derived lookups
export const RECIPES_LIST = Object.values(RECIPES);

export const RECIPES_BY_OUTPUT: Record<string, Recipe[]> = {};
for (const recipe of RECIPES_LIST) {
  for (const output of recipe.outputs) {
    if (!RECIPES_BY_OUTPUT[output.itemId]) {
      RECIPES_BY_OUTPUT[output.itemId] = [];
    }
    RECIPES_BY_OUTPUT[output.itemId].push(recipe);
  }
}

export const DEFAULT_RECIPE_FOR_ITEM: Record<string, Recipe> = {};
for (const recipe of RECIPES_LIST) {
  if (!recipe.isAlternate) {
    DEFAULT_RECIPE_FOR_ITEM[recipe.primaryOutputId] = recipe;
  }
}
