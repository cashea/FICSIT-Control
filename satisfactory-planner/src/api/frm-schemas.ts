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

export const FRMMachineSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  location: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  Recipe: z.string(),
  RecipeClassName: z.string(),
  Production: z.array(z.object({
    Name: z.string(),
    ClassName: z.string(),
    Amount: z.number(),
    CurrentProd: z.number(),
    MaxProd: z.number(),
    ProdPercent: z.number(),
  })),
  Ingredients: z.array(z.object({
    Name: z.string(),
    ClassName: z.string(),
    Amount: z.number(),
    CurrentConsumed: z.number(),
    MaxConsumed: z.number(),
    ConsPercent: z.number(),
  })),
  IsProducing: z.boolean(),
  IsPaused: z.boolean(),
  CircuitGroupID: z.number(),
  PowerInfo: z.object({
    CircuitGroupID: z.number(),
    PowerConsumed: z.number(),
    MaxPowerConsumed: z.number(),
  }),
});

export const FRMPlayerSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  location: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  PlayerHP: z.number(),
});

// Array schemas for validating endpoint responses
export const PowerCircuitArraySchema = z.array(FRMPowerCircuitSchema);
export const ProdStatArraySchema = z.array(FRMProdStatSchema);
export const StorageContainerArraySchema = z.array(FRMStorageContainerSchema);
export const MachineArraySchema = z.array(FRMMachineSchema);
export const PlayerArraySchema = z.array(FRMPlayerSchema);
