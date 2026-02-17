import { z } from "zod";

// -- Capabilities --

export const ControlFeatureMapSchema = z.object({
  resetFuse: z.boolean().default(false),
  toggleGeneratorGroup: z.boolean().default(false),
  toggleBuilding: z.boolean().default(false),
  setRecipe: z.boolean().default(false),
  setOverclock: z.boolean().default(false),
});

export const CapabilitiesResponseSchema = z.object({
  version: z.string(),
  features: ControlFeatureMapSchema,
  limits: z.object({
    commandsPerSecond: z.number().default(5),
  }),
});

// -- Command enums --

export const CommandTypeSchema = z.enum([
  "RESET_FUSE",
  "TOGGLE_GENERATOR_GROUP",
  "TOGGLE_BUILDING",
  "SET_RECIPE",
  "SET_OVERCLOCK",
]);

export const CommandStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);

// -- Per-command payloads --

export const ResetFusePayloadSchema = z.object({
  circuitId: z.number(),
});

export const ToggleGeneratorGroupPayloadSchema = z.object({
  groupId: z.string(),
  enabled: z.boolean(),
});

export const ToggleBuildingPayloadSchema = z.object({
  buildingId: z.string(),
  enabled: z.boolean(),
});

export const SetRecipePayloadSchema = z.object({
  machineId: z.string(),
  recipeId: z.string(),
});

export const SetOverclockPayloadSchema = z.object({
  machineId: z.string(),
  clockPercent: z.number().min(0).max(250),
});

export const PayloadSchemaByType = {
  RESET_FUSE: ResetFusePayloadSchema,
  TOGGLE_GENERATOR_GROUP: ToggleGeneratorGroupPayloadSchema,
  TOGGLE_BUILDING: ToggleBuildingPayloadSchema,
  SET_RECIPE: SetRecipePayloadSchema,
  SET_OVERCLOCK: SetOverclockPayloadSchema,
} as const;

// -- Command request / response --

export const CommandRequestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  type: CommandTypeSchema,
  payload: z.unknown(),
});

export const CommandResponseSchema = z.object({
  commandId: z.string(),
  status: CommandStatusSchema,
  result: z.unknown().nullable().default(null),
  error: z.string().nullable().default(null),
});

// -- WebSocket events --

export const CommandStatusEventSchema = z.object({
  event: z.literal("COMMAND_STATUS"),
  commandId: z.string(),
  status: CommandStatusSchema,
  result: z.unknown().nullable().default(null),
  error: z.string().nullable().default(null),
});
