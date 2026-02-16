import { z } from "zod";

const FRM_URL = process.env.FRM_URL || "http://localhost:8080";
const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`FRM request timed out after ${FETCH_TIMEOUT_MS / 1000}s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function frmFetch<T>(endpoint: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetchWithTimeout(`${FRM_URL}/${endpoint}`);
  if (!response.ok) {
    throw new Error(
      `FRM request to ${endpoint} failed: ${response.status} ${response.statusText}`
    );
  }
  const json: unknown = await response.json();
  return schema.parse(json);
}

// FRM response Zod schemas & derived types

const PowerCircuitSchema = z.object({
  CircuitGroupID: z.number(),
  PowerProduction: z.number(),
  PowerConsumed: z.number(),
  PowerCapacity: z.number(),
  PowerMaxConsumed: z.number(),
  BatteryPercent: z.number(),
  BatteryCapacity: z.number(),
  BatteryTimeEmpty: z.string(),
  BatteryTimeFull: z.string(),
  FuseTriggered: z.boolean(),
});
export type PowerCircuit = z.infer<typeof PowerCircuitSchema>;
export const PowerCircuitArraySchema = z.array(PowerCircuitSchema);

const ProdStatSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  ProdPercent: z.number(),
  ConsPercent: z.number(),
  CurrentProd: z.number(),
  MaxProd: z.number(),
  CurrentConsumed: z.number(),
  MaxConsumed: z.number(),
});
export type ProdStat = z.infer<typeof ProdStatSchema>;
export const ProdStatArraySchema = z.array(ProdStatSchema);

const InventoryItemSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  Amount: z.number(),
  MaxAmount: z.number(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

const StorageContainerSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  Inventory: z.array(InventoryItemSchema),
});
export type StorageContainer = z.infer<typeof StorageContainerSchema>;
export const StorageContainerArraySchema = z.array(StorageContainerSchema);

const MachineSchema = z.object({
  Name: z.string(),
  ClassName: z.string(),
  Recipe: z.string(),
  RecipeClassName: z.string(),
  IsProducing: z.boolean(),
  IsPaused: z.boolean(),
  Production: z.array(z.object({
    Name: z.string(),
    Amount: z.number(),
    CurrentProd: z.number(),
    MaxProd: z.number(),
    ProdPercent: z.number(),
  })),
  Ingredients: z.array(z.object({
    Name: z.string(),
    Amount: z.number(),
    CurrentConsumed: z.number(),
    MaxConsumed: z.number(),
    ConsPercent: z.number(),
  })),
  PowerInfo: z.object({
    CircuitGroupID: z.number(),
    PowerConsumed: z.number(),
    MaxPowerConsumed: z.number(),
  }),
});
export type Machine = z.infer<typeof MachineSchema>;
export const MachineArraySchema = z.array(MachineSchema);

export async function getPower(): Promise<PowerCircuit[]> {
  return frmFetch("getPower", PowerCircuitArraySchema);
}

export async function getProdStats(): Promise<ProdStat[]> {
  return frmFetch("getProdStats", ProdStatArraySchema);
}

export async function getStorageInv(): Promise<StorageContainer[]> {
  return frmFetch("getStorageInv", StorageContainerArraySchema);
}

const MACHINE_ENDPOINTS = [
  "getAssembler",
  "getSmelter",
  "getConstructor",
  "getRefinery",
  "getManufacturer",
  "getFoundry",
  "getBlender",
  "getPackager",
] as const;

export async function getAllMachines(): Promise<Machine[]> {
  const results = await Promise.allSettled(
    MACHINE_ENDPOINTS.map((ep) => frmFetch(ep, MachineArraySchema))
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function getMachinesByType(
  type: string
): Promise<Machine[]> {
  const endpoint = MACHINE_ENDPOINTS.find(
    (ep) => ep.toLowerCase().includes(type.toLowerCase())
  );
  if (!endpoint) {
    throw new Error(
      `Unknown machine type: ${type}. Valid types: ${MACHINE_ENDPOINTS.map((e) => e.replace("get", "")).join(", ")}`
    );
  }
  return frmFetch(endpoint, MachineArraySchema);
}
