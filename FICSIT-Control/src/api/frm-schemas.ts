import { z } from "zod";

export const FRMPowerCircuitSchema = z.object({
  CircuitGroupID: z.number(),
  PowerProduction: z.number(),
  PowerConsumed: z.number(),
  PowerCapacity: z.number(),
  PowerMaxConsumed: z.number(),
  BatteryInput: z.number(),
  BatteryOutput: z.number(),
  BatteryDifferential: z.number(),
  BatteryPercent: z.number(),
  BatteryCapacity: z.number(),
  BatteryTimeEmpty: z.string(),
  BatteryTimeFull: z.string(),
  FuseTriggered: z.boolean(),
});

export const FRMProdStatSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  ProdPerMin: z.string(),
  ProdPercent: z.number(),
  ConsPercent: z.number(),
  CurrentProd: z.number(),
  MaxProd: z.number(),
  CurrentConsumed: z.number(),
  MaxConsumed: z.number(),
  Type: z.string(),
});

export const FRMInventoryItemSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  Amount: z.number(),
  MaxAmount: z.number(),
});

export const FRMStorageContainerSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  location: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  Inventory: z.array(FRMInventoryItemSchema),
});

// FRM API returns lowercase `production` / `ingredients`; normalise to PascalCase
// so the rest of the codebase can use consistent casing.
function normaliseMachineKeys(val: unknown): unknown {
  if (typeof val !== "object" || val === null || Array.isArray(val)) return val;
  const obj = val as Record<string, unknown>;
  if ("production" in obj && !("Production" in obj)) obj.Production = obj.production;
  if ("ingredients" in obj && !("Ingredients" in obj)) obj.Ingredients = obj.ingredients;
  return obj;
}

export const FRMMachineSchema = z.preprocess(normaliseMachineKeys, z.object({
  Name: z.string(),
  ClassName: z.string(),
  location: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
  Recipe: z.string().default(""),
  RecipeClassName: z.string().default(""),
  Production: z.array(z.object({
    Name: z.string(),
    ClassName: z.string(),
    Amount: z.number(),
    CurrentProd: z.number(),
    MaxProd: z.number(),
    ProdPercent: z.number(),
  })).default([]),
  Ingredients: z.array(z.object({
    Name: z.string(),
    ClassName: z.string(),
    Amount: z.number(),
    CurrentConsumed: z.number(),
    MaxConsumed: z.number(),
    ConsPercent: z.number(),
  })).default([]),
  IsProducing: z.boolean().default(false),
  IsPaused: z.boolean().default(false),
  CircuitGroupID: z.number().default(0),
  PowerInfo: z.object({
    CircuitGroupID: z.number(),
    PowerConsumed: z.number(),
    MaxPowerConsumed: z.number(),
  }).default({ CircuitGroupID: 0, PowerConsumed: 0, MaxPowerConsumed: 0 }),
}).passthrough());

export const FRMPlayerSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  location: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  PlayerHP: z.number(),
});

export const FRMGeneratorSchema = z.object({
  ID: z.string(),
  Name: z.string(),
  ClassName: z.string(),
  location: z.object({ x: z.number(), y: z.number(), z: z.number(), rotation: z.number() }),
  BaseProd: z.number(),
  DynamicProdCapacity: z.number(),
  RegulatedDemandProd: z.number(),
  IsFullSpeed: z.boolean(),
  CanStart: z.boolean(),
  CurrentPotential: z.number(),
  PowerProductionPotential: z.number(),
  FuelAmount: z.number(),
  FuelResource: z.string(),
  NuclearWarning: z.string().default(""),
  GeoMinPower: z.number().default(0),
  GeoMaxPower: z.number().default(0),
  AvailableFuel: z.array(z.object({
    Name: z.string(),
    ClassName: z.string(),
    Amount: z.number(),
  })).default([]),
  Supplement: z.object({
    Name: z.string(),
    ClassName: z.string(),
    CurrentConsumed: z.number(),
    MaxConsumed: z.number(),
    PercentFull: z.number(),
  }).default({ Name: "", ClassName: "", CurrentConsumed: 0, MaxConsumed: 0, PercentFull: 0 }),
  PowerInfo: z.object({
    CircuitGroupID: z.number(),
    CircuitID: z.number(),
    FuseTriggered: z.boolean(),
    PowerConsumed: z.number(),
    MaxPowerConsumed: z.number(),
  }).default({ CircuitGroupID: 0, CircuitID: 0, FuseTriggered: false, PowerConsumed: 0, MaxPowerConsumed: 0 }),
}).passthrough();

export const FRMCableSchema = z.object({
  ID: z.string(),
  Name: z.string(),
  ClassName: z.string(),
  location0: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  Connected0: z.boolean(),
  location1: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  Connected1: z.boolean(),
  Length: z.number(),
}).passthrough();

export const FRMSwitchSchema = z.object({
  ID: z.string(),
  Name: z.string(),
  SwitchTag: z.string().default(""),
  ClassName: z.string(),
  IsOn: z.boolean(),
  Connected0: z.number(),
  Connected1: z.number(),
  Primary: z.number(),
  Secondary: z.number(),
  Priority: z.number().default(-1),
  location: z.object({ x: z.number(), y: z.number(), z: z.number(), rotation: z.number() }),
}).passthrough();

export const FRMBeltSchema = z.object({
  ID: z.string(),
  Name: z.string(),
  ClassName: z.string(),
  location0: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  Connected0: z.boolean(),
  location1: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  Connected1: z.boolean(),
  Length: z.number(),
  ItemsPerMinute: z.number(),
}).passthrough();

export const BeltArraySchema = z.array(FRMBeltSchema);

// Array schemas for validating endpoint responses
export const PowerCircuitArraySchema = z.array(FRMPowerCircuitSchema);
export const ProdStatArraySchema = z.array(FRMProdStatSchema);
export const StorageContainerArraySchema = z.array(FRMStorageContainerSchema);
export const MachineArraySchema = z.array(FRMMachineSchema);
export const PlayerArraySchema = z.array(FRMPlayerSchema);
export const GeneratorArraySchema = z.array(FRMGeneratorSchema);
export const CableArraySchema = z.array(FRMCableSchema);
export const SwitchArraySchema = z.array(FRMSwitchSchema);

export const FRMRecipeItemSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  Amount: z.number(),
});

export const FRMRecipeSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  Ingredients: z.array(FRMRecipeItemSchema).default([]),
  Products: z.array(FRMRecipeItemSchema).default([]),
}).passthrough();

export const RecipeArraySchema = z.array(FRMRecipeSchema);
